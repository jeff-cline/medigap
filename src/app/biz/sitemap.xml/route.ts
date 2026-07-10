import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "1800medigap.biz").replace(/^www\./, "").split(":")[0];
  const b = `https://${host}`;
  const urls = ["", "vanity"];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${b}/${u}</loc><changefreq>weekly</changefreq><priority>${u ? "0.7" : "1.0"}</priority></url>`).join("\n") + `\n</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
