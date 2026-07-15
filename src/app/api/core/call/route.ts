import { NextRequest, NextResponse } from "next/server";
import { verifyCoreKey } from "@/lib/corekeys";
import { getTwilioCfg, normalizePhone } from "@/lib/sms";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// CORE API — place an outbound call via the Core's Twilio. Auth: x-core-key + x-core-secret,
// scope call:create. Body: { to, message } (Twilio calls `to` and speaks `message` via TTS),
// or { to, twimlUrl } to run your own TwiML. Returns { ok, callSid, status }.
export async function POST(req: NextRequest) {
  const key = await verifyCoreKey(req, "call:create");
  if (!key) return NextResponse.json({ ok: false, error: "Invalid CORE API credentials or missing call:create scope." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const to = normalizePhone(String(b.to || "")) || String(b.to || "").trim();
  const message = String(b.message || "").trim();
  const twimlUrl = String(b.twimlUrl || "").trim();
  if (!to) return NextResponse.json({ ok: false, error: "to is required." }, { status: 400 });
  if (!message && !twimlUrl) return NextResponse.json({ ok: false, error: "Provide a message (spoken) or a twimlUrl." }, { status: 400 });

  const cfg = await getTwilioCfg();
  if (!cfg.accountSid || !cfg.authToken || !cfg.tollFree) {
    return NextResponse.json({ ok: false, error: "Twilio not connected on the Core." }, { status: 502 });
  }

  const params = new URLSearchParams({ To: to, From: cfg.tollFree });
  if (twimlUrl) params.set("Url", twimlUrl);
  else params.set("Twiml", `<Response><Say voice="alice">${esc(message)}</Say></Response>`);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}/Calls.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  }).catch(() => null);
  const data = res ? await res.json().catch(() => ({})) : {};
  if (!res || !res.ok) return NextResponse.json({ ok: false, error: data?.message || "Twilio call failed" }, { status: 502 });
  return NextResponse.json({ ok: true, callSid: data.sid, status: data.status });
}
