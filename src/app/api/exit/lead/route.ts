import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EXIT } from "@/lib/exit";
import { guardForm } from "@/lib/form-guard";
export const dynamic = "force-dynamic";

// Leads sit on top of the Core: attach to the exitoptimization.com Site so they flow into the CRM.
async function exitSite() {
  return db.site.upsert({
    where: { hostname: EXIT.siteHost },
    update: {},
    create: { hostname: EXIT.siteHost, name: "Exit Optimization", kind: "marketing", mode: "standalone", vertical: "exit", brandColor: EXIT.colors.orange, primaryCta: "form", heroHeadline: EXIT.tagline },
  });
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const gate = await guardForm(req, "exit_lead", b, { texts: [b.name, b.firstName, b.lastName, b.contactName, b.businessName, b.business, b.company, b.brand, b.website, b.moneyWord, b.word, b.subject, b.message, b.notes, b.usp, b.audience, b.services, b.competitors, b.city, b.goals], email: b.email, phone: b.phone });
  if (gate.blocked) return gate.response;
  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim();
  if (!name || !email) return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  const site = await exitSite();
  await db.lead.create({
    data: {
      name, email, phone: String(b.phone || "").trim(), vertical: "exit", source: "exitoptimization", siteId: site.id,
      tags: JSON.stringify(["exit", ...(b.company ? [`company:${String(b.company).slice(0, 60)}`] : []), ...(b.revenue ? [`revenue:${String(b.revenue).slice(0, 40)}`] : [])]),
    },
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}
