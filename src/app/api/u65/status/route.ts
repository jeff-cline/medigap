import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isBillable, BILLABLE_CENTS } from "@/lib/u65";
import { scheduleFollowup } from "@/lib/followup";

const emptyTwiml = () =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
    headers: { "Content-Type": "text/xml" },
  });

// Twilio POSTs here when the U65 <Dial> completes. DialCallDuration = the transfer
// leg only (buyer answer -> hangup), which is exactly the billable clock. We record the
// outcome for EVERY call (billable or not) so no call is ever silently dropped: the U65Call's
// answer gets a clear result and the base Call row is closed out with its real status/duration.
export async function POST(req: NextRequest) {
  const u65Id = new URL(req.url).searchParams.get("u65") || "";
  const noBill = new URL(req.url).searchParams.get("bill") === "0";
  const form = await req.formData().catch(() => null);
  const dialSec = parseInt(String(form?.get("DialCallDuration") || form?.get("CallDuration") || "0"), 10);
  const dialStatus = String(form?.get("DialCallStatus") || "").toLowerCase(); // completed|no-answer|busy|failed|canceled
  if (u65Id) {
    const rec = await db.u65Call.findUnique({ where: { id: u65Id }, select: { callId: true, forwardedTo: true, answer: true, source: true, fromNumber: true, name: true, state: true } }).catch(() => null);
    const billable = !noBill && isBillable(dialSec);
    // Human-readable outcome, shown in the dashboard's Answer column so every call reads clearly.
    const outcome = billable ? "transferred ✓" : dialSec > 0 ? `${dialSec}s — short, not billable` : (dialStatus ? `no connect (${dialStatus})` : "no answer");
    const baseAnswer = (rec?.answer || "direct").split(" → ")[0];
    await db.u65Call
      .update({
        where: { id: u65Id },
        data: { transferSec: dialSec, billable, billableCents: billable ? BILLABLE_CENTS : 0, answer: `${baseAnswer} → ${outcome}` },
      })
      .catch(() => {});
    // Close out the base Call row so it doesn't sit stuck at "in-progress" with 0 duration.
    if (rec?.callId) {
      const callStatus = dialSec > 0 || dialStatus === "completed" ? "completed" : (dialStatus || "no-answer");
      await db.call
        .update({ where: { id: rec.callId }, data: { status: callStatus, durationSec: dialSec, forwardedTo: rec.forwardedTo || "", disposition: billable ? "sold" : "default" } })
        .catch(() => {});
    }
    // Missed / unbilled → schedule a follow-up text for 10:00 CST the next business day.
    if (!billable && rec?.fromNumber) {
      const lead = rec.callId ? await db.call.findUnique({ where: { id: rec.callId }, select: { leadId: true } }).catch(() => null) : null;
      await scheduleFollowup({ leadId: lead?.leadId, callId: rec.callId, toNumber: rec.fromNumber, source: rec.source || "", callerName: rec.name || "", state: rec.state || "" }).catch(() => {});
    }
  }
  return emptyTwiml();
}
