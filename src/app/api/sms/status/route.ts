import { NextRequest } from "next/server";
import { db } from "@/lib/db";

// Twilio delivery status callback. Twilio POSTs here as a message moves queued → sent → delivered
// (or undelivered/failed), so the outbound log shows the true delivery state instead of "queued".
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const sid = String(form?.get("MessageSid") || form?.get("SmsSid") || "");
  const status = String(form?.get("MessageStatus") || form?.get("SmsStatus") || "");
  const errorCode = String(form?.get("ErrorCode") || "");
  if (sid && status) {
    const error = errorCode ? `Twilio ${errorCode}${errorCode === "30006" ? " (landline/unreachable)" : errorCode === "30032" ? " (toll-free unverified)" : errorCode === "30007" ? " (carrier filtered)" : ""}` : undefined;
    await db.smsMessage.updateMany({
      where: { twilioSid: sid },
      data: { status, ...(error ? { error } : {}) },
    }).catch(() => {});
  }
  return new Response("", { status: 204 });
}
