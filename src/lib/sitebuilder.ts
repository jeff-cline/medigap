import { db } from "./db";
import { claudeJson, claudeText, extractJson } from "./claude";
import { photoFor, searchPhotos } from "./pexels";
import { getKeywordCpcCents } from "./dataforseo";
import { sanitizeBlocks, type Block, type ImageRef } from "./blocks";
import { TOLLFREE } from "./format";

// ---------------------------------------------------------------------------
// The build brief — Claude expands a rough prompt into this structure.
// ---------------------------------------------------------------------------
export type BriefPage = { slug: string; title: string; intent: string; keywords: string[] };
export type Brief = {
  audience: string;
  brandColor: string;
  heroHeadline: string;
  tagline: string;
  pages: BriefPage[];     // 6-8 resource pages
  faqs: { q: string }[];  // ~20 questions
  blog: BriefPage[];      // ~6 posts
  sponsorPhone: string;
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

// ---------------------------------------------------------------------------
// STEP 1 — engineer a rough prompt into a structured brief.
// ---------------------------------------------------------------------------
export async function engineerBrief(site: { name: string; hostname: string; vertical: string }, prompt: string): Promise<Brief | null> {
  const system = `You are a senior content strategist building a multi-page marketing/resource website for the over-65 / senior-care space. Output ONLY compact JSON, no prose. The site is sponsored by ${TOLLFREE} (a free senior insurance & services concierge) — every page should ultimately drive the visitor to call ${TOLLFREE} or submit a lead form.`;
  const ask = `Site name: "${site.name}" (${site.hostname}), vertical: ${site.vertical}.
Owner's rough prompt:
"""${prompt}"""

Expand this into a build brief as JSON with EXACTLY these keys:
{
  "audience": "one sentence describing the target visitor",
  "brandColor": "#hex — a warm, senior-friendly accent color",
  "heroHeadline": "homepage hero headline (<= 12 words)",
  "tagline": "one supporting sentence under the hero",
  "pages": [ { "slug": "kebab-case", "title": "Resource page title", "intent": "what this page covers and the action it drives", "keywords": ["seo phrase", ...] } ],   // 6 to 8 resource/topic pages
  "faqs": [ { "q": "a real question an adult child asks" }, ... ],  // EXACTLY 20 questions
  "blog": [ { "slug": "kebab-case", "title": "Blog post title", "intent": "angle of the post", "keywords": ["seo phrase", ...] } ]  // 6 posts
}
Make pages and posts specific to the prompt's niche. Keywords should be real search phrases (3-5 per item).`;

  const brief = await claudeJson<Partial<Brief>>({ system, prompt: ask, maxTokens: 3000, temperature: 0.6, timeoutMs: 90000 });
  if (!brief) return null;

  // Normalize / harden.
  const pages = (Array.isArray(brief.pages) ? brief.pages : []).slice(0, 8).map(normalizeBriefPage).filter((p) => p.slug && p.title);
  const blog = (Array.isArray(brief.blog) ? brief.blog : []).slice(0, 6).map(normalizeBriefPage).filter((p) => p.slug && p.title);
  const faqs = (Array.isArray(brief.faqs) ? brief.faqs : []).map((f) => ({ q: String((f as { q?: string })?.q || "").trim() })).filter((f) => f.q).slice(0, 20);
  return {
    audience: String(brief.audience || "").slice(0, 300),
    brandColor: /^#?[0-9a-fA-F]{3,8}$/.test(String(brief.brandColor)) ? (String(brief.brandColor).startsWith("#") ? String(brief.brandColor) : `#${brief.brandColor}`) : "#34d399",
    heroHeadline: String(brief.heroHeadline || site.name).slice(0, 140),
    tagline: String(brief.tagline || "").slice(0, 240),
    pages, faqs, blog,
    sponsorPhone: TOLLFREE,
  };
}

function normalizeBriefPage(p: unknown): BriefPage {
  const o = (p || {}) as Record<string, unknown>;
  const title = String(o.title || "").trim().slice(0, 120);
  return {
    slug: slugify(String(o.slug || title)),
    title,
    intent: String(o.intent || "").slice(0, 400),
    keywords: Array.isArray(o.keywords) ? o.keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 6) : [],
  };
}

