import { NextRequest } from "next/server";
import { XM } from "@/lib/xm";
import { XM_SILOS } from "@/lib/xm-taxonomy";

export const dynamic = "force-dynamic";

// llms.txt — a concise map for AI answer engines (ChatGPT, Perplexity, Claude).
export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "experientialmarketing.ai").replace(/^www\./, "").split(":")[0];
  const b = `https://${host}`;
  const lines = [
    `# ${XM.full} · ${host}`,
    ``,
    `> ${XM.tagline} ${XM.full} agency for top brands — strategy, production, and measurable reach across brand activations, mobile tours, glass box trucks, pop-ups, festivals, stadiums, and immersive XR. Reach planned at $${XM.cpmDollars} per 1,000 eyeballs.`,
    ``,
    `## Capabilities (silos)`,
    ...XM_SILOS.map((s) => `- [${s.name}](${b}/${s.slug}): ${s.blurb}`),
    ``,
    `## Key pages`,
    `- [Reach Calculator](${b}/calculator) — budget, markets, and eyeballs → custom estimate`,
    `- [White Paper](${b}/white-paper)`,
    `- [Start a Project](${b}/start)`,
    `- [Answers](${b}/answers) — common questions`,
    `- [Sitemap](${b}/sitemap.xml)`,
    ``,
    `Every capability page includes how-it-works, cost, ideas, examples, and long-tail Q&A.`,
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
