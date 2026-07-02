import { db } from "@/lib/db";

export const MEDIGAPP = {
  brand: "1-800-MEDIGAP",
  tel: "18006334427",
  telDisplay: "1-800-633-4427",
  tagline: "America's Trusted Toll-Free Number",
  colors: { bg: "#ffffff", ink: "#0b2348", brand: "#1457e6", green: "#0b8a6a", gold: "#c69a3e", soft: "#f4f7fc", border: "#e4e9f2", muted: "#5b6b86" },
} as const;

export const rakSubId = (slug: string, offerId: string) =>
  `mg_${slug}_${offerId}`.replace(/[^a-z0-9_]/gi, "").slice(0, 60);

export type Offer = { id: string; advertiser: string; title: string; description: string; imageUrl: string; deepLink: string; category: string; payoutNote: string };

/** Offers for a lander: explicit offerIds if set, else auto-match approved+active offers by the page's money word/keyword. */
export async function offersForPage(page: { moneyWord: string; slug: string; offerIds: string }): Promise<Offer[]> {
  let ids: string[] = [];
  try { ids = JSON.parse(page.offerIds || "[]"); } catch {}
  if (ids.length) {
    const rows = await db.rakOffer.findMany({ where: { id: { in: ids }, active: true, approved: true } });
    const byId = new Map(rows.map((r) => [r.id, r]));
    return ids.map((i) => byId.get(i)).filter((o): o is NonNullable<typeof o> => !!o).map(mapOffer);
  }
  const kw = (page.moneyWord || page.slug.replace(/-/g, " ")).toLowerCase().split(/\s+/).filter(Boolean);
  const all = await db.rakOffer.findMany({ where: { active: true, approved: true }, orderBy: { sortOrder: "asc" } });
  const scored = all
    .map((o) => ({ o, score: kw.reduce((s, w) => s + ((`${o.title} ${o.description} ${o.category} ${o.keywords}`.toLowerCase().includes(w)) ? 1 : 0), 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return (scored.length ? scored.map((x) => x.o) : all).slice(0, 12).map(mapOffer);
}
function mapOffer(o: { id: string; advertiser: string; title: string; description: string; imageUrl: string; deepLink: string; category: string; payoutNote: string }): Offer {
  return { id: o.id, advertiser: o.advertiser, title: o.title, description: o.description, imageUrl: o.imageUrl, deepLink: o.deepLink, category: o.category, payoutNote: o.payoutNote };
}

/** Approved+active offers best-matching a keyword phrase (else the top approved offers). */
export async function offersForKeyword(keyword: string, limit = 12): Promise<Offer[]> {
  const kw = keyword.toLowerCase().split(/\s+/).filter(Boolean);
  const all = await db.rakOffer.findMany({ where: { active: true, approved: true }, orderBy: { sortOrder: "asc" } });
  const scored = all
    .map((o) => ({ o, score: kw.reduce((s, w) => s + ((`${o.title} ${o.description} ${o.category} ${o.keywords}`.toLowerCase().includes(w)) ? 1 : 0), 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return (scored.length ? scored.map((x) => x.o) : all).slice(0, limit).map(mapOffer);
}

/** The reporting engine: clicks out, views in, revenue, best pages, best offers. */
export async function rakReport() {
  const [views, outs, events, pages, offers] = await Promise.all([
    db.rakClick.count({ where: { kind: "view" } }),
    db.rakClick.count({ where: { kind: "out" } }),
    db.rakEvent.findMany(),
    db.rakPage.findMany({ orderBy: { createdAt: "desc" } }),
    db.rakOffer.findMany(),
  ]);
  const revenueCents = events.reduce((s, e) => s + (e.status !== "reversed" ? e.commissionCents : 0), 0);
  const outClicks = await db.rakClick.findMany({ where: { kind: "out" }, select: { slug: true, offerId: true } });
  const viewClicks = await db.rakClick.findMany({ where: { kind: "view" }, select: { slug: true } });

  const bySlug = new Map<string, { views: number; outs: number; revCents: number }>();
  for (const v of viewClicks) { const g = bySlug.get(v.slug) || { views: 0, outs: 0, revCents: 0 }; g.views++; bySlug.set(v.slug, g); }
  for (const o of outClicks) { const g = bySlug.get(o.slug) || { views: 0, outs: 0, revCents: 0 }; g.outs++; bySlug.set(o.slug, g); }
  for (const e of events) { const g = bySlug.get(e.slug) || { views: 0, outs: 0, revCents: 0 }; g.revCents += (e.status !== "reversed" ? e.commissionCents : 0); bySlug.set(e.slug, g); }

  const offerName = new Map(offers.map((o) => [o.id, o.title || o.advertiser || o.id]));
  const byOffer = new Map<string, { outs: number; revCents: number }>();
  for (const o of outClicks) { const g = byOffer.get(o.offerId) || { outs: 0, revCents: 0 }; g.outs++; byOffer.set(o.offerId, g); }
  for (const e of events) { const g = byOffer.get(e.offerId) || { outs: 0, revCents: 0 }; g.revCents += (e.status !== "reversed" ? e.commissionCents : 0); byOffer.set(e.offerId, g); }

  const topPages = [...bySlug.entries()].map(([slug, g]) => ({ slug, ...g, epcCents: g.outs ? Math.round(g.revCents / g.outs) : 0, ctr: g.views ? g.outs / g.views : 0 })).sort((a, b) => b.revCents - a.revCents);
  const topOffers = [...byOffer.entries()].map(([id, g]) => ({ id, name: offerName.get(id) || id, ...g, epcCents: g.outs ? Math.round(g.revCents / g.outs) : 0 })).sort((a, b) => b.revCents - a.revCents);

  return {
    totals: { views, outs, revenueCents, ctr: views ? outs / views : 0, epcCents: outs ? Math.round(revenueCents / outs) : 0, events: events.length },
    pages, offers, topPages, topOffers,
  };
}