// ---------------------------------------------------------------------------
// STEP 2 — build the whole site in the background. Fire-and-forget.
// ---------------------------------------------------------------------------
export function buildSiteBackground(siteId: string) {
  buildSite(siteId).catch(async (e) => {
    await db.site.update({ where: { id: siteId }, data: { buildStatus: "error", buildProgress: JSON.stringify({ error: String(e?.message || e) }) } }).catch(() => {});
  });
}

type WorkItem = { kind: "home" | "page" | "faq" | "blog"; slug: string; title: string; intent: string; keywords: string[] };

export async function buildSite(siteId: string): Promise<void> {
  const site = await db.site.findUnique({ where: { id: siteId } });
  if (!site) return;
  const brief = (extractJson<Brief>(site.buildBrief) || {}) as Brief;
  if (!brief.pages) throw new Error("No brief to build from");

  // Persist the brand color so homepage + renderer pick it up.
  if (brief.brandColor) await db.site.update({ where: { id: siteId }, data: { brandColor: brief.brandColor, heroHeadline: brief.heroHeadline || site.heroHeadline } }).catch(() => {});

  const items: WorkItem[] = [
    { kind: "home", slug: "", title: site.name, intent: brief.tagline || "Homepage", keywords: [] },
    ...brief.pages.map((p) => ({ kind: "page" as const, slug: `resources/${p.slug}`, title: p.title, intent: p.intent, keywords: p.keywords })),
    { kind: "faq", slug: "faq", title: "Frequently Asked Questions", intent: "Top questions answered", keywords: [] },
    ...brief.blog.map((p) => ({ kind: "blog" as const, slug: `blog/${p.slug}`, title: p.title, intent: p.intent, keywords: p.keywords })),
  ];

  const total = items.length;
  await db.site.update({ where: { id: siteId }, data: { buildStatus: "building", buildProgress: JSON.stringify({ done: 0, total, current: "Starting…" }) } });

  let done = 0;
  for (const item of items) {
    await db.site.update({ where: { id: siteId }, data: { buildProgress: JSON.stringify({ done, total, current: item.title }) } }).catch(() => {});
    try {
      const { blocks, images, keywords } = await buildPage(site.name, brief, item);
      await db.sitePage.upsert({
        where: { siteId_slug: { siteId, slug: item.slug } },
        update: { kind: item.kind, title: item.title, heroHeadline: item.title, blocks: JSON.stringify(blocks), images: JSON.stringify(images), keywords: JSON.stringify(keywords), published: true, order: done },
        create: { siteId, kind: item.kind, slug: item.slug, title: item.title, heroHeadline: item.title, metaDescription: item.intent.slice(0, 180), blocks: JSON.stringify(blocks), images: JSON.stringify(images), keywords: JSON.stringify(keywords), published: true, order: done },
      });
    } catch {
      // One page failing must not abort the whole build — leave a minimal placeholder.
      await db.sitePage.upsert({
        where: { siteId_slug: { siteId, slug: item.slug } },
        update: {}, create: { siteId, kind: item.kind, slug: item.slug, title: item.title, blocks: "[]", published: false, order: done },
      }).catch(() => {});
    }
    done++;
  }

  await db.site.update({ where: { id: siteId }, data: { buildStatus: "complete", buildProgress: JSON.stringify({ done, total, current: "Done" }) } });
}

