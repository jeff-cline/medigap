import { describe, it, expect } from "vitest";
import {
  US_STATES, BILLABLE_CENTS, defaultU65Config, isBillable, isStateEnabled,
  isWithinHours, weekToDateStartUtcMs, matchesU65Intent,
} from "./u65";

describe("defaultU65Config", () => {
  it("enables all 50 states and sets the documented defaults", () => {
    const c = defaultU65Config();
    expect(US_STATES).toHaveLength(50);
    expect(Object.values(c.states).every((v) => v === true)).toBe(true);
    expect(Object.keys(c.states)).toHaveLength(50);
    expect(c.setNumber).toBe("+13809790146");
    expect(c.backupNumber).toBe("+19728006670");
    expect(c.afterHoursMode).toBe("regular");
    expect(c.hours.start).toBe("08:30");
    expect(c.hours.end).toBe("18:30");
    expect(c.ringbaAccountId).toBe("CA5f21b5af6efb48eda821bff312693e3f");
  });
});

describe("isBillable", () => {
  it("is false at 120, true at 121 and 122", () => {
    expect(isBillable(120)).toBe(false);
    expect(isBillable(121)).toBe(true);
    expect(isBillable(122)).toBe(true);
  });
  it("bills $75 (7500 cents)", () => {
    expect(BILLABLE_CENTS).toBe(7500);
  });
});

describe("isStateEnabled", () => {
  it("matches case-insensitively and rejects blanks/disabled", () => {
    const c = defaultU65Config();
    c.states.TX = false;
    expect(isStateEnabled(c, "ca")).toBe(true);
    expect(isStateEnabled(c, "TX")).toBe(false);
    expect(isStateEnabled(c, "")).toBe(false);
    expect(isStateEnabled(c, "ZZ")).toBe(false);
  });
});

describe("isWithinHours (fixed UTC-6)", () => {
  const c = defaultU65Config();
  // 2026-07-15 is a Wednesday. UTC-6 wall clock = UTC - 6h.
  it("is open at 08:30 local (14:30 UTC) and closed just before", () => {
    expect(isWithinHours(c, Date.parse("2026-07-15T14:30:00Z"))).toBe(true);  // 08:30 -06
    expect(isWithinHours(c, Date.parse("2026-07-15T14:29:00Z"))).toBe(false); // 08:29 -06
  });
  it("is open before 18:30 local and closed at/after it", () => {
    expect(isWithinHours(c, Date.parse("2026-07-16T00:29:00Z"))).toBe(true);  // 18:29 -06 (still Wed local)
    expect(isWithinHours(c, Date.parse("2026-07-16T00:30:00Z"))).toBe(false); // 18:30 -06
  });
  it("respects a disabled day", () => {
    const off = defaultU65Config();
    off.hours.days.wed = false;
    expect(isWithinHours(off, Date.parse("2026-07-15T18:00:00Z"))).toBe(false); // noon Wed local, day off
  });
});

describe("weekToDateStartUtcMs", () => {
  it("returns Monday 00:00 at UTC-6 as a UTC instant", () => {
    // Wed 2026-07-15 12:00 local (-06) => Monday 2026-07-13 00:00 -06 => 06:00 UTC.
    const start = weekToDateStartUtcMs(Date.parse("2026-07-15T18:00:00Z"));
    expect(new Date(start).toISOString()).toBe("2026-07-13T06:00:00.000Z");
  });
  it("on Monday 00:15 local returns that same Monday 00:00 local", () => {
    // Monday 2026-07-13 00:15 local (-06) => 06:15 UTC.
    const start = weekToDateStartUtcMs(Date.parse("2026-07-13T06:15:00Z"));
    expect(new Date(start).toISOString()).toBe("2026-07-13T06:00:00.000Z");
  });
});

describe("matchesU65Intent", () => {
  it("is true for affirmatives and money words", () => {
    expect(matchesU65Intent("yes please")).toBe(true);
    expect(matchesU65Intent("I need private insurance")).toBe(true);
    expect(matchesU65Intent("looking for health insurance")).toBe(true);
    expect(matchesU65Intent("medical insurance")).toBe(true);
  });
  it("is false for negatives and unrelated speech", () => {
    expect(matchesU65Intent("no thanks")).toBe(false);
    expect(matchesU65Intent("just checking my medicare card")).toBe(false);
  });
});
