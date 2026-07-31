import { db } from "@/lib/db";
import crypto from "crypto";

type ElagCfg = { endpoint?: string; base?: string; apiKey?: string };

async function elagCfg(): Promise<ElagCfg> {
  const row = await db.integration.findUnique({ where: { key: "elag" } }).catch(() => null);
  try { return row ? JSON.parse(row.config) : {}; } catch { return {}; }
}

function slug(): string {
  return crypto.randomBytes(6).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 7).toLowerCase() || Math.random().toString(36).slice(2, 9);
}

// Shorten via el.ag (POST {keyword,url} → {short}). Falls back to the original URL on any
// failure or if unconfigured. NEVER throws. The api key comes only from the DB Integration.
export async function shortenUrl(long: string): Promise<string> {
  const url = (long || "").trim();
  if (!/^https?:\/\//i.test(url)) return long;
  const cfg = await elagCfg();
  if (!cfg.apiKey) return long;
  const endpoint = cfg.endpoint || "https://el.ag/api/short";
  const base = cfg.base || "https://el.ag";
  for (let attempt = 0; attempt < 3; attempt++) {
    const keyword = slug();
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({ keyword, url }),
      });
      if (!res.ok) { if (res.status === 409 || res.status === 422) continue; return long; }
      const j = await res.json().catch(() => null);
      const short = j && typeof j.short === "string" ? j.short : `${base}/${keyword}`;
      return /^https?:\/\//i.test(short) ? short : long;
    } catch { return long; }
  }
  return long;
}
