import { NextRequest } from "next/server";
import { STATES, slugify } from "@/lib/health";
import { allCarriers } from "@/lib/health-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "healthinsuranceapplication.com").replace(/^www\./, "").split(":")[0];
  const b = `https://${host}`;
  const urls = new Set<string>(["", "health-insurance-companies", "apply", "insurance-quotes", "health-insurance-plans", "health-savings-account", "faq", "aeo-sitemap", "sitemap.html"]);
  for (const s of STATES) urls.add(`apply/${slugify(s.name)}`);
  for (const c of allCarriers()) { urls.add(`private/${c.slug}`); for (const a of c.applications) urls.add(`private/${c.slug}/${a.slug}`); }
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [...urls].map((u) => `  <url><loc>${b}/${u}</loc><changefreq>weekly</changefreq></url>`).join("\n") + `\n</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
