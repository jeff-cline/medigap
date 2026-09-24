// MoneyWord Cloud — the network's keyword→link display layer.
// Reads existing el.ag/short links (house traffic) as cloud entries + optional per-keyword
// display metadata (short:meta) + click counts. Renders best-in-class, email-safe HTML units
// in 8 pickable styles. Additive only: never mutates short:links / the shortener.
import { db } from "@/lib/db";
import { getLinks, getClicks, normKeyword } from "@/lib/shortlinks";

const META_KEY = "short:meta";
export type Meta = { title?: string; desc?: string; image?: string; featured?: string; addedAt?: number; trigger?: string[]; adjacent?: string[]; supporting?: string[] };
export type MetaMap = Record<string, Meta>;

export async function getMeta(): Promise<MetaMap> {
  const row = await db.setting.findUnique({ where: { key: META_KEY } }).catch(() => null);
  if (!row?.value) return {};
  try { return JSON.parse(row.value) as MetaMap; } catch { return {}; }
}
export async function setMeta(keyword: string, patch: Meta): Promise<void> {
  const k = normKeyword(keyword);
  const all = await getMeta();
  const merged: Meta = { ...(all[k] || {}), ...patch };
  (Object.keys(merged) as (keyof Meta)[]).forEach((kk) => { const v = merged[kk]; if (v === "" || v == null || (Array.isArray(v) && v.length === 0)) delete merged[kk]; });
  if (!all[k]?.addedAt && patch.addedAt == null) merged.addedAt = Date.now();
  all[k] = merged;
  await db.setting.upsert({ where: { key: META_KEY }, update: { value: JSON.stringify(all) }, create: { key: META_KEY, value: JSON.stringify(all) } });
}

export type Entry = { keyword: string; url: string; title: string; desc: string; image: string | null; favicon: string; clicks: number; featured?: string; addedAt: number; trigger: string[]; adjacent: string[]; supporting: string[] };

const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };
const titleCase = (k: string) => k.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export async function getCloud(): Promise<Entry[]> {
  const [links, meta, clicks] = await Promise.all([getLinks(), getMeta(), getClicks()]);
  return Object.entries(links).map(([kw, url], i) => {
    const m = meta[kw] || {};
    const host = hostOf(url);
    return {
      keyword: kw, url,
      title: m.title || titleCase(kw),
      desc: m.desc || host || "Visit site",
      image: m.image || null,
      favicon: `https://www.google.com/s2/favicons?domain=${host || "el.ag"}&sz=64`,
      clicks: clicks[kw] || 0,
      featured: m.featured,
      addedAt: m.addedAt || i,
      trigger: m.trigger || [], adjacent: m.adjacent || [], supporting: m.supporting || [],
    };
  });
}

// All terms a money word can be matched/cited on: the keyword itself + trigger/adjacent/supporting.
export function entryTerms(e: Entry): string[] {
  const base = [e.keyword.replace(/[-_]+/g, " ").toLowerCase(), ...e.keyword.split(/[-_]+/).filter((w) => w.length > 3).map((w) => w.toLowerCase())];
  const extra = [...(e.trigger || []), ...(e.adjacent || []), ...(e.supporting || [])].map((w) => String(w).toLowerCase()).filter(Boolean);
  return Array.from(new Set([...base, ...extra]));
}

// spec: "d=2,t=5,c=all,random,featured=investing,theme=business"
export type Spec = { d: number; t: number; c: number | "all"; order: "random" | "most" | "newest"; featured?: string; theme: string };
export function parseSpec(raw: string): Spec {
  const s: Spec = { d: 2, t: 5, c: 0, order: "newest", theme: "business" };
  (raw || "").split(",").map((x) => x.trim()).filter(Boolean).forEach((tok) => {
    const [k, v] = tok.split("=").map((x) => (x || "").trim());
    if (k === "d") s.d = Math.max(0, parseInt(v || "0", 10) || 0);
    else if (k === "t") s.t = Math.max(0, parseInt(v || "0", 10) || 0);
    else if (k === "c") s.c = (v === "all" || v === "call") ? "all" : Math.max(0, parseInt(v || "0", 10) || 0);
    else if (k === "call" || tok === "all") s.c = "all";
    else if (k === "featured") s.featured = v;
    else if (k === "theme") { if (v && THEMES[v]) s.theme = v; else if (v) s.featured = v; } // forgiving: theme=<keyword> → feature it
    else if (["random", "most", "newest"].includes(k)) s.order = k as Spec["order"];
  });
  return s;
}

