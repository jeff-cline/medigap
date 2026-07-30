import { NextRequest } from "next/server";

// TwiML executed once Twilio's Answering Machine Detection resolves (MachineDetection=DetectMessageEnd).
// GOAL: only ever leave a voicemail; never talk to a live person.
//  - machine (voicemail greeting ended) -> play the pre-recorded drop, then hang up.
//  - human / fax / unknown              -> hang up silently (no conversation).
const BASE = "https://medigap.plus";
const xml = (body: string) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml" },
  });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const answeredBy = String(form?.get("AnsweredBy") || "");
  if (answeredBy.startsWith("machine")) {
    return xml(`<Play>${BASE}/api/voicedrip/audio</Play><Hangup/>`);
  }
  return xml(`<Hangup/>`);
}
