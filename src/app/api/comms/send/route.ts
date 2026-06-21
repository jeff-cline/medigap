import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendSms } from "@/lib/sms";
import { sendEmail } from "@/lib/email";
import { audienceLeads, merge, trackedLink, AudienceFilter } from "@/lib/comms";
import { promoteStage } from "@/lib/recapture";

const MAX = 500;
const SMS_COST_CENTS = 1;

function emailHtml(bodyText: string, toEmail: string, ctaUrl: string) {
  const safe = bodyText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>");
  return `<!doctype html><html><body style="margin:0;background:#f4f6fa;padding:24px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6e8ee">
    <div style="background:linear-gradient(120deg,#16d6a5,#1e8bff);padding:16px 22px;color:#03110d;font-weight:800;font-size:17px">medigap.plus</div>
    <div style="padding:22px;color:#1b2330;font-size:15px;line-height:1.55">${safe}
      <p style="margin-top:22px"><a href="${ctaUrl}" style="background:linear-gradient(120deg,#16d6a5,#1e8bff);color:#03110d;text-decoration:none;font-weight:700;padding:11px 18px;border-radius:10px;display:inline-block">See if you qualify — free</a></p>
    </div>
    <div style="padding:14px 22px;border-top:1px solid #eef0f5;color:#8a93a6;font-size:11px">
      medigap.plus · You're receiving this because you contacted us about senior insurance.
      <a href="https://medigap.plus/unsubscribe?e=${encodeURIComponent(toEmail)}" style="color:#8a93a6">Unsubscribe</a>.
    </div>
  </div></body></html>`;
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !["god", "marketing", "accounting"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const channel = ["sms", "email", "both"].includes(String(b.channel)) ? String(b.channel) : "sms";
  const body = String(b.body || "");
  const subject = String(b.subject || "A quick note from Medigap.plus");
  const wantSms = channel === "sms" || channel === "both";
  const wantEmail = channel === "email" || channel === "both";
  if (!body) return NextResponse.json({ error: "Message body is required." }, { status: 400 });

  // Test send to a single address/number.
  if (b.testTo || b.testEmail) {
    const fake = { name: "Test", phone: String(b.testTo || ""), email: String(b.testEmail || ""), refNum: null, zip: "" };
    if (b.testTo && wantSms) await sendSms({ to: String(b.testTo), body: merge(body, fake), batch: "comms-test" });
    if (b.testEmail && wantEmail) await sendEmail(String(b.testEmail), subject, emailHtml(merge(body, fake), String(b.testEmail), "https://medigap.plus/medicare"), "zapmail");
    return NextResponse.json({ ok: true, test: true });
  }

  const filter = (b.filter || { type: "all" }) as AudienceFilter;
  const limit = Math.min(MAX, Number(b.limit) > 0 ? Number(b.limit) : MAX);
  const leads = (await audienceLeads(filter, MAX)).slice(0, limit);
  const label = `${String(b.name || "blast")} ${new Date().toISOString().slice(0, 16)}`;

  let sms = 0, emails = 0, failed = 0;
  for (const lead of leads) {
    let reached = false;
    if (wantSms && lead.phone && !lead.smsOptOut) {
      const r = await sendSms({ to: lead.phone, body: merge(body, lead), leadId: lead.id, batch: label });
      if (r.ok) { sms++; reached = true; } else failed++;
    }
    if (wantEmail && lead.email && !lead.emailOptOut) {
      const r = await sendEmail(lead.email, subject, emailHtml(merge(body, lead), lead.email, trackedLink(lead.id)), "zapmail"); // cold/non-opted → Zapmail
      await db.emailMessage.create({ data: { to: lead.email, subject, body: merge(body, lead), status: r.ok ? "sent" : "failed", error: r.error || "", batch: label, leadId: lead.id } }).catch(() => {});
      if (r.ok) { emails++; reached = true; } else failed++;
    }
    // Cold outreach landed → advance the recapture funnel to "engaged".
    if (reached) await promoteStage(lead.id, "engaged");
  }
  if (sms > 0) await db.ledgerEntry.create({ data: { type: "spend", category: "sms", channel: "twilio", amountCents: sms * SMS_COST_CENTS, note: `Comms SMS: ${label}` } }).catch(() => {});
  await db.commCampaign.create({ data: { name: String(b.name || "blast"), channel, audience: JSON.stringify(filter), subject, body, sent: sms + emails, failed } }).catch(() => {});

  return NextResponse.json({ ok: true, audience: leads.length, sms, emails, failed, label });
}