function shuffle<T>(arr: T[]): T[] { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function orderEntries(entries: Entry[], spec: Spec): Entry[] {
  let list = entries.slice();
  let pinned: Entry[] = [];
  if (spec.featured) {
    const f = spec.featured.toLowerCase();
    pinned = list.filter((e) => e.keyword.toLowerCase().includes(f) || (e.featured || "").toLowerCase() === f);
    const pk = new Set(pinned.map((e) => e.keyword));
    list = list.filter((e) => !pk.has(e.keyword));
  }
  if (spec.order === "most") list.sort((a, b) => b.clicks - a.clicks);
  else if (spec.order === "newest") list.sort((a, b) => b.addedAt - a.addedAt);
  else list = shuffle(list);
  return [...pinned, ...list];
}
function isFeatured(e: Entry, f: string): boolean { const ff = f.toLowerCase(); return e.keyword.toLowerCase().includes(ff) || (e.featured || "").toLowerCase() === ff; }

export function select(entries: Entry[], spec: Spec) {
  const ordered = orderEntries(entries, spec);
  const used = new Set<string>();
  let hero: Entry | null = null;
  if (spec.featured) { const h = ordered.find((e) => isFeatured(e, spec.featured as string)); if (h) { hero = h; used.add(h.keyword); } }
  const take = (n: number | "all") => {
    const out: Entry[] = [];
    for (const e of ordered) { if (used.has(e.keyword)) continue; out.push(e); used.add(e.keyword); if (n !== "all" && out.length >= n) break; }
    return out;
  };
  return { hero, display: take(spec.d), text: take(spec.t), cloud: take(spec.c) };
}

// ---------- themes ----------
export type Theme = {
  key: string; name: string; blurb: string;
  bg: string; surface: string; ink: string; muted: string; accent: string; accent2: string;
  radius: number; font: string; headFont: string; cta: string; dev: string;
};
export const THEMES: Record<string, Theme> = {
  business:      { key: "business", name: "Business", blurb: "Clean corporate authority", bg: "#F4F6F8", surface: "#FFFFFF", ink: "#1A2B4A", muted: "#5A6B82", accent: "#0B5FFF", accent2: "#E1E6ED", radius: 4, font: "Arial,'Helvetica Neue',Helvetica,sans-serif", headFont: "Arial,'Helvetica Neue',Helvetica,sans-serif", cta: "Learn more →", dev: "biz" },
  ecommerce:     { key: "ecommerce", name: "E-commerce", blurb: "Product cards + rating", bg: "#FFFFFF", surface: "#FAFAFA", ink: "#111111", muted: "#767676", accent: "#FF4438", accent2: "#111111", radius: 6, font: "'Helvetica Neue',Helvetica,Arial,sans-serif", headFont: "'Helvetica Neue',Helvetica,Arial,sans-serif", cta: "Shop now →", dev: "ecom" },
  salesy:        { key: "salesy", name: "Salesy", blurb: "Urgent direct-response", bg: "#FFF3E6", surface: "#FFFFFF", ink: "#1A1A1A", muted: "#6B6B6B", accent: "#E11900", accent2: "#FFD400", radius: 8, font: "Arial,Helvetica,sans-serif", headFont: "'Arial Black',Arial,sans-serif", cta: "Get instant access →", dev: "sales" },
  academic:      { key: "academic", name: "Ph.D. / Academic", blurb: "Serif & authoritative", bg: "#FFFFFF", surface: "#FBFAF7", ink: "#1C1C1C", muted: "#6B6B6B", accent: "#7A1F2B", accent2: "#D8D2C4", radius: 2, font: "Georgia,'Times New Roman',Times,serif", headFont: "Georgia,'Times New Roman',Times,serif", cta: "Read the full study →", dev: "phd" },
  informational: { key: "informational", name: "Informational", blurb: "Editorial newsletter", bg: "#FFFFFF", surface: "#F7F5F2", ink: "#202020", muted: "#707070", accent: "#E8543F", accent2: "#111111", radius: 4, font: "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", headFont: "Georgia,'Times New Roman',serif", cta: "Read more →", dev: "info" },
  discounts:     { key: "discounts", name: "Discounts & Savings", blurb: "Big % savings", bg: "#FFF8E1", surface: "#FFFFFF", ink: "#1A1A1A", muted: "#8A7B4F", accent: "#E11900", accent2: "#00875A", radius: 6, font: "Arial,Helvetica,sans-serif", headFont: "'Arial Black',Arial,sans-serif", cta: "Grab the deal →", dev: "disc" },
  coupons:       { key: "coupons", name: "Coupons", blurb: "Perforated ticket + code", bg: "#FDF6EC", surface: "#FFFFFF", ink: "#222222", muted: "#9B8C74", accent: "#D6336C", accent2: "#C9B896", radius: 8, font: "Arial,Helvetica,sans-serif", headFont: "Arial,Helvetica,sans-serif", cta: "Redeem now →", dev: "coupon" },
  medical:       { key: "medical", name: "Medical", blurb: "Calm, trusted, clinical", bg: "#F2F7FB", surface: "#FFFFFF", ink: "#12344D", muted: "#5C7185", accent: "#0E8FBF", accent2: "#2FA37C", radius: 8, font: "'Segoe UI',-apple-system,Roboto,Helvetica,Arial,sans-serif", headFont: "'Segoe UI',-apple-system,Roboto,Helvetica,Arial,sans-serif", cta: "Talk to a specialist →", dev: "med" },
};
export const THEME_LIST = Object.values(THEMES);

// ---------- email-safe HTML unit ----------
const esc = (s: string) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const trackUrl = (e: Entry) => `https://el.ag/${encodeURIComponent(e.keyword)}`;

export function renderEmailHtml(sel: ReturnType<typeof select>, spec: Spec): string {
  const T = THEMES[spec.theme] || THEMES.business;
  const cardBorder = T.dev === "coupon" ? `2px dashed ${T.accent}` : `1px solid #e6e6e6`;
  const cardTop = T.dev === "biz" ? `border-top:3px solid ${T.accent};` : T.dev === "med" ? `border-top:3px solid ${T.accent};` : "";
  const btnRadius = T.dev === "sales" || T.dev === "disc" ? 8 : T.dev === "ecom" ? 100 : T.radius;
  const btnFg = T.dev === "sales" ? "#111111" : "#ffffff";
  const btnBg = T.dev === "sales" ? T.accent2 : T.accent;
  const btn = () => `<span style="display:inline-block;background:${btnBg};color:${btnFg};font-size:13px;font-weight:700;padding:${T.dev === "sales" ? "13px 26px" : "9px 18px"};border-radius:${btnRadius}px;font-family:${T.font}">${T.cta}</span>`;

  const badge = () => {
    if (T.dev === "disc") return `<div style="position:absolute;top:8px;right:8px;background:${T.accent};color:#fff;font-weight:800;font-size:12px;padding:5px 9px;border-radius:100px;font-family:${T.font}">SAVE</div>`;
    if (T.dev === "sales") return `<div style="background:${T.accent2};color:#111;font-weight:800;font-size:10px;letter-spacing:.1em;padding:3px 8px;border-radius:3px;display:inline-block;margin-bottom:8px;font-family:${T.font}">LIMITED TIME</div>`;
    if (T.dev === "med") return `<div style="color:${T.accent2};font-size:11px;font-weight:700;margin-bottom:6px;font-family:${T.font}">⚕ Vetted partner</div>`;
    if (T.dev === "ecom") return `<div style="color:#f5a623;font-size:13px;margin-bottom:4px">★★★★★</div>`;
    if (T.dev === "coupon") return `<div style="background:${T.ink};color:#fff;font-family:'Courier New',monospace;font-weight:700;font-size:12px;letter-spacing:.15em;padding:5px 10px;border-radius:6px;display:inline-block;margin-bottom:8px">CODE: SAVE</div>`;
    return "";
  };

  const displayCard = (e: Entry) => {
    const media = e.image
      ? `<img src="${esc(e.image)}" width="250" alt="${esc(e.title)}" style="display:block;width:100%;max-width:250px;height:auto;border-radius:${T.radius}px;margin:0 auto 10px">`
      : `<img src="${esc(e.favicon)}" width="44" height="44" alt="" style="display:block;border-radius:8px;margin:0 auto 8px">`;
    return `<td valign="top" style="width:50%;padding:8px">
      <a href="${trackUrl(e)}" style="text-decoration:none;color:${T.ink}">
        <div style="position:relative;border:${cardBorder};${cardTop}border-radius:${T.radius}px;padding:18px;background:${T.surface};text-align:center;font-family:${T.font}">
          ${badge()}${media}
          <div style="font-family:${T.headFont};font-weight:700;font-size:17px;color:${T.ink}">${esc(e.title)}</div>
          <div style="font-size:13px;color:${T.muted};margin:6px 0 12px;font-family:${T.font}">${esc(e.desc)}</div>
          ${btn()}
        </div></a></td>`;
  };
  const textRow = (e: Entry) => `<tr><td style="padding:11px 4px;border-bottom:1px solid #ececec;font-family:${T.font}">
      <a href="${trackUrl(e)}" style="text-decoration:none">
        <span style="font-family:${T.headFont};font-weight:700;font-size:15px;color:${T.accent}">${esc(e.title)}</span>
        <span style="color:${T.muted};font-size:13px"> — ${esc(e.desc)}</span>
      </a></td></tr>`;
  const chip = (e: Entry) => `<a href="${trackUrl(e)}" style="display:inline-block;margin:4px 6px 4px 0;padding:6px 12px;background:${T.bg};border:1px solid #e6e6e6;border-radius:100px;font-size:12.5px;color:${T.ink};text-decoration:none;font-family:${T.font}">${esc(e.title)}</a>`;

  const heroBox = (e: Entry) => {
    const media = e.image ? `<img src="${esc(e.image)}" width="600" alt="${esc(e.title)}" style="display:block;width:100%;height:auto;border-radius:${T.radius}px ${T.radius}px 0 0">` : "";
    return `<tr><td style="padding:8px"><a href="${trackUrl(e)}" style="text-decoration:none;color:${T.ink}">
      <div style="border:${cardBorder};${cardTop}border-radius:${T.radius}px;background:${T.surface};overflow:hidden;font-family:${T.font}">
        ${media}
        <div style="padding:22px 24px">
          <div style="font-family:${T.headFont};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${T.accent};margin-bottom:8px">★ Featured</div>
          <div style="font-family:${T.headFont};font-weight:800;font-size:26px;line-height:1.15;color:${T.ink}">${esc(e.title)}</div>
          <div style="font-size:15px;color:${T.muted};margin:10px 0 16px">${esc(e.desc)}</div>
          ${btn()}
        </div>
      </div></a></td></tr>`;
  };

  let displayHtml = "";
  for (let i = 0; i < sel.display.length; i += 2)
    displayHtml += `<tr>${displayCard(sel.display[i])}${sel.display[i + 1] ? displayCard(sel.display[i + 1]) : "<td style=\"width:50%\"></td>"}</tr>`;

  const textLabel = { biz: "Featured", ecom: "Trending", sales: "Don't miss out", phd: "Selected reading", info: "In this issue", disc: "Top deals", coupon: "Grab a code", med: "Recommended" }[T.dev] || "Featured";
  const disclaimer = T.dev === "med" ? `<tr><td style="padding:6px 8px;text-align:center;font-size:10px;color:#9aa0a6;font-family:${T.font}">Informational only — not medical advice. Consult a licensed professional.</td></tr>` : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${T.bg};padding:16px 0"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;font-family:${T.font}">
    ${sel.hero ? heroBox(sel.hero) : ""}
    ${sel.display.length ? `<tr><td style="padding:4px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${displayHtml}</table></td></tr>` : ""}
    ${sel.text.length ? `<tr><td style="padding:6px 8px"><div style="font-family:${T.headFont};font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${T.muted}">${textLabel}</div></td></tr><tr><td style="padding:0 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${sel.text.map(textRow).join("")}</table></td></tr>` : ""}
    ${sel.cloud.length ? `<tr><td style="padding:12px 8px"><div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${T.muted};margin-bottom:8px;font-family:${T.headFont}">More from the network</div>${sel.cloud.map(chip).join("")}</td></tr>` : ""}
    ${disclaimer}
    <tr><td style="padding:14px 8px;text-align:center;font-size:11px;color:#9aa0a6;font-family:${T.font}">Powered by <a href="https://el.ag" style="color:${T.accent};text-decoration:none">the R0cketShip network</a> — a rising tide lifts all boats 🚀</td></tr>
  </table></td></tr></table>`;
}

// compact sample for the theme-picker thumbnails
export function renderThumb(themeKey: string, sample: Entry[]): string {
  const spec: Spec = { d: 2, t: 2, c: 0, order: "newest", theme: themeKey };
  const sel = { hero: null as Entry | null, display: sample.slice(0, 2), text: sample.slice(2, 4), cloud: [] as Entry[] };
  return renderEmailHtml(sel, spec);
}
