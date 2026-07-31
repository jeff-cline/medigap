import { db } from "@/lib/db";

export type Counts = { textsOutstanding: number; liveCalls: number; today: number; week: number; month: number; total: number };

// Offset (minutes) of America/Chicago at the given instant: wall-clock-as-UTC minus real UTC (negative, west).
function chicagoOffsetMin(dt: Date): number {
  const s = dt.toLocaleString("en-US", { timeZone: "America/Chicago", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const [datePart, timePart] = s.split(", ");
  const [mo, da, yr] = datePart.split("/").map(Number);
  const [hh, mm, ss] = (timePart || "00:00:00").split(":").map(Number);
  const wall = Date.UTC(yr, mo - 1, da, hh % 24, mm, ss);
  return Math.round((wall - dt.getTime()) / 60000);
}

// The CST/CDT calendar Y-M-D (and weekday 0=Sun) for the given instant.
function chicagoYMD(dt: Date): { y: number; m: number; d: number; wd: number } {
  const s = dt.toLocaleString("en-US", { timeZone: "America/Chicago", weekday: "short", year: "numeric", month: "2-digit", day: "2-digit" });
  // e.g. "Wed, 07/15/2026"
  const [wdStr, rest] = s.split(", ");
  const [mo, da, yr] = rest.split("/").map(Number);
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { y: yr, m: mo, d: da, wd: wdMap[wdStr] ?? 0 };
}

// UTC instant for Chicago-local midnight of the given Y-M-D.
function chicagoMidnightUTC(y: number, m: number, d: number): Date {
  const guess = new Date(Date.UTC(y, m - 1, d, 0, 0, 0)); // naive: pretend local midnight is UTC
  const off1 = chicagoOffsetMin(guess);
  let result = new Date(guess.getTime() - off1 * 60000);
  const off2 = chicagoOffsetMin(result); // re-check at the computed instant; correct once if it crossed a transition
  if (off2 !== off1) result = new Date(guess.getTime() - off2 * 60000);
  return result;
}

export function cstStartOf(now: Date, unit: "day" | "week" | "month"): Date {
  const { y, m, d, wd } = chicagoYMD(now);
  if (unit === "month") return chicagoMidnightUTC(y, m, 1);
  if (unit === "day") return chicagoMidnightUTC(y, m, d);
  // week: back up to Sunday by calendar date, then that date's CST midnight
  const sun = new Date(Date.UTC(y, m - 1, d - wd));
  return chicagoMidnightUTC(sun.getUTCFullYear(), sun.getUTCMonth() + 1, sun.getUTCDate());
}

const LIVE = ["in-progress", "ringing", "connected", "transferring"];

export async function notificationCounts(now: Date = new Date()): Promise<Counts> {
  const activeCutoff = new Date(now.getTime() - 15 * 60_000); // live = active status within 15 min (avoids stuck never-completed calls)
  const [textsOutstanding, liveCalls, today, week, month, total] = await Promise.all([
    db.smsMessage.count({ where: { direction: "inbound", readAt: null } }),
    db.call.count({ where: { status: { in: LIVE }, createdAt: { gte: activeCutoff } } }),
    db.call.count({ where: { createdAt: { gte: cstStartOf(now, "day") } } }),
    db.call.count({ where: { createdAt: { gte: cstStartOf(now, "week") } } }),
    db.call.count({ where: { createdAt: { gte: cstStartOf(now, "month") } } }),
    db.call.count(),
  ]);
  return { textsOutstanding, liveCalls, today, week, month, total };
}
