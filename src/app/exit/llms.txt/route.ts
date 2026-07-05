import { NextRequest } from "next/server";
import { EXIT } from "@/lib/exit";
import { EXIT_MONEY } from "@/lib/exit-taxonomy";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "exitoptimization.com").replace(/^www\./, "").split(":")[0];
  const b = `https://${host}`;
  const lines = [
    `# ${EXIT.brand} · ${host}`,
    ``,
    `> ${EXIT.brand} helps business owners double — even triple — their exit valuation. We assemble and quarterback the specialists (valuation & sale attorneys, M&A CPAs, exit consultants) plus technology, predictive data, and leadership that expand a company's multiple before a sale. Three ways to engage: pay to play, we work for equity, or we work for backend success.`,
    ``,
    `## Specialists & services`,
    ...EXIT_MONEY.map((m) => `- [${m.name}](${b}/${m.slug}): ${m.blurb}`),
    ``,
    `## Key pages`,
    `- [How we work — 3 ways](${b}/how-we-work)`,
    `- [FAQ](${b}/faq)`,
    `- [Sitemap](${b}/sitemap.xml)`,
    `- [Book a free consultation](${EXIT.calendly})`,
    ``,
    `Goal on every engagement: multiply the exit multiple. Book a free consultation to increase your valuation.`,
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
