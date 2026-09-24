import { NextRequest, NextResponse } from "next/server";
import { isSpamSubmission } from "@/lib/spam-guard";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendEmail, notifyNewAccount } from "@/lib/email";

export const dynamic = "force-dynamic";

const clip = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);
// Store in the God-visible advertiser blob so Private Cloud members appear in
// the God console (Approve / Drill-in), tagged with privateCloud + their plan.
const PROFILES = "advertiser:profiles";
const TEMP = "TEMP!234";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (isSpamSubmission(req, { honeypot: b._hp, texts: [b.name, b.firstName, b.lastName, b.business, b.company, b.moneyWord, b.word, b.subject, b.message, b.adjacent, b.supporting], email: b.email, phone: b.phone }).blocked) return NextResponse.json({ ok: true });
  // honeypot — bots fill the hidden 'company' field; drop silently.
  if (clip(b.company, 80)) return NextResponse.json({ ok: true });

  const first = clip(b.first, 60), last = clip(b.last, 60);
  const email = clip(b.email, 160).toLowerCase(), phone = clip(b.phone, 40);
  const category = clip(b.category, 120);
  const goals = Array.isArray(b.goals) ? b.goals.map((g: unknown) => clip(g, 60)).filter(Boolean).slice(0, 12) : [];
  const optIn = b.optIn !== false;

  if (!first || !last || !email || !phone)
    return NextResponse.json({ error: "First name, last name, email and phone are required." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (!optIn)
    return NextResponse.json({ error: "Network participation is required to create a Private Cloud account." }, { status: 400 });

  const source = "Private Cloud";
  let user = await db.user.findUnique({ where: { email } });
  let isNew = false;
  if (!user) {
    isNew = true;
    user = await db.user.create({ data: {
      email, name: `${first} ${last}`.trim(), phone,
      role: "advertiser", status: "pending",
      passwordHash: await bcrypt.hash(TEMP, 10), mustChangePassword: true, source,
    } });
  } else {
    await db.user.update({ where: { id: user.id }, data: { name: `${first} ${last}`.trim() || user.name, phone: phone || user.phone } });
  }

  // Profile (additive JSON — no schema migration). AdvProfile-shaped so the God
  // console renders it, plus Private Cloud tags. Preserve prior status/plan so a
  // re-signup never downgrades an already-active advertiser.
  const row = await db.setting.findUnique({ where: { key: PROFILES } }).catch(() => null);
  const map: Record<string, Record<string, unknown>> = row?.value ? (() => { try { return JSON.parse(row.value); } catch { return {}; } })() : {};
  const prev = map[user.id] || {};
  map[user.id] = {
    ...prev,
    firstName: first, lastName: last, email, phone,
    business: category || prev.business || "Private Cloud member",
    status: prev.status || "pending",
    privateCloud: true, category, goals, optIn,
    plan: prev.plan ?? null,
    at: new Date().toISOString(),
  };
  await db.setting.upsert({ where: { key: PROFILES }, update: { value: JSON.stringify(map) }, create: { key: PROFILES, value: JSON.stringify(map) } });

  // Email God so you know an account was created.
  if (isNew) notifyNewAccount({ name: user.name, email: user.email, role: "Private Cloud", phone: user.phone, source, id: user.id }).catch(() => {});

  // Confirmation to the new member with their login.
  sendEmail(email, "Your Private Cloud account is ready",
    `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0e1524">
      <h2 style="color:#0e1524">Welcome to Private Cloud</h2>
      <p>Your account is ready. Log in and set your own password, then choose your plan.</p>
      <table style="border-collapse:collapse">
        <tr><td style="padding:4px 14px 4px 0;color:#5b6472">Log in</td><td style="font-weight:700">https://quuik.com/login</td></tr>
        <tr><td style="padding:4px 14px 4px 0;color:#5b6472">Username</td><td style="font-weight:700">${email}</td></tr>
        <tr><td style="padding:4px 14px 4px 0;color:#5b6472">Temporary password</td><td style="font-weight:700">${TEMP}</td></tr>
      </table>
      <p style="color:#5b6472;font-size:13px">You'll be asked to set a new password on first login.</p>
    </div>`).catch(() => {});

  return NextResponse.json({ ok: true });
}
