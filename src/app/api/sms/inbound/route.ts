import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { normalizePhone, sendSms } from "@/lib/sms";
import { sendEmail } from "@/lib/email";
import { FOUNDER, JV_TAG } from "@/lib/jv";
import { parseTags } from "@/lib/recapture";

// Twilio inbound webhook (set this URL in Twilio → Messaging → your number/service).
// Handles STOP/START opt-out compliance and logs inbound texts.
function twiml(message?: string) {
  const inner = message ? `<Message>${message}</Message>` : "";
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`, { headers: { "Content-Type": "text/xml" } });
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const from = String(form?.get("From") || "");
  const body = String(form?.get("Body") || "").trim();
  const e164 = normalizePhone(from) || from;
  const keyword = body.toUpperCase();

  // Match a lead by phone (best-effort across stored formats). Prefer a JV deal so
  // replies from a founder prospect always thread into the deal room, even if a
  // duplicate consumer lead exists for the same number.
  const last10 = e164.replace(/\D/g, "").slice(-10);
  const lead = last10
    ? (await db.lead.findFirst({ where: { phone: { contains: last10 }, tags: { contains: JV_TAG } }, orderBy: { createdAt: "desc" } }))
      || (await db.lead.findFirst({ where: { phone: { contains: last10 } }, orderBy: { createdAt: "desc" } }))
    : null;

  await db.smsMessage.create({ data: { to: e164, body, direction: "inbound", status: "received", leadId: lead?.id } });

  if (["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(keyword)) {
    if (lead) await db.lead.update({ where: { id: lead.id }, data: { smsOptOut: true } });
    return twiml("You're unsubscribed and won't receive more messages. Reply START to opt back in.");
  }
  if (["START", "UNSTOP", "YES"].includes(keyword)) {
    if (lead) await db.lead.update({ where: { id: lead.id }, data: { smsOptOut: false } });
    return twiml("You're opted back in. Reply STOP to opt out.");
  }

  // JV/PE/VC contact replied → (1) optional first-time auto-reply, (2) alert the founder
  // by SMS + email with a link so he knows to log in and take over.
  const isJv = lead ? parseTags(lead.tags).includes(JV_TAG) : false;
  const founderLast10 = FOUNDER.cell.replace(/\D/g, "").slice(-10);
  if (isJv && lead) {
    const who = lead.name || e164;
    const dealUrl = `https://medigap.plus/dashboard/jv/${lead.id}`;

    // (1) First-time auto-reply — fires once, from 1-800-MEDIGAP, then disarms.
    if (lead.autoReply && !lead.autoReplySent) {
      const ar = await sendSms({ to: e164, body: lead.autoReply, leadId: lead.id, batch: "jv-autoreply" });
      if (ar.ok) {
        await db.lead.update({ where: { id: lead.id }, data: { autoReplySent: true } }).catch(() => {});
        await db.leadNote.create({ data: { leadId: lead.id, authorName: "Auto-reply", body: `🤖 Auto-replied: ${lead.autoReply}` } }).catch(() => {});
      }
    }

    // (2) Email the founder (Zapmail) with a link to manage the conversation.
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5">
      <h2 style="margin:0 0 8px">↩️ Reply from ${who}</h2>
      <p style="background:#f4f6fa;border-radius:10px;padding:12px">${body.slice(0, 800).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>
      <p><b>${who}</b> · ${e164}</p>
      <p><a href="${dealUrl}" style="background:#16d6a5;color:#03110d;text-decoration:none;font-weight:700;padding:11px 18px;border-radius:10px;display:inline-block">Open the conversation →</a></p>
      <p style="color:#8a93a6;font-size:12px">Reply to them from the system so it threads and stays on 1-800-MEDIGAP.</p>
    </div>`;
    sendEmail(FOUNDER.email, `1-800-MEDIGAP reply from ${who}`, html, "zapmail").catch(() => {});

    // (3) Also ping the founder cell (skip if the founder is the one texting in).
    if (last10 !== founderLast10) {
      sendSms({ to: FOUNDER.cell, body: `↩️ JV reply from ${who}: "${body.slice(0, 200)}" — manage: ${dealUrl}`, batch: "jv-reply-alert" }).catch(() => {});
    }
  }
  return twiml(); // no inline TwiML reply — we send via the API so it threads + logs
}
