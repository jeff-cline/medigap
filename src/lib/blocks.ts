// Typed content blocks — the ONLY shapes Claude may emit and the renderer understands.
// Keeping a fixed, small vocabulary makes generated pages deterministic and guarantees
// they render with the site's own homepage styling (no arbitrary HTML/CSS).

export type Block =
  | { type: "hero"; headline: string; sub?: string; image?: ImageRef }
  | { type: "richText"; heading?: string; markdown: string }
  | { type: "featureGrid"; heading?: string; items: { icon?: string; title: string; body: string; href?: string }[] }
  | { type: "imageWithText"; heading?: string; body: string; image?: ImageRef; flip?: boolean }
  | { type: "stat"; items: { value: string; label: string }[] }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "faq"; heading?: string; items: { q: string; a: string }[] }
  | { type: "cta"; headline: string; sub?: string; mode?: "call" | "form" };

export type ImageRef = { url: string; alt: string; photographer?: string; photographerUrl?: string };

export const BLOCK_TYPES = ["hero", "richText", "featureGrid", "imageWithText", "stat", "quote", "faq", "cta"] as const;

// Coerce arbitrary parsed JSON into a safe Block[] — drop anything unrecognized so a
// malformed model response can never crash a page render.
export function sanitizeBlocks(input: unknown): Block[] {
  if (!Array.isArray(input)) return [];
  const out: Block[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const b = raw as Record<string, unknown>;
    const t = String(b.type || "");
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    const img = (v: unknown): ImageRef | undefined => {
      if (!v || typeof v !== "object") return undefined;
      const o = v as Record<string, unknown>;
      return o.url ? { url: String(o.url), alt: str(o.alt), photographer: str(o.photographer), photographerUrl: str(o.photographerUrl) } : undefined;
    };
    switch (t) {
      case "hero": out.push({ type: "hero", headline: str(b.headline), sub: str(b.sub), image: img(b.image) }); break;
      case "richText": if (str(b.markdown)) out.push({ type: "richText", heading: str(b.heading), markdown: str(b.markdown) }); break;
      case "featureGrid": {
        const items = Array.isArray(b.items) ? b.items.map((i) => { const o = i as Record<string, unknown>; return { icon: str(o.icon), title: str(o.title), body: str(o.body), href: str(o.href) }; }).filter((i) => i.title) : [];
        if (items.length) out.push({ type: "featureGrid", heading: str(b.heading), items });
        break;
      }
      case "imageWithText": if (str(b.body)) out.push({ type: "imageWithText", heading: str(b.heading), body: str(b.body), image: img(b.image), flip: !!b.flip }); break;
      case "stat": {
        const items = Array.isArray(b.items) ? b.items.map((i) => { const o = i as Record<string, unknown>; return { value: str(o.value), label: str(o.label) }; }).filter((i) => i.value) : [];
        if (items.length) out.push({ type: "stat", items });
        break;
      }
      case "quote": if (str(b.text)) out.push({ type: "quote", text: str(b.text), attribution: str(b.attribution) }); break;
      case "faq": {
        const items = Array.isArray(b.items) ? b.items.map((i) => { const o = i as Record<string, unknown>; return { q: str(o.q), a: str(o.a) }; }).filter((i) => i.q && i.a) : [];
        if (items.length) out.push({ type: "faq", heading: str(b.heading), items });
        break;
      }
      case "cta": if (str(b.headline)) out.push({ type: "cta", headline: str(b.headline), sub: str(b.sub), mode: b.mode === "form" ? "form" : "call" }); break;
    }
  }
  return out;
}
