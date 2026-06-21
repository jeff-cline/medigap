import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendSms } from "@/lib/sms";
import { FOUNDER, JV_TAG, PRIORITIES } from "@/lib/jv";
import { parseTags } from "@/lib/recapture";

const ALLOWED = ["god", "assistant"];

export async function POST(req: NextRequest) {
  const s = await getSession();
  const isGod = s?.role === "god" || !!s?.impersonatorUid;
  if (!s || (!isGod && !ALLOWED.includes(s.role))) return NextResponse.json({ error: "Founder / assistant only" }, { status: 403 });

  const me = await db.user.findUnique({ where: { id: s.uid }, select: { id: true, name: true, email: true } });
  const authorName = me?.name || me?.email || "team";

  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");

  // Test text to the founder's own cell so he can see what a 1-800-MEDIGAP text looks like.
  if (action === "test") {
    const r = await sendSms({ to: FOUNDER.cell, body: `Test from ${"1-800-MEDIGAP"}: this is how your outreach lands. Reply here and it threads into your JV CRM.`, batch: "jv-test" });
    return NextResponse.json(r.ok ? { ok: true } : { error: r.error || "Send failed" }, { status: r.ok ? 200 : 200 });
  }

  // Quick-add a new JV contact straight into the CRM.
  if (action === "create") {
    const name = String(b.name || "").trim();
    const phone = String(b.phone || "").trim();
    if (!name && !phone) return NextResponse.json({ error: "Name or phone required." }, { status: 400 });
    const lead = await db.lead.create({
      data: {
        name, phone, email: String(b.email || "").trim(), zip: String(b.zip || "").trim(),
        vertical: "partner", source: "JV CRM (manual)", jvInterest: String(b.jvInterest || "").trim(),
        priority: PRIORITIES.includes(b.priority) ? b.priority : "",
        tags: JSON.stringify([JV_TAG]),
      },
    });
    return NextResponse.json({ ok: true, id: lead.id });
  }

  const id = String(b.id || "");
  if (!id) return NextResponse.json({ error: "Missing lead id." }, { status: 400 });
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  if (action === "update") {
    const data: Record<string, unknown> = {};
    if (typeof b.priority === "string" && (PRIORITIES.includes(b.priority) || b.priority === "")) data.priority = b.priority;
    if (b.ltvMonthly !== undefined) data.ltvMonthlyCents = Math.max(0, Math.round(Number(b.ltvMonthly) * 100) || 0);
    if (typeof b.jvInterest === "string") data.jvInterest = b.jvInterest;
    if (typeof b.status === "string" && b.status) data.status = b.status;
    if (typeof b.name === "string" && b.name.trim()) data.name = b.name.trim();
    if (typeof b.email === "string") data.email = b.email.trim();
    if (typeof b.phone === "string") data.phone = b.phone.trim();
    // Ensure it stays tagged JV.
    const tags = parseTags(lead.tags);
    if (!tags.includes(JV_TAG)) { tags.push(JV_TAG); data.tags = JSON.stringify(tags); }
    await db.lead.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  }

  if (action === "autoreply") {
    // Arm (or clear) the first-time auto-reply for this contact. Saving re-arms it
    // so it fires on the next inbound reply.
    const body = String(b.body || "").trim().slice(0, 600);
    await db.lead.update({ where: { id }, data: { autoReply: body, autoReplySent: false } });
    return NextResponse.json({ ok: true, armed: !!body });
  }

  if (action === "note") {
    const body = String(b.body || "").trim();
    if (!body) return NextResponse.json({ error: "Note is empty." }, { status: 400 });
    await db.leadNote.create({ data: { leadId: id, authorId: s.uid, authorName, body } });
    return NextResponse.json({ ok: true });
  }

  if (action === "doc") {
    const url = String(b.url || "").trim();
    if (!url) return NextResponse.json({ error: "No document." }, { status: 400 });
    await db.leadDoc.create({ data: { leadId: id, url, label: String(b.label || "").trim(), uploadedBy: authorName } });
    return NextResponse.json({ ok: true });
  }

  if (action === "text") {
    const body = String(b.body || "").trim();
    if (!body) return NextResponse.json({ error: "Message is empty." }, { status: 400 });
    if (!lead.phone) return NextResponse.json({ error: "This contact has no phone number." }, { status: 400 });
    if (lead.smsOptOut) return NextResponse.json({ error: "This contact opted out of texts." }, { status: 400 });
    const r = await sendSms({ to: lead.phone, body, leadId: id, batch: "jv-thread" });
    if (!r.ok) return NextResponse.json({ error: r.error || "Send failed." }, { status: 200 });
    // Log who sent it as a note for the audit trail.
    await db.leadNote.create({ data: { leadId: id, authorId: s.uid, authorName, body: `📤 Texted: ${body}` } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
