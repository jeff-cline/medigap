import { db } from "@/lib/db";
import { defaultU65Config, U65Config, DayKey } from "@/lib/u65";

const KEY = "u65Config";

// Deep-merge a saved partial over defaults so new config fields always have a value.
function merge(base: U65Config, saved: Partial<U65Config>): U65Config {
  return {
    ...base,
    ...saved,
    hours: {
      ...base.hours,
      ...(saved.hours || {}),
      days: { ...base.hours.days, ...((saved.hours?.days as Record<DayKey, boolean>) || {}) },
    },
    states: { ...base.states, ...(saved.states || {}) },
  };
}

export async function loadU65Config(): Promise<U65Config> {
  const base = defaultU65Config();
  const row = await db.setting.findUnique({ where: { key: KEY } }).catch(() => null);
  if (!row) return base;
  try {
    return merge(base, JSON.parse(row.value) as Partial<U65Config>);
  } catch {
    return base;
  }
}

export async function saveU65Config(patch: Partial<U65Config>): Promise<U65Config> {
  const next = merge(await loadU65Config(), patch);
  const value = JSON.stringify(next);
  await db.setting.upsert({ where: { key: KEY }, update: { value }, create: { key: KEY, value } });
  return next;
}
