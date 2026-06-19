import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/sms";

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

  // Match a lead by phone (best-effort across stored formats)
  const last10 = e164.replace(/\D/g, "").slice(-10);
  const lead = last10 ? await db.lead.findFirst({ where: { phone: { contains: last10 } } }) : null;

  await db.smsMessage.create({ data: { to: e164, body, direction: "inbound", status: "received", leadId: lead?.id } });

  if (["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(keyword)) {
    if (lead) await db.lead.update({ where: { id: lead.id }, data: { smsOptOut: true } });
    return twiml("You're unsubscribed and won't receive more messages. Reply START to opt back in.");
  }
  if (["START", "UNSTOP", "YES"].includes(keyword)) {
    if (lead) await db.lead.update({ where: { id: lead.id }, data: { smsOptOut: false } });
    return twiml("You're opted back in. Reply STOP to opt out.");
  }
  return twiml(); // no auto-reply for normal inbound
}
