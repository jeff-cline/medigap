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

export type Shortlink = { id: string; word: string; url: string; short: string; createdAt: Date };

// Create a short link with a SPECIFIC word (keyword) via el.ag, and save it locally so staff can
// reuse it in canned answers. Returns { ok, short?, error? }. Never throws.
export async function createShortlink(wordRaw: string, urlRaw: string): Promise<{ ok: boolean; short?: string; error?: string }> {
  const word = (wordRaw || "").trim().replace(/[^a-zA-Z0-9-_]/g, "").toLowerCase();
  const url = (urlRaw || "").trim();
  if (!word) return { ok: false, error: "Enter a word (letters, numbers, dashes)." };
  if (!/^https?:\/\//i.test(url)) return { ok: false, error: "Enter a full URL starting with http(s)://" };
  const cfg = await elagCfg();
  if (!cfg.apiKey) return { ok: false, error: "el.ag is not connected." };
  const endpoint = cfg.endpoint || "https://el.ag/api/short";
  const base = cfg.base || "https://el.ag";
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({ keyword: word, url }),
    });
    if (!res.ok) {
      if (res.status === 409 || res.status === 422) return { ok: false, error: `"${word}" is already taken — pick another word.` };
      return { ok: false, error: `Shortener error (${res.status}).` };
    }
    const j = await res.json().catch(() => null);
    const short = j && typeof j.short === "string" ? j.short : `${base}/${word}`;
    await db.shortlink.upsert({ where: { word }, update: { url, short }, create: { word, url, short } }).catch(() => {});
    return { ok: true, short };
  } catch {
    return { ok: false, error: "Could not reach the shortener." };
  }
}

// All saved short links, newest first, for reuse in canned answers.
export async function listShortlinks(limit = 200): Promise<Shortlink[]> {
  return db.shortlink.findMany({ orderBy: { createdAt: "desc" }, take: limit });
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
