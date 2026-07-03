import { NextRequest } from "next/server";
import { XM_SILOS, xmAllUrls } from "@/lib/xm-taxonomy";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "experientialmarketing.ai").replace(/^www\./, "").split(":")[0];
  const b = `https://${host}`;
  const urls = ["", "calculator", "white-paper", "start", "answers", ...xmAllUrls()];
  void XM_SILOS;
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${b}/${u}</loc><changefreq>weekly</changefreq></url>`).join("\n") + `\n</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
