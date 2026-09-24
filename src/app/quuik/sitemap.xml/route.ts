import { sitemapUrls } from "@/lib/gptfinder";
export const dynamic = "force-dynamic";
const BASE = "https://quuik.com";
export function GET() {
  const now = new Date().toISOString();
  const statics = [{ loc: "/", lastmod: now }, { loc: "/GPT-FINDER", lastmod: now }, { loc: "/join", lastmod: now }];
  const urls = [...statics, ...sitemapUrls()];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${BASE}${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join("\n") +
    `\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
