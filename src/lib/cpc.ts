// Keyword cost-per-click for the founding-member funnel. Real numbers via DataForSEO (Google Ads
// search-volume live) when the key is present in Integrations; otherwise a deterministic estimate
// so the funnel still works. baseCpc = the highest CPC among a business's keywords (their "base rate").
import { db } from "@/lib/db";

export type CpcRow = { keyword: string; cpc: number; volume: number | null; source: "dataforseo" | "estimate" };

const round2 = (n: number) => Math.round(n * 100) / 100;

// Deterministic pseudo-CPC ($1.50–$18.50, nudged up by word count) — stable per keyword, no RNG.
function estimateCpc(k: string): number {
  let h = 0; for (const ch of k) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const base = 1.5 + (h % 1700) / 100;
  const words = k.trim().split(/\s+/).length;
  return round2(base + Math.min(words, 4) * 0.85);
}

async function creds(): Promise<{ login: string; password: string } | null> {
  const row = await db.integration.findUnique({ where: { key: "dataforseo" } }).catch(() => null);
  if (!row) return null;
  try { const c = JSON.parse(row.config) as { login?: string; password?: string }; return c.login && c.password ? { login: c.login, password: c.password } : null; } catch { return null; }
}

export async function keywordCpc(keywords: string[]): Promise<CpcRow[]> {
  const list = Array.from(new Set(keywords.map((k) => k.trim().toLowerCase()).filter(Boolean))).slice(0, 20);
  if (!list.length) return [];
  const c = await creds();
  if (c) {
    try {
      const auth = Buffer.from(`${c.login}:${c.password}`).toString("base64");
      const res = await fetch("https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live", {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify([{ keywords: list, location_code: 2840, language_code: "en" }]),
        signal: AbortSignal.timeout(13000),
      });
      const j = await res.json();
      const results: Array<{ keyword?: string; cpc?: number | null; search_volume?: number | null }> = j?.tasks?.[0]?.result || [];
      const map = new Map(results.map((r) => [String(r.keyword || "").toLowerCase(), r]));
      return list.map((k) => {
        const r = map.get(k);
        const real = r && typeof r.cpc === "number" && r.cpc > 0;
        return { keyword: k, cpc: real ? round2(r!.cpc as number) : estimateCpc(k), volume: r?.search_volume ?? null, source: real ? "dataforseo" : "estimate" } as CpcRow;
      });
    } catch { /* fall through to estimate */ }
  }
  return list.map((k) => ({ keyword: k, cpc: estimateCpc(k), volume: null, source: "estimate" as const }));
}

export function baseCpc(rows: CpcRow[]): number {
  if (!rows.length) return 0;
  const avg = rows.reduce((s, r) => s + r.cpc, 0) / rows.length; // average of the keyword CPCs
  return Math.round(avg * 100) / 100;
}
