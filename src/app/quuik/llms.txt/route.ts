import { readCategories } from "@/lib/gptfinder";
export const dynamic = "force-dynamic";
export function GET() {
  const cats = readCategories();
  const lines = [
    "# Quuik — Trusted GPT",
    "> Real, sourced answers to the questions people actually ask, organized by topic and updated in real time.",
    "", "## Topics",
    ...cats.map((c) => `- [${c.title}](https://quuik.com/${c.cat}): ${c.description || `Common questions about ${c.title}.`}`),
    "", "## Index", "- [All answers](https://quuik.com/GPT-FINDER)", "- [Sitemap](https://quuik.com/sitemap.xml)", "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
