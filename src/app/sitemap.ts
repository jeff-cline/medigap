import type { MetadataRoute } from "next";
import { nicheSlugs, SITE_URL } from "@/lib/niches";
import { siloIndex } from "@/lib/silos";

// XML sitemap → /sitemap.xml. Marketing surface + the full silo site (815 pages).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["", "/insurance", "/answers", "/sitemap", "/faq", "/about", "/contact", "/blog", "/privacy", "/terms"];
  const niche = nicheSlugs().map((s) => `/insurance/${s}`);

  // Silo pillars + every child page.
  const silo: { url: string; priority: number }[] = [];
  for (const s of siloIndex()) {
    silo.push({ url: `/${s.slug}`, priority: 0.9 });
    for (const c of s.childSlugs) silo.push({ url: `/${s.slug}/${c.slug}`, priority: 0.7 });
  }

  return [
    ...staticRoutes.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: (p === "" ? "daily" : "weekly") as "daily" | "weekly", priority: p === "" ? 1 : 0.6 })),
    ...niche.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...silo.map((s) => ({ url: `${SITE_URL}${s.url}`, lastModified: now, changeFrequency: "weekly" as const, priority: s.priority })),
  ];
}
