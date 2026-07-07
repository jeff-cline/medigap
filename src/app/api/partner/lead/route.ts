import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
const GOD = "jeff.cline@me.com";
// CRM project-update notifications for this JV go to both Jeff and the Savage XM partner.
const NOTIFY = "jeff.cline@me.com, s@savagexm.com";

async function canAccess(s: Awaited<ReturnType<typeof getSession>>, leadId: string) {
  if (!s) return false;
  if (s.role === "god" || s.impersonatorUid) return true;
  if (s.role !== "marketing_partner") return false;
  const lead = await db.lead.findUnique({ where: { id: leadId }, select: { siteId: true } });
  if (!lead?.siteId) return false;
  const site = await db.site.findUnique({ where: { id: lead.siteId }, select: { ownerId: true } });
  return site?.ownerId === s.uid;
}

async function notifyGod(byEmail: string, leadName: string, what: string) {
  if (byEmail === GOD) return; // don't email god about god's own edits
  await sendEmail(NOTIFY, "Experiential Marketing — project update", `${byEmail} updated the project for <b>${leadName || "a client"}</b>:<br>${what}<br><br>Log in to review: https://experientialmarketing.ai/partner`, "zapmail", { text: `${byEmail} updated ${leadName}: ${what}` }).catch(() => {});
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  const b = await req.json().catch(() => ({}));
  const leadId = String(b.leadId || "");
  if (!(await canAccess(s, leadId))) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const a = String(b.action || "");
  const lead = await db.lead.findUnique({ where: { id: leadId }, select: { name: true } });
  try {
    if (a === "saveProject") {
      const data = { estimate: String(b.estimate || ""), dateExpected: String(b.dateExpected || ""), dateDelivered: String(b.dateDelivered || ""), clientExpectations: String(b.clientExpectations || ""), stage: String(b.stage || "new") };
      await db.jvProject.upsert({ where: { leadId }, update: data, create: { leadId, ...data } });
      await notifyGod(s!.email, lead?.name || "", `Project details saved (stage: ${data.stage}${data.estimate ? `, estimate ${data.estimate}` : ""}).`);
      return NextResponse.json({ ok: true });
    }
    if (a === "addNote") {
      const body = String(b.body || "").trim();
      if (!body) return NextResponse.json({ error: "Empty note" }, { status: 400 });
      await db.leadNote.create({ data: { leadId, authorId: s!.uid, authorName: s!.email, body } });
      await notifyGod(s!.email, lead?.name || "", `New note: "${body.slice(0, 140)}"`);
      return NextResponse.json({ ok: true });
    }
    if (a === "setStatus") {
      await db.lead.update({ where: { id: leadId }, data: { status: String(b.status || "new") } });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) { return NextResponse.json({ error: String(e).slice(0, 200) }, { status: 200 }); }
}
