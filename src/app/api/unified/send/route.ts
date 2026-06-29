import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canUnified } from "@/lib/unified";
import { sendSms } from "@/lib/sms";
import { sendFounderEmail, engineReady } from "@/lib/founder";
import { FOUNDER_ENGINES } from "@/lib/jv-constants";

// Send a text or email FROM the unified iPhone inbox. God (founder) only → tagged 🚀 (sentVia=iphone).
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !canUnified(s)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const leadId = String(b.leadId || "");
  const channel = String(b.channel || "sms");
  const text = String(b.text || "").trim();
  if (!leadId || !text) return NextResponse.json({ error: "Nothing to send." }, { status: 400 });
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Contact not found." }, { status: 404 });

  if (channel === "sms") {
    if (!lead.phone) return NextResponse.json({ error: "This contact has no phone number." }, { status: 400 });
    const r = await sendSms({ to: lead.phone, body: text, leadId });
    const last = await db.smsMessage.findFirst({ where: { leadId, direction: "outbound" }, orderBy: { createdAt: "desc" } });
    if (last) await db.smsMessage.update({ where: { id: last.id }, data: { sentVia: "iphone", sentBy: s.email } }).catch(() => {});
    return NextResponse.json({ ok: r.ok, id: last?.id, error: r.error });
  }

  // email — pick the first connected one-to-one founder engine
  let engine = "";
  for (const e of FOUNDER_ENGINES) { if (e.oneToOne && (await engineReady(e.key))) { engine = e.key; break; } }
  if (!engine) return NextResponse.json({ error: "No email engine connected — add one on Integrations." }, { status: 200 });
  const subject = String(b.subject || "").trim() || "A note from Jeff";
  const html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>");
  const r = await sendFounderEmail({ leadId, engine, subject, html, text });
  const last = await db.emailMessage.findFirst({ where: { leadId, direction: "outbound" }, orderBy: { createdAt: "desc" } });
  if (last) await db.emailMessage.update({ where: { id: last.id }, data: { sentVia: "iphone", sentBy: s.email } }).catch(() => {});
  return NextResponse.json({ ok: r.ok, id: last?.id, error: r.error });
}
