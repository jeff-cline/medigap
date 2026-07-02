import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { TAXONOMY } from "@/lib/rak-taxonomy";

export const dynamic = "force-dynamic";

// Host-aware XML sitemap for el.ag / medig.app — home, directory, answers, every category,
// every subcategory, and every money-word lander.
export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "el.ag").replace(/^www\./, "").split(":")[0];
  const b = `https://${host}`;
  const pages = await db.rakPage.findMany({ where: { active: true }, select: { slug: true } }).catch(() => []);
  const urls = new Set<string>(["", "directory", "answers"]);
  for (const c of TAXONOMY) { urls.add(c.slug); for (const s of c.subs) urls.add(s.slug); }
  for (const p of pages) urls.add(p.slug);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [...urls].map((u) => `  <url><loc>${b}/${u}</loc><changefreq>daily</changefreq></url>`).join("\n") +
    `\n</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
