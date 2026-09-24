// Advertiser profile + performance helpers. Profiles live in the advertiser:profiles Setting blob.
import { db } from "@/lib/db";
import { readClicks } from "@/lib/network-leads";

const PROFILES = "advertiser:profiles";
export type AdvProfile = {
  firstName?: string; lastName?: string; email?: string; phone?: string;
  city?: string; state?: string; zip?: string; business?: string; website?: string;
  moneyWord?: string; adjacent?: string[]; supporting?: string[];
  baseCpc?: number; status?: string; at?: string;
};

export async function getAllProfiles(): Promise<Record<string, AdvProfile>> {
  const row = await db.setting.findUnique({ where: { key: PROFILES } }).catch(() => null);
  try { return row?.value ? JSON.parse(row.value) : {}; } catch { return {}; }
}
export async function getProfile(uid: string): Promise<AdvProfile | null> {
  return (await getAllProfiles())[uid] || null;
}
export async function patchProfile(uid: string, patch: Partial<AdvProfile>): Promise<void> {
  const all = await getAllProfiles();
  all[uid] = { ...(all[uid] || {}), ...patch };
  await db.setting.upsert({ where: { key: PROFILES }, update: { value: JSON.stringify(all) }, create: { key: PROFILES, value: JSON.stringify(all) } });
}

export function keywordsOf(p: AdvProfile): string[] {
  return Array.from(new Set([p.moneyWord || "", ...(p.adjacent || []), ...(p.supporting || [])].map((x) => String(x).toLowerCase()).filter(Boolean)));
}

// Click performance for a set of keywords, from the network click log. Privacy-safe (no PII).
export function clickStats(keywords: string[]) {
  const set = new Set(keywords.map((k) => k.toLowerCase()));
  const all = readClicks(20000).filter((c) => set.has((c.keyword || "").toLowerCase()));
  const now = Date.now();
  const last30 = all.filter((c) => now - new Date(c.at).getTime() < 30 * 864e5).length;
  const bySource = new Map<string, number>();
  for (const c of all) { let src = "direct"; try { src = c.referer ? new URL(c.referer).hostname.replace(/^www\./, "") : "direct"; } catch {} bySource.set(src, (bySource.get(src) || 0) + 1); }
  const sources = [...bySource.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const recent = all.slice(-25).reverse();
  const visitors = new Set(all.map((c) => c.vid || c.ip).filter(Boolean)).size;
  return { total: all.length, last30, sources, recent, visitors };
}
