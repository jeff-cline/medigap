import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyNewAccount } from "@/lib/email";
import { guardForm } from "@/lib/form-guard";
// Public partner onboarding intake (the shareable link).
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const gate = await guardForm(req, "onboard", b, { texts: [b.name, b.firstName, b.lastName, b.contactName, b.businessName, b.business, b.company, b.brand, b.website, b.moneyWord, b.word, b.subject, b.message, b.notes, b.usp, b.audience, b.services, b.competitors, b.city, b.goals], email: b.email, phone: b.phone });
  if (gate.blocked) return gate.response;
  const businessName = String(b.businessName || "").trim();
  if (!businessName) return NextResponse.json({ error: "Business name is required." }, { status: 400 });
  const s = (k: string) => String(b[k] || "").trim();
  const app = await db.partnerApplication.create({
    data: {
      businessName, contactName: s("contactName"), email: s("email"), phone: s("phone"), website: s("website"),
      hostname: s("hostname").toLowerCase(), vertical: s("vertical") || "medicare", services: s("services"),
      audience: s("audience"), geography: s("geography"), territoryZips: s("territoryZips"), unwantedLeads: s("unwantedLeads"),
      usp: s("usp"), competitors: s("competitors"), moneyWords: s("moneyWords"), brandColors: s("brandColors"),
      logoUrl: s("logoUrl"), primaryCta: b.primaryCta === "form" ? "form" : "call", notes: s("notes"),
    },
  });
  // Alert the God inbox of a new partner application.
  notifyNewAccount({ name: businessName, email: s("email"), role: "partner-application", phone: s("phone"), source: `Onboarding: ${s("website") || "—"}`, id: app.id }).catch(() => {});
  return NextResponse.json({ ok: true, id: app.id });
}
