import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "el.ag").replace(/^www\./, "").split(":")[0];
  const body = `User-agent: *\nAllow: /\n\nSitemap: https://${host}/sitemap.xml\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
