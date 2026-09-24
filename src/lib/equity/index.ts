import type { EquityUse, CategoryKey } from "./types";
import { BUSINESS } from "./business";
import { REAL_ESTATE } from "./real-estate";
import { HOME } from "./home";
import { DEBT } from "./debt";
import { PROTECTION } from "./protection";
import { INVESTING } from "./investing";
import { EDUCATION } from "./education";
import { MEDICAL } from "./medical";
import { FAMILY } from "./family";

export * from "./types";

/** All 100 keyword pages, in source order. */
export const USES: EquityUse[] = [
  ...BUSINESS,      // 1–13
  ...REAL_ESTATE,   // 14–26
  ...HOME,          // 27–45
  ...DEBT,          // 46–58
  ...PROTECTION,    // 59–65
  ...INVESTING,     // 66–74
  ...EDUCATION,     // 75–80
  ...MEDICAL,       // 81–90
  ...FAMILY,        // 91–100
];

// Fail loudly at build time rather than shipping a broken sitemap or a
// duplicate URL. A silent duplicate slug would make two pages fight for the
// same route and quietly cost us one of them in search.
const slugs = new Set<string>();
for (const u of USES) {
  if (slugs.has(u.slug)) throw new Error(`equity: duplicate slug "${u.slug}"`);
  slugs.add(u.slug);
}
if (USES.length !== 100) {
  throw new Error(`equity: expected 100 keyword pages, found ${USES.length}`);
}

export const bySlug = (slug: string): EquityUse | undefined =>
  USES.find((u) => u.slug === slug);

export const byCategory = (key: CategoryKey): EquityUse[] =>
  USES.filter((u) => u.category === key);

/** Canonical path for a page. Category-first, so the silo is in the URL. */
export const pathFor = (u: EquityUse): string => `/${u.category}/${u.slug}`;

/**
 * Related pages for internal linking.
 *
 * Same category first — that is what a reader most plausibly wants next — then
 * one from a different category so the crawl graph is not a set of disconnected
 * islands. Deterministic, because a sitemap that changes on every build is a
 * sitemap search engines learn to distrust.
 */
export function relatedTo(u: EquityUse, count = 6): EquityUse[] {
  const sameCategory = byCategory(u.category).filter((x) => x.slug !== u.slug);
  const start = sameCategory.findIndex((x) => x.n > u.n);
  const rotated = start === -1
    ? sameCategory
    : [...sameCategory.slice(start), ...sameCategory.slice(0, start)];

  const picked = rotated.slice(0, count - 1);
  // One deliberate cross-category link, chosen by position so it is stable.
  const others = USES.filter((x) => x.category !== u.category);
  const bridge = others[u.n % others.length];
  return [...picked, bridge].slice(0, count);
}

/**
 * The homepage's featured set: the highest-intent page from each category.
 *
 * Every one of the 100 is reachable in two clicks via its category hub, so
 * this is about giving the strongest pages a direct link from the root rather
 * than about coverage.
 */
export const FEATURED_SLUGS = [
  "start-a-business",
  "buy-rental-property",
  "major-home-remodel",
  "pay-off-credit-card-debt",
  "long-term-care-planning",
  "build-investment-portfolio",
  "college-tuition",
  "dental-implants",
  "help-child-buy-home",
] as const;

export const featured = (): EquityUse[] =>
  FEATURED_SLUGS.map((s) => bySlug(s)).filter(Boolean) as EquityUse[];
