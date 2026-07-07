import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { verifyCoreKey } from "@/lib/corekeys";

export const dynamic = "force-dynamic";

// Send email THROUGH the Core (so other projects use Zapmail/Workspace without their own config).
// Auth: x-core-key + x-core-secret, scope email:send.
export async function POST(req: NextRequest) {
  const key = await verifyCoreKey(req, "email:send");
  if (!key) return NextResponse.json({ ok: false, error: "Invalid CORE API credentials or missing email:send scope." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const to = String(b.to || "").trim();
  const subject = String(b.subject || "").trim();
  const html = String(b.html || b.text || "").trim();
  if (!to || !subject || !html) return NextResponse.json({ ok: false, error: "to, subject, and html (or text) are required." }, { status: 400 });
  const provider = ["zapmail", "google_workspace", "smtp"].includes(b.provider) ? b.provider : "zapmail";
  const r = await sendEmail(to, subject, html, provider, { text: b.text ? String(b.text) : undefined });
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
