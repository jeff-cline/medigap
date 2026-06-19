import { NextRequest } from "next/server";
import { db } from "@/lib/db";

// Twilio status callback — updates the Call lifecycle (status + duration) as it progresses.
// Set on the number's "Call status changes" webhook and on <Dial action> (both POST here).
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const callSid = String(form?.get("CallSid") || "");
  const status = String(form?.get("CallStatus") || form?.get("DialCallStatus") || "");
  const duration = parseInt(String(form?.get("CallDuration") || form?.get("DialCallDuration") || "0"), 10);
  const recordingUrl = String(form?.get("RecordingUrl") || "");

  if (callSid) {
    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (duration > 0) data.durationSec = duration;
    if (recordingUrl) data.recordingUrl = recordingUrl;
    if (Object.keys(data).length) {
      await db.call.updateMany({ where: { providerSid: callSid }, data }).catch(() => {});
    }
  }
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, { headers: { "Content-Type": "text/xml" } });
}
