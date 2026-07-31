// Next business day (Mon–Fri) at a given CST hour:minute, as an epoch-ms instant.
// Matches the fixed-offset convention used by computeFollowupDueMs (followup.ts). Pure.
export function nextBusinessDayAtMs(nowMs: number, hour: number, minute: number): number {
  const h = Math.min(23, Math.max(0, Math.round(hour)));
  const m = Math.min(59, Math.max(0, Math.round(minute)));
  const wall = new Date(nowMs - 6 * 3600_000); // UTC fields read as CST wall-clock
  let d = new Date(Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate() + 1, h, m, 0));
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d = new Date(d.getTime() + 86400_000); // skip Sat/Sun
  return d.getTime() + 6 * 3600_000; // CST wall-clock back to real UTC
}
