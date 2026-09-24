// Quuik — Trusted GPT. Answers via the cheapest connected engine (xAI Grok), and every
// answer carries a "Have you met?" network ad (keyword-matched when possible, else rotating)
// with impression tracking so we spread paid/house inventory across searches.
import { db } from "@/lib/db";
import { getCloud, entryTerms, type Entry } from "@/lib/moneycloud";
import { bidMap } from "@/lib/auction";
import fs from "fs";
import path from "path";

const DIR = process.env.NETWORK_DATA_DIR || "/var/www/medigap-data";
const IMP = path.join(DIR, "quuik-impressions.jsonl");
const QUES = path.join(DIR, "quuik-questions.jsonl");
try { fs.mkdirSync(DIR, { recursive: true }); } catch {}

async function xaiConfig(): Promise<{ apiKey: string; model: string } | null> {
  const row = await db.integration.findUnique({ where: { key: "xai" } }).catch(() => null);
  if (!row) return null;
  try { const c = JSON.parse(row.config) as { apiKey?: string; model?: string }; return c.apiKey ? { apiKey: c.apiKey, model: c.model || "grok-4.20-0309-non-reasoning" } : null; } catch { return null; }
}

export async function quuikAsk(query: string): Promise<{ answer: string; error?: string }> {
  const cfg = await xaiConfig();
  if (!cfg) return { answer: "", error: "The answer engine isn't configured yet (add the xAI key in Integrations)." };
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: "You are Quuik, a fast, trustworthy assistant. Answer the user's question directly and accurately in 2–4 short paragraphs of plain text (no markdown headings). If you're unsure, say so plainly." },
          { role: "user", content: query.slice(0, 2000) },
        ],
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return { answer: "", error: "The answer engine had a hiccup — try again." };
    const j = await res.json();
    return { answer: j?.choices?.[0]?.message?.content || "" };
  } catch { return { answer: "", error: "That took too long — try again." }; }
}

// Score a money word against a query via its keyword + trigger/adjacent/supporting terms.
function scoreEntry(e: Entry, q: string): number {
  const hay = " " + q.toLowerCase() + " ";
  let s = 0;
  for (const t of entryTerms(e)) { if (t.length < 3) continue; if (hay.includes(" " + t + " ")) s += 3; else if (hay.includes(t)) s += 1; }
  return s;
}

// "Have you met?" — matched offers compete; the highest bidder wins premium placement
// (bid-weighted so higher bids show more). Falls back to the whole cloud, still bid-weighted.
export async function pickAd(query: string): Promise<Entry | null> {
  const [cloud, bids] = await Promise.all([getCloud(), bidMap()]);
  if (!cloud.length) return null;
  const weight = (e: Entry) => 1 + (bids[e.keyword.toLowerCase()] || 0) / 100; // +1 weight per $1 of bid
  const matched = cloud.filter((e) => scoreEntry(e, query) > 0);
  const pool = matched.length ? matched : cloud;
  const total = pool.reduce((sum, e) => sum + weight(e), 0);
  let r = Math.random() * total;
  for (const e of pool) { r -= weight(e); if (r <= 0) return e; }
  return pool[0];
}

// Money words cited beneath every answer — matched first, topped up with popular ones so we cite
// as often as possible. Links route through el.ag (tracked + billing-ready).
export type Citation = { keyword: string; title: string; url: string; favicon: string };
export async function pickCitations(query: string, max = 5): Promise<Citation[]> {
  const cloud = await getCloud();
  if (!cloud.length) return [];
  const scored = cloud.map((e) => ({ e, s: scoreEntry(e, query) })).sort((a, b) => b.s - a.s || b.e.clicks - a.e.clicks);
  const picked: Entry[] = [];
  for (const { e, s } of scored) { if (s > 0 && !picked.includes(e)) picked.push(e); if (picked.length >= max) break; }
  if (picked.length < 3) { for (const { e } of scored) { if (!picked.includes(e)) picked.push(e); if (picked.length >= 3) break; } }
  return picked.slice(0, max).map((e) => ({ keyword: e.keyword, title: e.title, url: `https://el.ag/${encodeURIComponent(e.keyword)}`, favicon: e.favicon }));
}

// Every question asked (for the God "Recently asked" backend). IP only, never PII.
export function logQuestion(query: string, ip: string, cited: string[]): void {
  try { fs.appendFileSync(QUES, JSON.stringify({ at: new Date().toISOString(), query: query.slice(0, 300), ip, cited }) + "\n"); } catch {}
}
export function readQuestions(limit = 3000): { at: string; query: string; ip: string; cited: string[] }[] {
  try { return fs.readFileSync(QUES, "utf8").trim().split("\n").filter(Boolean).slice(-limit).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; }
}

export function logImpression(keyword: string, query: string, ip: string): void {
  try { fs.appendFileSync(IMP, JSON.stringify({ at: new Date().toISOString(), keyword, query: query.slice(0, 200), ip, source: "quuik" }) + "\n"); } catch {}
}

export function readImpressions(limit = 5000) {
  try { return fs.readFileSync(IMP, "utf8").trim().split("\n").filter(Boolean).slice(-limit).map((l) => JSON.parse(l)); } catch { return []; }
}
