import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { XM, eyeballsCost, reachForBudget } from "@/lib/xm";

export const dynamic = "force-dynamic";

// Ensure the experientialmarketing.ai partner Site exists (leads attach here; owner sees them,
// all data stays in the Core). Owner is wired by the setup script.
async function xmSite() {
  return db.site.upsert({
    where: { hostname: XM.siteHost },
    update: {},
    create: { hostname: XM.siteHost, name: "Experiential Marketing (XM)", kind: "marketing", mode: "standalone", vertical: "experiential", brandColor: XM.colors.red, primaryCta: "form", heroHeadline: XM.tagline },
  });
}

const ACTIVITIES = [
  "Glass box truck mobile tour (multi-market)",
  "Pop-up brand activations & installations",
  "Field sampling + trained brand ambassadors",
  "Festival & stadium footprints",
  "Immersive AR/VR (XR) experience",
  "Creator & influencer amplification",
  "Experiential technology — LED, projection, data capture",
  "Guerrilla / street-team stunts",
  "Retail & in-store activation",
  "Measurement, attribution & post-tour reporting",
];

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim();
  const phone = String(b.phone || "").trim();
  const website = String(b.website || "").trim();
  const kind = String(b.kind || "start"); // start | white-paper | calculator
  if (!name || !email) return NextResponse.json({ error: "Name and email are required." }, { status: 400 });

  const budget = Math.max(0, Number(b.budget) || 0);
  const markets = Math.max(1, Number(b.markets) || 1);
  const eyeballs = Math.max(0, Number(b.eyeballs) || 0);

  const site = await xmSite();
  await db.lead.create({
    data: {
      name, email, phone, city: "", state: "", vertical: "experiential", source: "xm", siteId: site.id,
      tags: JSON.stringify(["xm", kind, ...(website ? [`web:${website}`] : []), ...(budget ? [`budget:${budget}`] : []), ...(eyeballs ? [`eyeballs:${eyeballs}`] : []), ...(markets ? [`markets:${markets}`] : [])]),
    },
  }).catch(() => {});

  // Calculator proposal at $33 / 1,000 eyeballs
  if (kind === "calculator") {
    const targetEyeballs = eyeballs || (budget ? reachForBudget(budget) : 0);
    const cost = eyeballsCost(targetEyeballs);
    const affordableReach = budget ? reachForBudget(budget) : targetEyeballs;
    const count = Math.min(ACTIVITIES.length, Math.max(3, Math.round(budget / 75000) || 5));
    const recommended = ACTIVITIES.slice(0, count);
    return NextResponse.json({
      ok: true,
      proposal: {
        name, markets, budget,
        targetEyeballs, cost, cpm: XM.cpmDollars,
        affordableReach,
        perMarketEyeballs: Math.round((targetEyeballs || affordableReach) / markets),
        recommended,
        disclaimer: "Limited to budget items. May vary. To reach KPIs, we may activate other known industry best practices to meet KPIs, including technology and AI.",
      },
    });
  }
  return NextResponse.json({ ok: true });
}