// Generate one page: photos + Claude content blocks (+ live keyword CPC when available).
async function buildPage(siteName: string, brief: Brief, item: WorkItem): Promise<{ blocks: Block[]; images: ImageRef[]; keywords: { word: string; cpcCents?: number }[] }> {
  // 1) Photos for this topic (fallback to none → renderer uses SVG art).
  const photoQuery = `${item.title} senior elderly family`;
  const images = await searchPhotos(photoQuery, item.kind === "home" ? 2 : 1).catch(() => [] as ImageRef[]);

  // 2) Live keyword CPC (best-effort, first keyword only).
  const keywords: { word: string; cpcCents?: number }[] = [];
  for (const kw of item.keywords.slice(0, 3)) {
    const cpc = await getKeywordCpcCents(kw).catch(() => null);
    keywords.push(cpc ? { word: kw, cpcCents: cpc } : { word: kw });
  }

  // 3) Claude writes the typed blocks.
  const system = `You write warm, clear, trustworthy web copy for seniors and their adult children. Reading level: easy. The site "${siteName}" is sponsored by ${TOLLFREE} (a FREE senior insurance & services concierge). Weave in natural calls to action to phone ${TOLLFREE} or request a free quote. Output ONLY a JSON array of content blocks — no prose, no markdown fences.`;

  const blockSpec = `Allowed block types (use a tasteful mix, 4-7 blocks):
- {"type":"hero","headline":"...","sub":"..."}
- {"type":"richText","heading":"...","markdown":"2-4 short paragraphs; **bold** ok"}
- {"type":"featureGrid","heading":"...","items":[{"icon":"shield|home|heart|phone|user","title":"...","body":"..."}]}
- {"type":"imageWithText","heading":"...","body":"..."}
- {"type":"stat","items":[{"value":"100k+","label":"..."}]}
- {"type":"quote","text":"...","attribution":"..."}
- {"type":"cta","headline":"...","sub":"...","mode":"call"}
Rules: start with a "hero". End with a "cta". Do NOT include image URLs (added separately). Keep it specific to this page's intent.`;

  let blocks: Block[] = [];
  if (item.kind === "faq") {
    // FAQ page: answer the 20 brief questions in one call.
    const qs = brief.faqs.map((f, i) => `${i + 1}. ${f.q}`).join("\n");
    const text = await claudeText({
      system,
      prompt: `Create the FAQ page for "${siteName}". Return ONLY a JSON array with a "hero" block, one "faq" block answering ALL of these questions (2-4 sentence answers, mention ${TOLLFREE} where natural), and a final "cta" block.\nQuestions:\n${qs}`,
      maxTokens: 4000, temperature: 0.5, timeoutMs: 120000,
    });
    blocks = sanitizeBlocks(extractJson(text));
  } else {
    const text = await claudeText({
      system,
      prompt: `Page: "${item.title}". Intent: ${item.intent}. Target keywords: ${item.keywords.join(", ") || "n/a"}.\n${blockSpec}\nReturn ONLY the JSON array.`,
      maxTokens: 3000, temperature: 0.7, timeoutMs: 90000,
    });
    blocks = sanitizeBlocks(extractJson(text));
  }

  // Fallback: never leave a page blank.
  if (blocks.length === 0) {
    blocks = [
      { type: "hero", headline: item.title, sub: brief.tagline },
      { type: "richText", markdown: item.intent || `Learn more about ${item.title}. Call ${TOLLFREE} to speak with a caring specialist — it's free.` },
      { type: "cta", headline: `Talk to a specialist — free`, sub: `Call ${TOLLFREE} or request a quote.`, mode: "call" },
    ];
  }

  // 4) Inject fetched photos into the hero + first imageWithText slots.
  if (images.length) {
    const hero = blocks.find((b) => b.type === "hero") as Extract<Block, { type: "hero" }> | undefined;
    if (hero) hero.image = images[0];
    const iwt = blocks.find((b) => b.type === "imageWithText") as Extract<Block, { type: "imageWithText" }> | undefined;
    if (iwt && images[1]) iwt.image = images[1];
    else if (iwt) iwt.image = images[0];
  }

  return { blocks, images, keywords };
}
