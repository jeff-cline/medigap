import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { routeCall, getSettings } from "@/lib/logic";
import { normalizePhone } from "@/lib/sms";
import { getVoiceAgent, getAIProvider, esc } from "@/lib/voice";
import { appendLeadBackground } from "@/lib/predictivedata";
import { matchFireCallbackBackground } from "@/lib/fire-engine";
import { getActiveEngine } from "@/lib/static/engine";
import { staticGreeting } from "@/app/api/voice/static-step/route";
import { trackingFor, directDialTwiml, sendTvThankYou } from "@/lib/static/tv";

// Twilio Voice webhook for 1-800-MEDIGAP → https://medigap.plus/api/calls/inbound
const BASE = "https://medigap.plus";
function xml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, { headers: { "Content-Type": "text/xml" } });
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const from = String(form?.get("From") || "");
  const to = String(form?.get("To") || ""); // which tracked number was dialed (TV campaign attribution)
  const callSid = String(form?.get("CallSid") || "");
  const state = String(form?.get("FromState") || "");
  const zip = String(form?.get("FromZip") || "");

  const last10 = (normalizePhone(from) || from).replace(/\D/g, "").slice(-10);
  let lead = last10 ? await db.lead.findFirst({ where: { phone: { contains: last10 } } }) : null;
  if (!lead && from) {
    lead = await db.lead.create({ data: { phone: normalizePhone(from) || from, name: "Inbound caller", source: "house", vertical: "medicare", state, zip } });
    appendLeadBackground(lead.id); // real-time enrichment by phone while the call is live
  }

  const toNumber = (normalizePhone(to) || to).replace(/\D/g, "") || "18006334427"; // TV campaign attribution
  const call = await db.call.create({ data: { leadId: lead?.id, zip, state, status: "in-progress", source: "house", providerSid: callSid, fromNumber: from, toNumber } });
  matchFireCallbackBackground(from, call.id); // Fire conversion: did an emailed contact just call back? → turn them green

  // Tracked campaign number (e.g. a TV DID)? Send the thank-you text, and if it's in DIRECT mode,
  // skip the AI and route straight to the chosen money word's buyers.
  const tn = await trackingFor(toNumber);
  if (tn?.active && tn.campaign === "tv") {
    const agent = await getVoiceAgent();
    sendTvThankYou(tn, from, lead?.id);
    if (tn.mode === "direct") return xml(await directDialTwiml(call.id, tn, { state, from, zip }, agent.voice));
    // flow mode → fall through to the normal engine below (call is already tagged via toNumber)
  }

  // Static engine (dormant unless a God has flipped the toggle) — branch to the Static intake.
  if ((await getActiveEngine()) === "static") {
    return xml(await staticGreeting(call.id));
  }

  const agent = await getVoiceAgent();
  const ai = await getAIProvider();
  if (agent.active && ai) {
    const action = esc(`${BASE}/api/voice/step?callId=${call.id}&phase=intake&idx=0`); // esc() turns & into &amp; for valid TwiML
    return xml(`<Gather input="speech" speechTimeout="auto" action="${action}" method="POST"><Say voice="${agent.voice}">${esc(agent.greeting)}</Say></Gather><Redirect method="POST">${action}</Redirect>`);
  }

  // No AI → route + forward immediately.
  const s = await getSettings();
  const r = await routeCall({ zip, state, leadId: lead?.id, providerSid: callSid, fromNumber: from, source: "house" });
  await db.call.update({ where: { id: call.id }, data: { disposition: r.disposition, realized: r.realized, forwardedTo: r.forwardedTo, priceCents: r.priceCents, bidWinnerId: r.winner?.agentId } }).catch(() => {});
  const dest = normalizePhone(r.forwardedTo) || r.forwardedTo;
  if (!dest) return xml(`<Say voice="${agent.voice}">Thank you for calling Medigap. All specialists are busy. Please call back shortly.</Say>`);
  const numberEl = s.callWhisper ? `<Number url="${BASE}/api/calls/whisper">${dest}</Number>` : `<Number>${dest}</Number>`;
  // Pass the caller's real number so the buyer accepts/pays it (never the toll-free line).
  const cid = normalizePhone(from) || from || s.raw["tollFreeCallerId"] || "+18006334427";
  return xml(`<Dial timeout="25" callerId="${cid}" record="record-from-answer-dual" action="${BASE}/api/calls/status">${numberEl}</Dial>`);
}
