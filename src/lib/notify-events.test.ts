import { describe, it, expect } from "vitest";
import { isEventDue, dueEvents, sentYearFor, nextOccurrence, cstParts, type NotifEvent } from "./notify-events";

const base: NotifEvent = { month: 10, day: 15, hour: 9, minute: 0, annual: true, year: 0, active: true, lastSentYear: 0 };
// Oct 15 2026 14:00 UTC = 09:00 CDT (America/Chicago, DST) — the send moment.
const onTime = new Date("2026-10-15T14:00:00Z");
const before = new Date("2026-10-15T13:00:00Z"); // 08:00 CDT — before 9am
const nextDay = new Date("2026-10-16T14:00:00Z");

describe("cstParts", () => {
  it("renders America/Chicago parts", () => {
    const p = cstParts(onTime);
    expect(p).toMatchObject({ year: 2026, month: 10, day: 15, hour: 9, minute: 0 });
  });
});

describe("isEventDue (annual)", () => {
  it("fires at/after the scheduled time on the day", () => {
    expect(isEventDue(base, onTime)).toBe(true);
    expect(isEventDue(base, nextDay)).toBe(true); // still due if the tick was late
  });
  it("does not fire before the scheduled time", () => {
    expect(isEventDue(base, before)).toBe(false);
  });
  it("does not fire twice in the same year", () => {
    expect(isEventDue({ ...base, lastSentYear: 2026 }, onTime)).toBe(false);
  });
  it("fires again the next year", () => {
    expect(isEventDue({ ...base, lastSentYear: 2026 }, new Date("2027-10-15T14:00:00Z"))).toBe(true);
  });
  it("inactive never fires", () => {
    expect(isEventDue({ ...base, active: false }, onTime)).toBe(false);
  });
});

describe("isEventDue (one-time)", () => {
  const once: NotifEvent = { ...base, annual: false, year: 2026 };
  it("fires only within its own year", () => {
    expect(isEventDue(once, onTime)).toBe(true);
    expect(isEventDue(once, new Date("2027-10-15T14:00:00Z"))).toBe(false);
    expect(isEventDue(once, new Date("2025-10-15T14:00:00Z"))).toBe(false);
  });
  it("does not re-fire once sent", () => {
    expect(isEventDue({ ...once, lastSentYear: 2026 }, onTime)).toBe(false);
  });
});

describe("dueEvents + sentYearFor + nextOccurrence", () => {
  it("filters the due set", () => {
    const evs = [base, { ...base, active: false }, { ...base, day: 20 }];
    expect(dueEvents(evs, onTime).length).toBe(1);
  });
  it("stamps the current year for annual, the target year for one-time", () => {
    expect(sentYearFor(base, onTime)).toBe(2026);
    expect(sentYearFor({ ...base, annual: false, year: 2026 }, onTime)).toBe(2026);
  });
  it("next occurrence is next year once already sent this year", () => {
    expect(nextOccurrence({ ...base, lastSentYear: 2026 }, onTime)).toEqual({ year: 2027, month: 10, day: 15 });
    expect(nextOccurrence(base, new Date("2026-01-01T12:00:00Z"))).toEqual({ year: 2026, month: 10, day: 15 });
  });
});
