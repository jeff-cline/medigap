import { NextRequest, NextResponse } from "next/server";
import { isSpamSubmission } from "@/lib/spam-guard";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// "Fund Account Now / Get Started" — prepay, $500 minimum, no refunds. Highest bid wins the
// premium spots. This captures the "they really want to do it" signal and emails Jeff.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (isSpamSubmission(req, { honeypot: b._hp, texts: [b.name, b.firstName, b.lastName, b.business, b.company, b.moneyWord, b.word, b.subject, b.message, b.adjacent, b.supporting], email: b.email, phone: b.phone }).blocked) return NextResponse.json({ ok: true });
  const email = String(b.email || "").trim().toLowerCase();
  const business = String(b.business || "").trim().slice(0, 120);
  const moneyWord = String(b.moneyWord || "").trim().toLowerCase().slice(0, 60);
  const cpc = Number(b.baseCpc) || 0;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px">
    <h2 style="color:#F5821F">💳 Wants to FUND ACCOUNT &amp; bid</h2>
    <p><b>Business:</b> ${esc(business) || "—"}<br><b>Email:</b> ${esc(email) || "—"}<br>
    <b>Money word:</b> ${esc(moneyWord) || "—"}<br><b>Base CPC:</b> $${cpc.toFixed(2)}</p>
    <p>Prepay, $500 minimum, no refunds. Highest bid wins the premium spots.</p></div>`;
  sendEmail("jeff.cline@me.com", `💳 Fund-account intent: ${business || email} — "${moneyWord}"`, html, "zapmail").catch(() => {});
  return NextResponse.json({ ok: true, min: 500 });
}
