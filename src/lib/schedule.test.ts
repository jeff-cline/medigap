import { describe, it, expect } from "vitest";
import { nextBusinessDayAtMs } from "./schedule";

// Read back the CST wall-clock parts using the same fixed -6 convention.
function cst(ms: number) {
  const d = new Date(ms - 6 * 3600_000);
  return { mo: d.getUTCMonth() + 1, day: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), dow: d.getUTCDay() };
}

describe("nextBusinessDayAtMs", () => {
  it("schedules the next day at the given time on a weekday", () => {
    // Wed 2026-07-29 12:00 CST
    const r = cst(nextBusinessDayAtMs(Date.parse("2026-07-29T18:00:00Z"), 9, 30));
    expect({ mo: r.mo, day: r.day, h: r.h, mi: r.mi }).toEqual({ mo: 7, day: 30, h: 9, mi: 30 });
    expect(r.dow).toBeGreaterThanOrEqual(1);
    expect(r.dow).toBeLessThanOrEqual(5);
  });
  it("skips the weekend (Friday → Monday)", () => {
    // Fri 2026-07-31 12:00 CST → next business day Mon 2026-08-03
    const r = cst(nextBusinessDayAtMs(Date.parse("2026-07-31T18:00:00Z"), 10, 0));
    expect({ mo: r.mo, day: r.day, dow: r.dow }).toEqual({ mo: 8, day: 3, dow: 1 });
  });
  it("clamps out-of-range time", () => {
    const r = cst(nextBusinessDayAtMs(Date.parse("2026-07-29T18:00:00Z"), 99, -5));
    expect(r.h).toBe(23);
    expect(r.mi).toBe(0);
  });
});
