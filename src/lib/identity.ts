// Layer-2 identity append: resolve an anonymous network visitor (IP only) to a real person via
// PredictiveData reverse-IP (GetDataByIp). Cached per-IP in a Setting so each IP costs one lookup.
import { db } from "./db";
import { appendByIP } from "./predictivedata";

const STORE = "identity:appends";
export type Append = { matched: boolean; at: string } & Record<string, string | boolean>;

export async function getAppends(): Promise<Record<string, Append>> {
  const row = await db.setting.findUnique({ where: { key: STORE } }).catch(() => null);
  try { return row?.value ? JSON.parse(row.value) : {}; } catch { return {}; }
}
async function save(all: Record<string, Append>) {
  await db.setting.upsert({ where: { key: STORE }, update: { value: JSON.stringify(all) }, create: { key: STORE, value: JSON.stringify(all) } });
}

// Returns the cached append if present (no cost); otherwise does one lookup and caches it.
export async function resolveIp(ip: string, force = false): Promise<Append | null> {
  const clean = String(ip || "").trim();
  if (!clean) return null;
  const all = await getAppends();
  if (all[clean] && !force) return all[clean];
  const curated = await appendByIP(clean).catch(() => null);
  const a: Append = curated ? { matched: true, ...curated, at: new Date().toISOString() } : { matched: false, at: new Date().toISOString() };
  all[clean] = a; await save(all);
  return a;
}
export const appendName = (a?: Append | null): string => (a && a.matched && typeof a.name === "string" ? a.name : "");
