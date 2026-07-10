import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "1800medigap.biz").replace(/^www\./, "").split(":")[0];
  return new Response(`User-agent: *\nAllow: /\nDisallow: /book\n\nSitemap: https://${host}/sitemap.xml\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
