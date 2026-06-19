import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { routeCall, getSettings } from "@/lib/logic";
import { normalizePhone } from "@/lib/sms";

// Twilio Voice webhook for 1-800-MEDIGAP.
// Set in Twilio → Phone Numbers → your toll-free → Voice "A call comes in" (HTTP POST):
//   https://medigap.plus/api/calls/inbound
// Every inbound call is created, routed through the agent auction, and bridged to the
// winning agent — or, if no agent buys it, to the house default number (booked unrealized).
function xml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, { headers: { "Content-Type": "text/xml" } });
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const from = String(form?.get("From") || "");
  const callSid = String(form?.get("CallSid") || "");
  const state = String(form?.get("FromState") || "");
  const zip = String(form?.get("FromZip") || "");
  const s = await getSettings();

  // Tie the call to a lead (create a house lead if this number is new).
  const last10 = (normalizePhone(from) || from).replace(/\D/g, "").slice(-10);
  let lead = last10 ? await db.lead.findFirst({ where: { phone: { contains: last10 } } }) : null;
  if (!lead && from) {
    lead = await db.lead.create({ data: { phone: normalizePhone(from) || from, name: "Inbound caller", source: "house", vertical: "medicare", state, zip } });
  }

  const r = await routeCall({ zip, state, leadId: lead?.id, providerSid: callSid, fromNumber: from, source: "house" });
  const dest = normalizePhone(r.forwardedTo) || r.forwardedTo;
  if (!dest) return xml(`<Say voice="alice">Thank you for calling Medigap. All specialists are busy. Please call back shortly.</Say>`);

  // Whisper announces the source to the agent before bridging (toggle in Settings).
  const numberEl = s.callWhisper
    ? `<Number url="/api/calls/whisper">${dest}</Number>`
    : `<Number>${dest}</Number>`;
  return xml(`<Dial timeout="25" callerId="${s.raw["tollFreeCallerId"] || "+18006334427"}" record="record-from-answer-dual">${numberEl}</Dial>`);
}
