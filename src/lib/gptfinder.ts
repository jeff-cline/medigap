// GPT-FINDER — programmatic SEO/AEO store. Every real search is captured to a tiny JSON file so we
// can render a static-fast, crawlable Q&A page per question and a category (money-word) silo page.
// Lightweight: one small file per question + one per category, read on demand. No DB migration.
import fs from "fs";
import path from "path";
import { quuikAsk, type Citation } from "@/lib/quuik";

const DIR = process.env.NETWORK_DATA_DIR || "/var/www/medigap-data";
const ROOT = path.join(DIR, "gpt-finder");
const QDIR = path.join(ROOT, "q");
const CDIR = path.join(ROOT, "cat");
for (const d of [QDIR, CDIR]) { try { fs.mkdirSync(d, { recursive: true }); } catch {} }

export const slugify = (s: string) =>
  String(s || "").toLowerCase().trim().replace(/['’"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
export const titleCase = (k: string) => k.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const readJson = <T,>(f: string): T | null => { try { return JSON.parse(fs.readFileSync(f, "utf8")) as T; } catch { return null; } };
const writeJson = (f: string, v: unknown) => { try { fs.writeFileSync(f, JSON.stringify(v)); } catch {} };

export type QAItem = { slug: string; question: string; answer: string; citations: Citation[]; category: string; count: number; createdAt: string; updatedAt: string };
export type CatItem = { slug: string; question: string; count: number; updatedAt: string };
export type CatFile = { cat: string; title: string; description: string; at: string; items: CatItem[] };

const pickCategory = (citations: Citation[]) => (citations?.[0]?.keyword ? slugify(citations[0].keyword) : "answers");

export async function captureQA({ question, answer, citations }: { question: string; answer: string; citations: Citation[] }): Promise<void> {
  const q = String(question || "").trim();
  if (q.length < 8 || !answer || answer.length < 20) return; // skip junk / errors
  const slug = slugify(q); if (!slug) return;
  const cat = pickCategory(citations);
  const now = new Date().toISOString();
  const qf = path.join(QDIR, slug + ".json");
  const prev = readJson<QAItem>(qf);
  writeJson(qf, { slug, question: q, answer, citations: citations || [], category: cat, count: (prev?.count || 0) + 1, createdAt: prev?.createdAt || now, updatedAt: now } as QAItem);
  const cf = path.join(CDIR, cat + ".json");
  const c = readJson<CatFile>(cf) || { cat, title: titleCase(cat), description: "", at: now, items: [] };
  c.items = c.items.filter((x) => x.slug !== slug);
  c.items.unshift({ slug, question: q, count: (prev?.count || 0) + 1, updatedAt: now });
  if (c.items.length > 800) c.items = c.items.slice(0, 800);
  writeJson(cf, c);
  if (!c.description) { try { await ensureCategoryMeta(cat); } catch {} }
}

// One-time AI SEO intro per category, cached in the category file.
export async function ensureCategoryMeta(cat: string): Promise<void> {
  const cf = path.join(CDIR, slugify(cat) + ".json");
  const c = readJson<CatFile>(cf); if (!c || c.description) return;
  let desc = "";
  try { const r = await quuikAsk(`Write one SEO intro paragraph (~45 words, plain text, no headings, neutral and helpful) for a page answering common questions about "${titleCase(cat)}".`); desc = (r.answer || "").trim().replace(/\s+/g, " ").slice(0, 480); } catch {}
  if (!desc) desc = `Straight answers to the most common questions about ${titleCase(cat)} — updated in real time from what people actually ask on Quuik, the Trusted GPT.`;
  c.description = desc; writeJson(cf, c);
}

export function readCategories(): { cat: string; title: string; count: number; description: string; recent: CatItem[] }[] {
  let files: string[] = []; try { files = fs.readdirSync(CDIR).filter((f) => f.endsWith(".json")); } catch { return []; }
  return files.map((f) => readJson<CatFile>(path.join(CDIR, f))).filter(Boolean)
    .map((c) => ({ cat: c!.cat, title: c!.title, count: c!.items.reduce((s, i) => s + (i.count || 1), 0), description: c!.description || "", recent: c!.items.slice(0, 3) }))
    .sort((a, b) => b.count - a.count);
}
export const readCategory = (cat: string) => readJson<CatFile>(path.join(CDIR, slugify(cat) + ".json"));
export const readQuestion = (slug: string) => readJson<QAItem>(path.join(QDIR, slugify(slug) + ".json"));

export function sitemapUrls(): { loc: string; lastmod: string }[] {
  const urls: { loc: string; lastmod: string }[] = [];
  try { for (const f of fs.readdirSync(CDIR).filter((f) => f.endsWith(".json"))) { const c = readJson<CatFile>(path.join(CDIR, f)); if (c) urls.push({ loc: `/${c.cat}`, lastmod: c.items[0]?.updatedAt || c.at }); } } catch {}
  try { for (const f of fs.readdirSync(QDIR).filter((f) => f.endsWith(".json"))) { const it = readJson<QAItem>(path.join(QDIR, f)); if (it) urls.push({ loc: `/GPT-FINDER/${it.slug}`, lastmod: it.updatedAt }); } } catch {}
  return urls;
}
