// Pure U65 business logic. MUST NOT import the DB or any server-only module —
// this file is unit-tested in isolation and imported by webhooks + the page.

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type U65Config = {
  setNumber: string;
  backupNumber: string;
  afterHoursMode: "regular" | "backup";
  hours: { start: string; end: string; days: Record<DayKey, boolean> };
  timezone: string; // informational label; the offset is fixed below
  states: Record<string, boolean>;
  ringbaAccountId: string;
  ringbaCampaignId: string;
};

export const U65_OFFSET_MIN = -360; // fixed UTC-6, no daylight saving
export const BILLABLE_THRESHOLD_SEC = 121;
export const BILLABLE_CENTS = 7500;

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const U65_MONEY_WORDS = ["private", "health insurance", "medical insurance", "individual"];

export function defaultU65Config(): U65Config {
  const states: Record<string, boolean> = {};
  for (const s of US_STATES) states[s] = true;
  const days = { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true };
  return {
    setNumber: "+13809790146",
    backupNumber: "+19728006670",
    afterHoursMode: "regular",
    hours: { start: "08:30", end: "18:30", days },
    timezone: "UTC-6",
    states,
    ringbaAccountId: "CA5f21b5af6efb48eda821bff312693e3f",
    ringbaCampaignId: "",
  };
}

export function isBillable(transferSec: number): boolean {
  return transferSec >= BILLABLE_THRESHOLD_SEC;
}

export function isStateEnabled(cfg: U65Config, state: string): boolean {
  const s = (state || "").toUpperCase().trim();
  return !!s && cfg.states[s] === true;
}

// Wall-clock minutes-of-day + weekday for a UTC instant, viewed at fixed UTC-6.
function wallClockMinus6(atUtcMs: number): { day: number; minutes: number } {
  const shifted = new Date(atUtcMs + U65_OFFSET_MIN * 60_000);
  return { day: shifted.getUTCDay(), minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() };
}

function hhmmToMin(hhmm: string): number {
  const [h, m] = (hhmm || "0:0").split(":").map((x) => parseInt(x, 10) || 0);
  return h * 60 + m;
}

export function isWithinHours(cfg: U65Config, atUtcMs: number): boolean {
  const { day, minutes } = wallClockMinus6(atUtcMs);
  if (!cfg.hours.days[DAY_KEYS[day]]) return false;
  const start = hhmmToMin(cfg.hours.start);
  const end = hhmmToMin(cfg.hours.end);
  return minutes >= start && minutes < end;
}

// Monday 00:00 at UTC-6, returned as a UTC-instant millisecond value.
export function weekToDateStartUtcMs(atUtcMs: number): number {
  const shifted = new Date(atUtcMs + U65_OFFSET_MIN * 60_000);
  const daysSinceMon = (shifted.getUTCDay() + 6) % 7; // Sun=0 -> 6, Mon=1 -> 0
  const localMidnight = Date.UTC(
    shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() - daysSinceMon, 0, 0, 0,
  );
  return localMidnight - U65_OFFSET_MIN * 60_000; // convert -6 wall midnight back to real UTC
}

export function matchesU65Intent(speech: string): boolean {
  const t = (speech || "").toLowerCase();
  if (/\b(yes|yeah|yep|yup|correct|sure|i am|that'?s right|uh[ -]?huh)\b/.test(t)) return true;
  return U65_MONEY_WORDS.some((w) => t.includes(w));
}
