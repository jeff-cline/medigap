import { CATEGORIES, USES, pathFor } from "@/lib/equity";

export const dynamic = "force-static";

// XML sitemap for equity.direct. Reached as equity.direct/sitemap.xml — the
// middleware rewrites that path into /equity/sitemap.xml.
//
// Every URL the site wants indexed appears exactly once: the homepage, the nine
// category hubs, and the 100 keyword pages. Priorities are relative rather than
// absolute — a sitemap that marks everything 1.0 tells a crawler nothing.
const BASE = "https://equity.direct";

export function GET() {
  const now = new Date().toISOString().slice(0, 10);

  const urls: { loc: string; priority: string; changefreq: string }[] = [
    { loc: `${BASE}/`, priority: "1.0", changefreq: "weekly" },
    ...CATEGORIES.map((c) => ({
      loc: `${BASE}/${c.key}`,
      priority: "0.8",
      changefreq: "weekly",
    })),
    ...USES.map((u) => ({
      loc: `${BASE}${pathFor(u)}`,
      priority: "0.7",
      changefreq: "monthly",
    })),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n` +
          `    <loc>${u.loc}</loc>\n` +
          `    <lastmod>${now}</lastmod>\n` +
          `    <changefreq>${u.changefreq}</changefreq>\n` +
          `    <priority>${u.priority}</priority>\n` +
          `  </url>`,
      )
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
