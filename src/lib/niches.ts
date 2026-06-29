import data from "@/content/niche-content.json";

export type NicheFaq = { q: string; a: string };
export type NicheBenefit = { icon: string; title: string; body: string };
export type NicheSection = { h2: string; body: string };
export type Niche = {
  vertical: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  heroSubhead: string;
  quickAnswer: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  trustPoints: string[];
  benefits: NicheBenefit[];
  sections: NicheSection[];
  faqs: NicheFaq[];
  ctaLine: string;
};

// Canonical host: 1-800-medigap.com is the top-of-stack marketing site. These pages also render
// on medigap.plus, so we point canonical/OG/sitemap at 1-800-medigap.com to consolidate SEO.
export const SITE_URL = "https://1-800-medigap.com";

export const NICHES = data as Niche[];
export const getNiche = (slug: string): Niche | undefined => NICHES.find((n) => n.slug === slug);
export const nicheSlugs = (): string[] => NICHES.map((n) => n.slug);
