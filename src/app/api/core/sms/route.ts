import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";
import { verifyCoreKey } from "@/lib/corekeys";

export const dynamic = "force-dynamic";

// Send SMS via the Core's Twilio. Auth: x-core-key + x-core-secret, scope sms:send.
export async function POST(req: NextRequest) {
  const key = await verifyCoreKey(req, "sms:send");
  if (!key) return NextResponse.json({ ok: false, error: "Invalid CORE API credentials or missing sms:send scope." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const to = String(b.to || "").trim();
  const body = String(b.body || "").trim();
  if (!to || !body) return NextResponse.json({ ok: false, error: "to and body are required." }, { status: 400 });
  const r = await sendSms({ to, body });
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
