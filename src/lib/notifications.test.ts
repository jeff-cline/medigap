import { describe, it, expect } from "vitest";
import { cstStartOf } from "./notifications";

describe("cstStartOf", () => {
  it("start of day = CST/CDT midnight as a UTC instant", () => {
    // 2026-07-15 18:00 UTC = 2026-07-15 13:00 CDT (UTC-5). Start of that CDT day = 2026-07-15 05:00 UTC.
    const now = new Date(Date.UTC(2026, 6, 15, 18, 0, 0));
    expect(cstStartOf(now, "day").toISOString()).toBe("2026-07-15T05:00:00.000Z");
  });
  it("winter uses CST (UTC-6)", () => {
    // 2026-01-15 18:00 UTC = 12:00 CST. Start of day = 2026-01-15 06:00 UTC.
    const now = new Date(Date.UTC(2026, 0, 15, 18, 0, 0));
    expect(cstStartOf(now, "day").toISOString()).toBe("2026-01-15T06:00:00.000Z");
  });
  it("start of week = most recent Sunday 00:00 CST", () => {
    // 2026-07-15 is a Wednesday. Sunday 2026-07-12 00:00 CDT = 2026-07-12 05:00 UTC.
    const now = new Date(Date.UTC(2026, 6, 15, 18, 0, 0));
    expect(cstStartOf(now, "week").toISOString()).toBe("2026-07-12T05:00:00.000Z");
  });
  it("start of month = 1st 00:00 CST", () => {
    const now = new Date(Date.UTC(2026, 6, 15, 18, 0, 0));
    expect(cstStartOf(now, "month").toISOString()).toBe("2026-07-01T05:00:00.000Z");
  });
});
