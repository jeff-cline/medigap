import { NextRequest, NextResponse } from "next/server";
import { isSpamSubmission } from "@/lib/spam-guard";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const clip = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);
const PROFILES = "investor:profiles";
const TYPES = ["Accredited investor", "Fund", "Private equity group", "Family office"];
const GOD = "jeff.cline@me.com";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (isSpamSubmission(req, { honeypot: b._hp, texts: [b.name, b.firstName, b.lastName, b.business, b.company, b.moneyWord, b.word, b.subject, b.message, b.adjacent, b.supporting], email: b.email, phone: b.phone }).blocked) return NextResponse.json({ ok: true });
  if (clip(b.company, 80)) return NextResponse.json({ ok: true }); // honeypot

  const first = clip(b.first, 60), last = clip(b.last, 60);
  const city = clip(b.city, 80), state = clip(b.state, 40), zip = clip(b.zip, 20);
  const email = clip(b.email, 160).toLowerCase(), phone = clip(b.phone, 40);
  const investorType = TYPES.includes(clip(b.investorType, 60)) ? clip(b.investorType, 60) : "";
  const accredited = b.accredited === true;
  const password = String(b.password ?? "");

  if (!first || !last || !email || !phone || !city || !state || !zip)
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (!investorType)
    return NextResponse.json({ error: "Please select your investor category." }, { status: 400 });
  if (!accredited)
    return NextResponse.json({ error: "This offering is available to accredited investors only. You must confirm accreditation." }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: "Please choose a password of at least 8 characters." }, { status: 400 });

  // Existing account → don't overwrite the password (prevents takeover); send them to login.
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Still alert God that someone attempted to sign up (route via the working zapmail channel).
    sendEmail(GOD, `⚠️ Investor sign-up attempt — email already registered (${email})`,
      `<div style="font-family:Georgia,serif;font-size:15px;color:#111"><p><b>${first} ${last}</b> (${email}, ${phone}, ${city}, ${state}) tried to request investor access, but an account already exists for this email (role: <b>${existing.role}</b>). They were directed to log in / reset.</p></div>`, "zapmail").catch(() => {});
    return NextResponse.json({ error: "An account already exists for this email — use the Login tab, or Forgot password. (If this is your own admin email, you already have access — just log in.)" }, { status: 409 });
  }

  const name = `${first} ${last}`.trim();
  const user = await db.user.create({ data: {
    email, name, phone,
    role: "investor", status: "pending",
    passwordHash: await bcrypt.hash(password, 10), mustChangePassword: false, source: "Investor Portal",
  } });

  const row = await db.setting.findUnique({ where: { key: PROFILES } }).catch(() => null);
  const map: Record<string, Record<string, unknown>> = row?.value ? (() => { try { return JSON.parse(row.value); } catch { return {}; } })() : {};
  map[user.id] = { first, last, city, state, zip, email, phone, investorType, accredited, status: "pending", at: new Date().toISOString() };
  await db.setting.upsert({ where: { key: PROFILES }, update: { value: JSON.stringify(map) }, create: { key: PROFILES, value: JSON.stringify(map) } });

  // Step 1 notification to God — full detail.
  sendEmail(GOD, `🔔 New investor access request — ${name}`,
    `<div style="font-family:Georgia,serif;font-size:15px;color:#111">
      <h2 style="font-family:Georgia,serif">New investor access request</h2>
      <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
        ${[["Name", name], ["Investor type", investorType], ["Accredited", accredited ? "Yes — confirmed" : "No"], ["Email", email], ["Phone", phone], ["Location", `${city}, ${state} ${zip}`], ["Account", "Created — set their own password"]]
          .map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#555">${k}</td><td style="font-weight:700">${v}</td></tr>`).join("")}
      </table>
      <p style="color:#555;font-size:13px">They were auto-logged into the data room. Manage from the God console.</p>
    </div>`, "zapmail").catch(() => {});

  // Auto-login: set the session so the client can go straight to the documents.
  await createSession({ uid: user.id, email: user.email, role: "investor", mustChangePassword: false });

  // Welcome the investor.
  sendEmail(email, "Welcome to the R0cketShip Holdings data room",
    `<div style="font-family:Georgia,serif;font-size:15px;color:#111">
      <h2 style="font-family:Georgia,serif">You&rsquo;re in.</h2>
      <p>Your accredited-investor account is active. You can return any time at <b>https://quuik.com/investor</b> with your email and the password you just set. This material is strictly confidential.</p>
    </div>`, "zapmail").catch(() => {});

  return NextResponse.json({ ok: true });
}
