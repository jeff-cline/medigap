import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { appendLeadBackground } from "@/lib/predictivedata";
import { assignLeadBackground } from "@/lib/logic";

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
  assignLeadBackground(lead.id); // route the web lead to the best agent by ZIP (charges the lead price)
  // TODO: trigger Zapmail seq #1 + Klaviyo profile.
  return NextResponse.json({ ok: true, id: lead.id });
}
