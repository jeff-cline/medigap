import { NextRequest, NextResponse } from "next/server";
import { isSpamSubmission } from "@/lib/spam-guard";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
const esc = (s: string) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clip = (s: unknown, n: number) => String(s ?? "").slice(0, n);

export async function POST(req: NextRequest) {
  const d = await req.json().catch(() => ({}));
  if (isSpamSubmission(req, { honeypot: d._hp, texts: [d.name, d.firstName, d.lastName, d.business, d.company], email: d.email, phone: d.phone }).blocked) return NextResponse.json({ ok: true });
  const first = clip(d.firstName, 80).trim(), last = clip(d.lastName, 80).trim();
  const email = clip(d.email, 160).trim(), phone = clip(d.phone, 40).trim();
  const topic = clip(d.topic, 120) || "siimpler enquiry";
  const message = clip(d.message, 1000);
  if (!first || !email || !phone) return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  const name = `${first} ${last}`.trim();
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0f2a33">
    <h2 style="color:#0d9488;margin:0 0 8px">📥 siimpler — ${esc(topic)}</h2>
    <table cellpadding="5" style="border-collapse:collapse">
      <tr><td><b>Name</b></td><td>${esc(name)}</td></tr>
      <tr><td><b>Email</b></td><td>${esc(email)}</td></tr>
      <tr><td><b>Phone</b></td><td>${esc(phone)}</td></tr>
      ${message ? `<tr><td valign="top"><b>Message</b></td><td>${esc(message)}</td></tr>` : ""}
    </table>
    <p style="color:#9aa;font-size:12px;margin-top:10px">via siimpler.com</p></div>`;
  sendEmail("jeff.cline@me.com", `📥 siimpler ${topic}: ${name} (${phone})`, html, "zapmail").catch(() => {});
  return NextResponse.json({ ok: true });
}
