import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { routeCall, getSettings } from "@/lib/logic";
import { normalizePhone } from "@/lib/sms";
import { getVoiceAgent, getAIProvider, esc } from "@/lib/voice";

// Twilio Voice webhook for 1-800-MEDIGAP → https://medigap.plus/api/calls/inbound
const BASE = "https://medigap.plus";
function xml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, { headers: { "Content-Type": "text/xml" } });
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const from = String(form?.get("From") || "");
  const callSid = String(form?.get("CallSid") || "");
  const state = String(form?.get("FromState") || "");
  const zip = String(form?.get("FromZip") || "");

  const last10 = (normalizePhone(from) || from).replace(/\D/g, "").slice(-10);
  let lead = last10 ? await db.lead.findFirst({ where: { phone: { contains: last10 } } }) : null;
  if (!lead && from) lead = await db.lead.create({ data: { phone: normalizePhone(from) || from, name: "Inbound caller", source: "house", vertical: "medicare", state, zip } });

  const call = await db.call.create({ data: { leadId: lead?.id, zip, state, status: "in-progress", source: "house", providerSid: callSid, fromNumber: from } });

  const agent = await getVoiceAgent();
  const ai = await getAIProvider();
  if (agent.active && ai) {
    const action = `${BASE}/api/voice/step?callId=${call.id}&phase=intake&idx=0`;
    return xml(`<Gather input="speech" speechTimeout="auto" action="${action}" method="POST"><Say voice="${agent.voice}">${esc(agent.greeting)}</Say></Gather><Redirect method="POST">${action}</Redirect>`);
  }

  // No AI → route + forward immediately.
  const s = await getSettings();
  const r = await routeCall({ zip, state, leadId: lead?.id, providerSid: callSid, fromNumber: from, source: "house" });
  await db.call.update({ where: { id: call.id }, data: { disposition: r.disposition, realized: r.realized, forwardedTo: r.forwardedTo, priceCents: r.priceCents, bidWinnerId: r.winner?.agentId } }).catch(() => {});
  const dest = normalizePhone(r.forwardedTo) || r.forwardedTo;
  if (!dest) return xml(`<Say voice="${agent.voice}">Thank you for calling Medigap. All specialists are busy. Please call back shortly.</Say>`);
  const numberEl = s.callWhisper ? `<Number url="${BASE}/api/calls/whisper">${dest}</Number>` : `<Number>${dest}</Number>`;
  return xml(`<Dial timeout="25" callerId="${s.raw["tollFreeCallerId"] || "+18006334427"}" record="record-from-answer-dual" action="${BASE}/api/calls/status">${numberEl}</Dial>`);
}
