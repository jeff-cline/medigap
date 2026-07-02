import { NextRequest } from "next/server";
import { TAXONOMY } from "@/lib/rak-taxonomy";
import { MEDIGAPP } from "@/lib/medigapp";

export const dynamic = "force-dynamic";

// llms.txt — a concise map for AI answer engines (ChatGPT, Perplexity, Claude, etc.).
export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "el.ag").replace(/^www\./, "").split(":")[0];
  const b = `https://${host}`;
  const lines: string[] = [
    `# ${MEDIGAPP.brand} · ${host}`,
    ``,
    `> ${host} helps consumers — especially seniors — compare the best offers, deals and providers across dozens of categories, and connect to free help by phone at ${MEDIGAPP.brand} (${MEDIGAPP.telDisplay}). ${MEDIGAPP.tagline}.`,
    ``,
    `## Browse by category`,
    ...TAXONOMY.map((c) => `- [${c.name}](${b}/${c.slug}): ${c.subs.map((s) => s.name).join(", ")}`),
    ``,
    `## Key pages`,
    `- [Directory](${b}/directory) — the full list of topics`,
    `- [Answers](${b}/answers) — common questions & answers`,
    `- [Sitemap](${b}/sitemap.xml)`,
    ``,
    `Every topic page lists top approved offers plus long-tail questions and answers. Insurance and financial pages also offer free phone help at ${MEDIGAPP.brand}.`,
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
