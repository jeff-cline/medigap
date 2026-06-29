import fs from "fs";
import path from "path";

const DIR = path.join(process.cwd(), "src/content/silos");

export type SiloPage = {
  metaTitle: string; metaDescription: string; h1: string; heroSubhead?: string;
  quickAnswer: string; intro: string;
  sections: { h2: string; body: string }[];
  faqs: { q: string; a: string }[];
};
export type Silo = {
  slug: string; group: string; name: string;
  pillar: SiloPage;
  children: { keyword: string; slug: string; page: SiloPage }[];
};
export type SiloIndexEntry = {
  slug: string; group: string; name: string; totalVol: number; avgCpc: number;
  childSlugs: { slug: string; keyword: string; vol: number }[];
};

let _index: SiloIndexEntry[] | null = null;
export function siloIndex(): SiloIndexEntry[] {
  if (!_index) { try { _index = JSON.parse(fs.readFileSync(path.join(DIR, "_index.json"), "utf8")); } catch { _index = []; } }
  return _index!;
}
export function siloSlugs(): string[] { return siloIndex().map((s) => s.slug); }
export function siloMeta(slug: string): SiloIndexEntry | undefined { return siloIndex().find((s) => s.slug === slug); }

export type SiloImage = { url: string; desc: string; credit: string; creditUrl: string };
let _images: Record<string, SiloImage | null> | null = null;
export function siloImage(slug: string): SiloImage | null {
  if (!_images) { try { _images = JSON.parse(fs.readFileSync(path.join(DIR, "..", "silo-images.json"), "utf8")); } catch { _images = {}; } }
  return _images![slug] || null;
}

const _cache = new Map<string, Silo | null>();
export function loadSilo(slug: string): Silo | null {
  if (_cache.has(slug)) return _cache.get(slug)!;
  let s: Silo | null = null;
  try { s = JSON.parse(fs.readFileSync(path.join(DIR, `${slug}.json`), "utf8")); } catch { s = null; }
  _cache.set(slug, s);
  return s;
}
export function getChild(silo: Silo, childSlug: string) {
  return silo.children.find((c) => c.slug === childSlug) || null;
}
// Lateral silo links — siblings in the same category (siloed, not random).
export function relatedSilos(slug: string, n = 6): SiloIndexEntry[] {
  const idx = siloIndex();
  const me = idx.find((s) => s.slug === slug);
  if (!me) return [];
  const same = idx.filter((s) => s.slug !== slug && s.group === me.group);
  return (same.length ? same : idx.filter((s) => s.slug !== slug)).slice(0, n);
}
// Group the index for nav / sitemaps.
export function siloGroups(): { group: string; silos: SiloIndexEntry[] }[] {
  const by = new Map<string, SiloIndexEntry[]>();
  for (const s of siloIndex()) { const a = by.get(s.group) || []; a.push(s); by.set(s.group, a); }
  return [...by.entries()].map(([group, silos]) => ({ group, silos }));
}
