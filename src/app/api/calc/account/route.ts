import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { EXIT } from "@/lib/exit";
import { guardForm } from "@/lib/form-guard";
export const dynamic = "force-dynamic";

// Create a calculator customer account (role "owner"), capture the lead, and log them in.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const gate = await guardForm(req, "calc_account", b, { texts: [b.name, b.firstName, b.lastName, b.contactName, b.businessName, b.business, b.company, b.brand, b.website, b.moneyWord, b.word, b.subject, b.message, b.notes, b.usp, b.audience, b.services, b.competitors, b.city, b.goals], email: b.email, phone: b.phone });
  if (gate.blocked) return gate.response;
  const email = String(b.email || "").trim().toLowerCase();
  const name = String(b.name || "").trim();
  const password = String(b.password || "");
  const phone = String(b.phone || "").trim();
  const company = String(b.company || "").trim();
  if (!email || !name || password.length < 6) return NextResponse.json({ error: "Name, email, and a 6+ character password are required." }, { status: 400 });

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "An account with that email already exists — please log in." }, { status: 400 });

  const user = await db.user.create({
    data: { email, name, phone, role: "owner", passwordHash: await hashPassword(password), mustChangePassword: false, status: "active", source: `exitoptimization calculators${company ? " · " + company : ""}` },
  });
  const site = await db.site.findUnique({ where: { hostname: EXIT.siteHost } }).catch(() => null);
  await db.lead.create({
    data: { name, email, phone, vertical: "exit", source: "exitoptimization", siteId: site?.id, tags: JSON.stringify(["exit", "calculator-account", ...(company ? [`company:${company}`] : [])]) },
  }).catch(() => {});
  await createSession({ uid: user.id, email: user.email, role: "owner", mustChangePassword: false });
  return NextResponse.json({ ok: true });
}
