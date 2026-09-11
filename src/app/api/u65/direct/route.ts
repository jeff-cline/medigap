import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { loadU65Config } from "@/lib/u65-store";
import { isWithinHours } from "@/lib/u65";
import { normalizePhone, sendSms } from "@/lib/sms";
import { sendEmail } from "@/lib/email";
import { matchFireCallbackBackground } from "@/lib/fire-engine";
import { appendLeadBackground } from "@/lib/predictivedata";

const BASE = "https://medigap.plus";
const FOUNDER_EMAIL = "jeff.cline@me.com";
const FOUNDER_CELL = "+19728006670";
// The VoiceDrip caller-ID prospects call back (source of "direct callback" alerts).
const VOICEDRIP_NUMBER = "+14698139349";

// A/B/C tracking lines. Each QR/marketing number dials one of these; we tag the call's
// `source` with the exact dial-in number so the report shows which line drove the call.
// source = "direct_<last10>". Legacy 346 rows use "direct_220"; the dashboard maps both.
function sourceForDialedNumber(to: string): string {
  const last10 = (normalizePhone(to) || to || "").replace(/\D/g, "").slice(-10);
  return last10.length === 10 ? `direct_${last10}` : "direct_220";
}

const xml = (body: string) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml" },
  });

// Fire-and-forget founder alert the instant a direct callback comes in. Never blocks the
// TwiML response (the pm2 server stays alive, so the un-awaited promise still completes).
async function notifyDirectCallback(from: string, state: string, dest: string, calledNumber: string, afterHours: boolean) {
  const isVoiceDrip = normalizePhone(calledNumber) === VOICEDRIP_NUMBER;
  const line = isVoiceDrip ? "VoiceDrip callback line (469-813-9349)" : `direct line (${calledNumber || "unknown"})`;
  const who = `${from || "unknown"}${state ? ` (${state})` : ""}`;
  const subject = `📞 U65 direct callback — ${who}`;
  const html =
    `<p><b>${who}</b> just called your <b>${line}</b> directly.</p>` +
    `<p>Auto-forwarding to your SET/buyer line <b>${dest}</b>${afterHours ? " (after-hours backup)" : ""}.</p>` +
    `<p>It's logged as a <b>direct call</b> and books a <b>$75 credit</b> once the buyer stays connected 2+ minutes.</p>`;
  const text = `${who} called your ${line} directly. Forwarding to SET line ${dest}. Counts as a $75 direct call if it connects 2+ min.`;
  await Promise.allSettled([
    sendEmail(FOUNDER_EMAIL, subject, html, "google_workspace", { text }),
    sendSms({ to: FOUNDER_CELL, body: `U65 DIRECT CALLBACK: ${text}` }),
  ]);
}

// No-AI direct line (346) 220-3471 + VoiceDrip callback line (469) 813-9349 -> straight to
// the SET number, tracked + billable, and the founder is pinged in real time.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const from = String(form?.get("From") || "");
  const to = String(form?.get("To") || "");
  const state = String(form?.get("FromState") || "");
  const zip = String(form?.get("FromZip") || "");
  const callSid = String(form?.get("CallSid") || "");
  const cfg = await loadU65Config();

  const open = isWithinHours(cfg, Date.now());
  const afterHours = !open;
  // The direct line has no AI, so "regular flow" can't apply; after hours -> backup if set, else SET.
  const dest = afterHours ? cfg.backupNumber || cfg.setNumber : cfg.setNumber;

  const billable = dest === cfg.setNumber;

  // Take the caller's number and append full lead data (name, address, age, demographics) in real
  // time — same enrichment the AI line uses — so EVERY direct call is enriched, not just logged.
  // Find-or-create the Lead, enrich it, and hang a Call off it so the report links to caller info
  // + appended data (the U65Call.callId → /dashboard/calls/[id] detail view).
  const last10 = (normalizePhone(from) || from).replace(/\D/g, "").slice(-10);
  let lead = last10 ? await db.lead.findFirst({ where: { phone: { contains: last10 } } }).catch(() => null) : null;
  if (!lead && from) {
    lead = await db.lead.create({ data: { phone: normalizePhone(from) || from, name: "Direct-line caller", source: "direct", vertical: "medicare", state, zip } }).catch(() => null);
    if (lead) appendLeadBackground(lead.id); // real-time phone enrichment while the call is live
  }
  const toDigits = (normalizePhone(to) || to || "").replace(/\D/g, "") || "18006334427"; // the actual line dialed (VoiceDrip / A-B-C tracking), for correct attribution
  const call = await db.call.create({ data: { leadId: lead?.id, zip, state, status: "in-progress", source: "direct", providerSid: callSid, fromNumber: from, toNumber: toDigits } }).catch(() => null);

  const rec = await db.u65Call.create({
    data: {
      source: sourceForDialedNumber(to), fromNumber: from, state, u65: true, callId: call?.id,
      name: lead && lead.name && lead.name !== "Direct-line caller" ? lead.name : "",
      answer: afterHours ? "direct · after-hours" : "direct", afterHours, forwardedTo: dest,
    },
  }).catch(() => null);
  matchFireCallbackBackground(from, call?.id || ""); // Fire conversion: an emailed contact calling the direct line counts too
  notifyDirectCallback(from, state, dest, to, afterHours).catch(() => {}); // real-time founder alert

  const num = normalizePhone(dest) || dest;
  const action = rec ? `${BASE}/api/u65/status?u65=${rec.id}${billable ? "" : "&bill=0"}` : "";
  // XML-escape the & in the query string — raw & breaks Twilio's TwiML parser (error 12100).
  const actionAttr = action ? ` action="${action.replace(/&/g, "&amp;")}"` : "";
  // Pass the caller's own number as caller ID so the buyer sees the real customer, not the direct line.
  const cid = normalizePhone(from) || from;
  const cidAttr = cid ? ` callerId="${cid}"` : "";
  return xml(`<Dial timeout="30"${cidAttr} record="record-from-answer-dual"${actionAttr}><Number>${num}</Number></Dial>`);
}
