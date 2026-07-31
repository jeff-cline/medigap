// Pure scheduling logic for the Notification Service. No DB, no I/O — testable with fixed dates.
// Dates are evaluated in America/Chicago (CST/CDT), matching the rest of the app.

export type NotifEvent = {
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23 (CST)
  minute: number; // 0-59
  annual: boolean; // true = fires every year on month/day; false = one-time in `year`
  year: number; // one-time target year (ignored when annual)
  active: boolean;
  lastSentYear: number; // last calendar year this event fired (idempotency)
};

export type CstParts = { year: number; month: number; day: number; hour: number; minute: number };

// Calendar parts of `now` in America/Chicago.
export function cstParts(now: Date): CstParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago", year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", hour12: false,
  });
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(now)) if (part.type !== "literal") p[part.type] = part.value;
  let hour = parseInt(p.hour, 10);
  if (hour === 24) hour = 0; // Intl can render midnight as 24
  return { year: parseInt(p.year, 10), month: parseInt(p.month, 10), day: parseInt(p.day, 10), hour, minute: parseInt(p.minute, 10) };
}

const key = (month: number, day: number, hour: number, minute: number) =>
  month * 1e6 + day * 1e4 + hour * 100 + minute;

// Is this event due to send at `now`? True when active, not already sent this cycle, and the
// current CST date/time has reached (or passed) the event's scheduled slot for the relevant year.
export function isEventDue(ev: NotifEvent, now: Date): boolean {
  if (!ev.active) return false;
  const p = cstParts(now);
  const targetYear = ev.annual ? p.year : ev.year;
  if (!ev.annual && p.year !== ev.year) return false; // one-time fires only within its own year
  if (ev.lastSentYear >= targetYear) return false; // already fired this cycle
  return key(p.month, p.day, p.hour, p.minute) >= key(ev.month, ev.day, ev.hour, ev.minute);
}

export function dueEvents<T extends NotifEvent>(events: T[], now: Date): T[] {
  return events.filter((e) => isEventDue(e, now));
}

// The calendar year to stamp into lastSentYear after a send.
export function sentYearFor(ev: NotifEvent, now: Date): number {
  return ev.annual ? cstParts(now).year : ev.year;
}

// The next date this event will fire, as {year,month,day} (for display in the calendar list).
export function nextOccurrence(ev: NotifEvent, now: Date): { year: number; month: number; day: number } {
  const p = cstParts(now);
  if (!ev.annual) return { year: ev.year, month: ev.month, day: ev.day };
  // annual: this year if not yet fired and date not past; otherwise next year
  const passedThisYear = ev.lastSentYear >= p.year || key(p.month, p.day, 23, 59) > key(ev.month, ev.day, 23, 59);
  return { year: passedThisYear ? p.year + 1 : p.year, month: ev.month, day: ev.day };
}
