import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendFounderEmail, engineReady } from "@/lib/founder";

const ALLOWED = ["god", "assistant"];

// Send one founder email via a chosen engine. God / assistant (founder persona) only.
export async function POST(req: NextRequest) {
  const s = await getSession();
  const isGod = s?.role === "god" || !!s?.impersonatorUid;
  if (!s || (!isGod && !ALLOWED.includes(s.role))) return NextResponse.json({ error: "Founder / assistant only" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const engine = String(b.engine || "");
  const leadId = String(b.leadId || "");
  const subject = String(b.subject || "").trim();
  const html = String(b.html || "").trim();
  if (!leadId || !engine || !subject || !html) return NextResponse.json({ error: "Recipient, engine, subject and body are required." }, { status: 400 });

  if (!(await engineReady(engine))) {
    return NextResponse.json({ ok: false, error: `The “${engine}” email engine isn’t connected yet — add it on the Integrations page.` }, { status: 200 });
  }

  const r = await sendFounderEmail({
    leadId, engine, subject, html,
    text: String(b.text || "") || undefined,
    templateId: b.templateId ? String(b.templateId) : undefined,
    templateName: String(b.templateName || ""),
  });
  // Attribute the desktop send for the unified inbox (🔥 if Jeff, 💎 if anyone else).
  if (r.ok) {
    const last = await db.emailMessage.findFirst({ where: { leadId, direction: "outbound" }, orderBy: { createdAt: "desc" } });
    if (last) await db.emailMessage.update({ where: { id: last.id }, data: { sentVia: "desktop", sentBy: s.email } }).catch(() => {});
  }
  return NextResponse.json(r);
}
