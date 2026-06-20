import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { appendLeadBackground } from "@/lib/predictivedata";
import { assignLeadBackground, routeStandaloneLeadBackground } from "@/lib/logic";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const host = (await headers()).get("host") || "";
  const site = await db.site.findUnique({ where: { hostname: host } }).catch(() => null);
  const lead = await db.lead.create({
    data: {
      name: String(b.name || ""), phone: String(b.phone || ""), email: String(b.email || ""),
      dob: String(b.dob || ""), zip: String(b.zip || ""),
      vertical: String(b.vertical || "medicare"), source: String(b.source || "organic"),
      siteId: site?.id,
    },
  });
  // Intake "journey" — in production these arrive from the Groq voice agent.
  if (Array.isArray(b.answers)) {
    await db.leadAnswer.createMany({ data: b.answers.map((a: { q: string; a: string }) => ({ leadId: lead.id, question: a.q, answer: a.a })) });
  }
  appendLeadBackground(lead.id); // real-time PredictiveData enrichment
  // Standalone sites keep territory leads & affiliate the overflow; network sites use the auction.
  if (site?.mode === "standalone") routeStandaloneLeadBackground(lead.id);
  else assignLeadBackground(lead.id);
  // TODO: trigger Zapmail seq #1 + Klaviyo profile.
  return NextResponse.json({ ok: true, id: lead.id });
}
