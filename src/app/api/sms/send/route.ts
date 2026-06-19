import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendSms } from "@/lib/sms";

// Single SMS (test send / one-off). God/staff only.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !["god", "marketing", "accounting"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { to, body, leadId } = await req.json().catch(() => ({}));
  if (!to || !body) return NextResponse.json({ error: "to and body required" }, { status: 400 });
  if (leadId) {
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (lead?.smsOptOut) return NextResponse.json({ ok: false, error: "Lead has opted out of SMS" }, { status: 200 });
  }
  const r = await sendSms({ to: String(to), body: String(body), leadId, batch: "single" });
  return NextResponse.json(r);
}
