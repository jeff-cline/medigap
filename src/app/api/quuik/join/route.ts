import { NextRequest, NextResponse } from "next/server";
import { isSpamSubmission } from "@/lib/spam-guard";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendEmail, notifyNewAccount } from "@/lib/email";
import { keywordCpc, baseCpc } from "@/lib/cpc";

export const dynamic = "force-dynamic";

const clip = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);
const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const parseList = (s: unknown) => String(s ?? "").split(/[\n,]+/).map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 30);

// Advertiser profiles live in a Setting blob (no schema migration). Keyed by user id.
const PROFILES = "advertiser:profiles";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (isSpamSubmission(req, { honeypot: b._hp, texts: [b.name, b.firstName, b.lastName, b.business, b.company, b.moneyWord, b.word, b.subject, b.message, b.adjacent, b.supporting], email: b.email, phone: b.phone }).blocked) return NextResponse.json({ ok: true });
  const firstName = clip(b.firstName, 60), lastName = clip(b.lastName, 60);
  const email = clip(b.email, 160).toLowerCase(), phone = clip(b.phone, 40);
  const city = clip(b.city, 80), state = clip(b.state, 40), zip = clip(b.zip, 12);
  const business = clip(b.business, 120), website = clip(b.website, 200);
  const moneyWord = clip(b.moneyWord, 60).toLowerCase();
  const adjacent = parseList(b.adjacent), supporting = parseList(b.supporting);
  if (!firstName || !lastName || !email || !business || !moneyWord)
    return NextResponse.json({ error: "First name, last name, email, business, and your money word are required." }, { status: 400 });

  // Cost-per-click across their money word + adjacent + supporting keywords.
  const cpcRows = await keywordCpc([moneyWord, ...adjacent, ...supporting]);
  const base = baseCpc(cpcRows);

  // Create (or find) the advertiser account — pending until Jeff approves / they fund.
  const tempPassword = "TEMP!234";
  const source = `Join Network: ${moneyWord}`;
  let user = await db.user.findUnique({ where: { email } });
  let isNew = false;
  if (!user) {
    isNew = true;
    user = await db.user.create({ data: {
      email, name: `${firstName} ${lastName}`.trim(), phone,
      role: "advertiser", status: "pending",
      passwordHash: await bcrypt.hash(tempPassword, 10), mustChangePassword: true, source,
    } });
  } else {
    await db.user.update({ where: { id: user.id }, data: { name: `${firstName} ${lastName}`.trim() || user.name, phone: phone || user.phone } });
  }

  // Save the advertiser profile blob.
  const row = await db.setting.findUnique({ where: { key: PROFILES } }).catch(() => null);
  const map: Record<string, unknown> = row?.value ? (() => { try { return JSON.parse(row.value); } catch { return {}; } })() : {};
  map[user.id] = { firstName, lastName, email, phone, city, state, zip, business, website, moneyWord, adjacent, supporting, baseCpc: base, cpcRows, status: "pending", at: new Date().toISOString() };
  await db.setting.upsert({ where: { key: PROFILES }, update: { value: JSON.stringify(map) }, create: { key: PROFILES, value: JSON.stringify(map) } });

  // Reserve their money word as a pending bid (God approves before it goes live network-wide).
  try {
    const existing = await db.agentBid.findFirst({ where: { agentId: user.id, keyword: moneyWord } });
    if (!existing) await db.agentBid.create({ data: { agentId: user.id, scope: "national", scopeValue: "", keyword: moneyWord, amountCents: Math.round(base * 100), active: false } });
  } catch {}

  // Notify God (jeff.cline@me.com) with everything, including phone + email.
  if (isNew) notifyNewAccount({ name: user.name, email: user.email, role: user.role, phone: user.phone, source, id: user.id }).catch(() => {});
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0f2a33">
    <h2 style="color:#F5821F;margin:0 0 8px">🚀 New Join Network application</h2>
    <table cellpadding="5" style="border-collapse:collapse">
      <tr><td><b>Name</b></td><td>${esc(firstName)} ${esc(lastName)}</td></tr>
      <tr><td><b>Business</b></td><td>${esc(business)}</td></tr>
      <tr><td><b>Website</b></td><td>${esc(website) || "—"}</td></tr>
      <tr><td><b>Email</b></td><td>${esc(email)}</td></tr>
      <tr><td><b>Phone</b></td><td>${esc(phone) || "—"}</td></tr>
      <tr><td><b>Location</b></td><td>${esc(city)}, ${esc(state)} ${esc(zip)}</td></tr>
      <tr><td><b>Money word</b></td><td><b>${esc(moneyWord)}</b></td></tr>
      <tr><td><b>Adjacent</b></td><td>${esc(adjacent.join(", ")) || "—"}</td></tr>
      <tr><td><b>Supporting</b></td><td>${esc(supporting.join(", ")) || "—"}</td></tr>
      <tr><td><b>Base CPC</b></td><td>$${base.toFixed(2)} (${esc(cpcRows[0]?.source || "estimate")})</td></tr>
    </table>
    <p style="color:#9aa;font-size:12px">Account created (pending). Approve in the God backend.</p></div>`;
  sendEmail("jeff.cline@me.com", `🚀 Join Network: ${business} — "${moneyWord}" ($${base.toFixed(2)} CPC)`, html, "zapmail").catch(() => {});

  return NextResponse.json({ ok: true, baseCpc: base, cpc: { rows: cpcRows, base } });
}
