import { NextRequest, NextResponse } from "next/server";
import { isSpamSubmission } from "@/lib/spam-guard";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function stripeKey(): Promise<string | null> {
  const row = await db.integration.findUnique({ where: { key: "stripe" } }).catch(() => null);
  if (!row) return null;
  try { const c = JSON.parse(row.config) as { secretKey?: string }; return c.secretKey || null; } catch { return null; }
}

// "Become Founding Member" — $3,000/mo. If Stripe is connected, open a Checkout subscription;
// otherwise capture intent and email Jeff so he can finalize (keys land later).
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (isSpamSubmission(req, { honeypot: b._hp || b.website2, texts: [b.name, b.firstName, b.lastName, b.business, b.company, b.moneyWord, b.word, b.subject, b.message], email: b.email, phone: b.phone }).blocked) return NextResponse.json({ ok: true });
  const email = String(b.email || "").trim().toLowerCase();
  const business = String(b.business || "").trim().slice(0, 120);
  const origin = req.nextUrl.origin;
  const sk = await stripeKey();

  if (sk) {
    try {
      const form = new URLSearchParams();
      form.set("mode", "subscription");
      form.set("line_items[0][quantity]", "1");
      form.set("line_items[0][price_data][currency]", "usd");
      form.set("line_items[0][price_data][unit_amount]", "300000");
      form.set("line_items[0][price_data][recurring][interval]", "month");
      form.set("line_items[0][price_data][product_data][name]", "el.ag Founding Member — lifetime flat rate");
      const cp = (await db.setting.findUnique({ where: { key: "founding:couponId" } }).catch(() => null))?.value?.trim();
      if (cp) form.set("discounts[0][coupon]", cp); else form.set("allow_promotion_codes", "true");
      if (email) form.set("customer_email", email);
      form.set("success_url", `${origin}/join?founding=success`);
      form.set("cancel_url", `${origin}/join?founding=cancel`);
      form.set("metadata[type]", "founding_member");
      form.set("metadata[business]", business);
      const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      const j = await res.json();
      if (j?.url) return NextResponse.json({ ok: true, checkoutUrl: j.url });
      return NextResponse.json({ error: j?.error?.message || "Could not start checkout." }, { status: 502 });
    } catch { return NextResponse.json({ error: "Could not reach Stripe — try again." }, { status: 502 }); }
  }

  // No keys yet — capture the intent and email Jeff.
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px">
    <h2 style="color:#F5821F">🚀 Wants FOUNDING MEMBER ($3,000/mo)</h2>
    <p><b>Business:</b> ${esc(business) || "—"}<br><b>Email:</b> ${esc(email) || "—"}</p>
    <p style="color:#9aa;font-size:12px">Stripe not yet connected — add keys in Integrations, then follow up.</p></div>`;
  sendEmail("jeff.cline@me.com", `🚀 FOUNDING MEMBER intent: ${business || email}`, html, "zapmail").catch(() => {});
  return NextResponse.json({ ok: true, pending: true, message: "You're on the founding-member list — we'll reach out to finalize your spot." });
}
