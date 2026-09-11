import { NextRequest } from "next/server";
import { db } from "@/lib/db";

// Twilio call status callback for VoiceDrip. Records the REAL per-call cost for accounting.
// Twilio fires this multiple times (initiated/ringing/answered/completed); Price usually
// only lands on/after "completed" and can be null momentarily, so we capture it whenever present
// and mark priceFinal once we have it. AnsweredBy only appears on the AMD-resolved callback.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const callSid = String(form?.get("CallSid") || "");
  if (!callSid) return new Response("", { status: 200 });

  const status = String(form?.get("CallStatus") || "");
  const answeredBy = String(form?.get("AnsweredBy") || "");
  const durationSec = parseInt(String(form?.get("CallDuration") || form?.get("Duration") || "0"), 10) || 0;
  const priceStr = String(form?.get("Price") || "");
  const price = priceStr ? Math.abs(parseFloat(priceStr)) : NaN;
  const priceCents = Number.isFinite(price) ? Math.round(price * 100) : 0;
  const to = String(form?.get("To") || "");
  const from = String(form?.get("From") || "");
  const direction = String(form?.get("Direction") || "");

  await db.voiceDrop.upsert({
    where: { callSid },
    update: {
      status: status || undefined,
      answeredBy: answeredBy || undefined,       // keep the AMD result once we've seen it
      durationSec,
      ...(priceCents > 0 ? { priceCents, priceFinal: true } : {}),
    },
    create: {
      callSid, toNumber: to, fromNumber: from, status, answeredBy, durationSec,
      priceCents, priceFinal: priceCents > 0,
      direction: direction.toLowerCase().includes("inbound") ? "inbound" : "outbound",
    },
  }).catch(() => {});

  return new Response("", { status: 200 });
}
