import { NextRequest, NextResponse } from "next/server";
import { registerMammo, createMammoSession } from "@/lib/mammo-auth";
import { guardForm } from "@/lib/form-guard";
import { SMS_CONSENT_TEXT } from "@/lib/mammo";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const s = (v: unknown) => (typeof v === "string" ? v : "");

  const gate = await guardForm(req, "mammo_register", b, {
    names: [s(b.firstName), s(b.lastName)],
    email: s(b.email), phone: s(b.phone),
  });
  if (gate.blocked) return gate.response;

  const email = s(b.email).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (s(b.password).length < 9) {
    return NextResponse.json({ error: "Use at least 9 characters for your password." }, { status: 400 });
  }

  const r = await registerMammo({
    email, password: s(b.password),
    firstName: s(b.firstName).trim(), lastName: s(b.lastName).trim(),
    phone: s(b.phone).trim(), zip: s(b.zip),
    smsOptIn: b.smsOptIn === true,
    smsOptInText: SMS_CONSENT_TEXT,
    emailOptIn: b.emailOptIn === true,
    outOfArea: b.outOfArea === true,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
  });
  if ("error" in r) return NextResponse.json({ error: r.error, existing: true }, { status: 409 });

  // Advance the step-one lead rather than creating a second record.
  await db.mammoLead.upsert({
    where: { email },
    update: { stage: "account", accountId: r.account.id },
    create: {
      email, firstName: r.account.firstName, lastName: r.account.lastName,
      phone: r.account.phone, zip: r.account.zip, stage: "account",
      accountId: r.account.id, outOfArea: b.outOfArea === true,
    },
  }).catch(() => {});

  await createMammoSession({ id: r.account.id, email: r.account.email, firstName: r.account.firstName });
  return NextResponse.json({ ok: true });
}
