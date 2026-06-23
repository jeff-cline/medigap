import { db } from "./db";
import { sanitizeBlocks, type Block } from "./blocks";
import type { SiteNavLink } from "@/components/site/SiteShell";

export type LoadedPage = { title: string; metaDescription: string; heroHeadline: string; kind: string; blocks: Block[] };

// Load one published page for a site by slug. Returns null if missing/unpublished.
export async function loadPage(siteId: string, slug: string): Promise<LoadedPage | null> {
  const page = await db.sitePage.findUnique({ where: { siteId_slug: { siteId, slug } } }).catch(() => null);
  if (!page || !page.published) return null;
  return { title: page.title, metaDescription: page.metaDescription, heroHeadline: page.heroHeadline, kind: page.kind, blocks: sanitizeBlocks(safeParse(page.blocks)) };
}

// Header/footer nav for a site: top resource pages + FAQ + Blog (when present).
export async function siteNav(siteId: string): Promise<SiteNavLink[]> {
  const pages = await db.sitePage.findMany({
    where: { siteId, published: true, kind: { in: ["page", "faq", "blog"] } },
    orderBy: { order: "asc" },
    select: { slug: true, kind: true, title: true },
  }).catch(() => []);

  const nav: SiteNavLink[] = [];
  for (const p of pages.filter((p) => p.kind === "page").slice(0, 5)) {
    nav.push({ label: shorten(p.title), href: `/${p.slug}` });
  }
  if (pages.some((p) => p.kind === "blog")) nav.push({ label: "Blog", href: "/blog" });
  if (pages.some((p) => p.kind === "faq")) nav.push({ label: "FAQ", href: "/faq" });
  return nav;
}

// List blog posts for the /blog index.
export async function blogPosts(siteId: string): Promise<{ slug: string; title: string; metaDescription: string }[]> {
  const posts = await db.sitePage.findMany({
    where: { siteId, published: true, kind: "blog" },
    orderBy: { order: "asc" },
    select: { slug: true, title: true, metaDescription: true },
  }).catch(() => []);
  return posts;
}

// True once a site has any published generated content (used by the homepage to decide
// whether to render the generated home or fall back to the default white-label homepage).
export async function hasGeneratedHome(siteId: string): Promise<boolean> {
  const home = await db.sitePage.findUnique({ where: { siteId_slug: { siteId, slug: "" } } }).catch(() => null);
  return !!home && home.published && safeParse(home.blocks) !== null && Array.isArray(safeParse(home.blocks)) && (safeParse(home.blocks) as unknown[]).length > 0;
}

function safeParse(s: string): unknown { try { return JSON.parse(s || "[]"); } catch { return []; } }
function shorten(t: string): string { return t.length > 22 ? t.slice(0, 20).trim() + "…" : t; }
