import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { XM, eyeballsCost, reachForBudget } from "@/lib/xm";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Every experientialmarketing.ai lead alerts the founder + the Savage XM team (Zapmail).
const XM_NOTIFY = "jeff.cline@me.com, s@savagexm.com, h@savagexm.com";

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

  // Notify the founder + Savage XM of every new lead with all captured info (Zapmail).
  const fmt$ = (n: number) => "$" + n.toLocaleString();
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">
    <h2 style="margin:0 0 8px">🎪 New experientialmarketing.ai lead</h2>
    <p><b>${name}</b></p>
    <p>Email: <a href="mailto:${email}">${email}</a><br>
    Phone: ${phone || "—"}<br>
    Website: ${website ? `<a href="${website.startsWith("http") ? website : "https://" + website}">${website}</a>` : "—"}</p>
    <p>Form: <b>${kind}</b>${budget ? `<br>Budget: <b>${fmt$(budget)}</b>` : ""}${markets > 1 ? `<br>Markets: <b>${markets}</b>` : ""}${eyeballs ? `<br>Target eyeballs: <b>${eyeballs.toLocaleString()}</b>` : ""}</p>
    <p style="margin-top:14px">Manage this lead: <a href="https://experientialmarketing.ai/partner">open the XM board →</a></p>
  </div>`;
  const subject = `New experientialmarketing.ai lead — ${name}`;
  const text = `New XM lead: ${name} | ${email} | ${phone || "no phone"} | ${website || "no site"} | form:${kind}${budget ? ` | budget:${budget}` : ""}`;
  const notifyP = sendEmail(XM_NOTIFY, subject, html, "zapmail", { text });
  const notify = b._test ? await notifyP : (notifyP.catch(() => {}), null);

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
      ...(notify ? { notify } : {}),
    });
  }
  return NextResponse.json({ ok: true, ...(notify ? { notify } : {}) });
}
