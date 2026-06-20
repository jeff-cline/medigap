import { db } from "./db";

// Live keyword CPC via DataForSEO. Returns CPC in cents, or null if unavailable.
// API calls originate from the server IP (137.220.56.129) — whitelist that in DataForSEO.
export async function getKeywordCpcCents(keyword: string): Promise<number | null> {
  const row = await db.integration.findUnique({ where: { key: "dataforseo" } });
  let c: Record<string, string> = {};
  try { c = row ? JSON.parse(row.config) : {}; } catch {}
  if (!c.login || !c.password) return null;
  try {
    const res = await fetch("https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live", {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(`${c.login}:${c.password}`).toString("base64"), "Content-Type": "application/json" },
      body: JSON.stringify([{ keywords: [keyword], location_code: 2840, language_code: "en" }]),
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const item = data?.tasks?.[0]?.result?.[0];
    const cpc = item?.cpc;
    if (typeof cpc === "number" && cpc > 0) return Math.round(cpc * 100);
    return null;
  } catch { return null; }
}

// Get cached CPC for a money word, refreshing from DataForSEO if not yet cached.
export async function cpcForMoneyWord(id: string, word: string, cached: number): Promise<number> {
  if (cached > 0) return cached;
  const live = await getKeywordCpcCents(word);
  if (live && live > 0) { await db.moneyWord.update({ where: { id }, data: { cpcCents: live } }).catch(() => {}); return live; }
  return 0;
}
