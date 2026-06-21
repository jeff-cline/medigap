import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { appendLeadBackground } from "@/lib/predictivedata";
import { assignLeadBackground, routeStandaloneLeadBackground } from "@/lib/logic";
import { normalizePhone } from "@/lib/sms";
import { promoteStage } from "@/lib/recapture";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const host = (await headers()).get("host") || "";
  const site = await db.site.findUnique({ where: { hostname: host } }).catch(() => null);

  const phone = String(b.phone || "");
  const email = String(b.email || "").trim().toLowerCase();
  const last10 = (normalizePhone(phone) || phone).replace(/\D/g, "").slice(-10);

  // If this submission matches an existing contact (e.g. a recapture lead from the
  // missed-call list, or a tracked-link click carrying ?lead), OPT IT IN rather than
  // duplicating — the old data converts into a real lead with everything we have.
  const existing =
    (b.leadId && (await db.lead.findUnique({ where: { id: String(b.leadId) } }).catch(() => null))) ||
    (last10 ? await db.lead.findFirst({ where: { phone: { contains: last10 } } }) : null) ||
    (email ? await db.lead.findFirst({ where: { email } }) : null) ||
    null;

  let lead;
  if (existing) {
    const fill: Record<string, unknown> = { status: "contacted" };
    const setIf = (k: string, v: string, cur: string) => { if (v && (!cur || cur === "Inbound caller" || cur === "Unknown caller")) fill[k] = v; };
    setIf("name", String(b.name || ""), existing.name);
    setIf("email", email, existing.email);
    setIf("phone", normalizePhone(phone) || phone, existing.phone);
    setIf("dob", String(b.dob || ""), existing.dob);
    setIf("zip", String(b.zip || ""), existing.zip);
    if (site?.id && !existing.siteId) fill.siteId = site.id;
    lead = await db.lead.update({ where: { id: existing.id }, data: fill });
    await promoteStage(lead.id, "opted_in");
  } else {
    lead = await db.lead.create({
      data: {
        name: String(b.name || ""), phone, email,
        dob: String(b.dob || ""), zip: String(b.zip || ""),
        vertical: String(b.vertical || "medicare"), source: String(b.source || "organic"),
        siteId: site?.id,
      },
    });
  }
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
