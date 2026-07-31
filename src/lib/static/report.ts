import { db } from "@/lib/db";

export type CallRow = {
  id: string; createdAt: Date; moneyWord: string; state: string; toNumber: string;
  fromNumber: string; forwardedTo: string; disposition: string; durationSec: number;
  priceCents: number; costCents: number;
};

// Static calls only (disposition starts with "static"), newest first.
export async function staticCallReport(limit = 500): Promise<CallRow[]> {
  const rows = await db.call.findMany({ where: { disposition: { startsWith: "static" } }, orderBy: { createdAt: "desc" }, take: limit });
  return rows.map((c) => ({
    id: c.id, createdAt: c.createdAt, moneyWord: c.moneyWord || "", state: c.state, toNumber: c.toNumber,
    fromNumber: c.fromNumber, forwardedTo: c.forwardedTo, disposition: c.disposition, durationSec: c.durationSec,
    priceCents: c.priceCents, costCents: c.costCents,
  }));
}

// Color band for a call duration (seconds): red 0-30, yellow 31-90, green 91+.
export function durationBand(sec: number): "red" | "yellow" | "green" {
  if (sec <= 30) return "red";
  if (sec <= 90) return "yellow";
  return "green";
}
