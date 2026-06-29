import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import UnifiedInbox, { type Thread } from "@/components/UnifiedInbox";
import { stripHtml, attribution, canUnified, inUnifiedScope } from "@/lib/unified";
import { BULK_TAG } from "@/lib/jv-constants";

export const dynamic = "force-dynamic";

export default async function UnifiedPage() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!canUnified(s)) {
    return (
      <div className="min-h-screen grid place-items-center bg-[var(--bg)] p-6 text-center">
        <div><div className="text-4xl mb-3">🔒</div><p className="text-[var(--muted)]">This is the founder&apos;s private JV space. Only Jeff and his designated assistants can view it.</p></div>
      </div>
    );
  }

  const [emails, sms] = await Promise.all([
    db.emailMessage.findMany({ where: { leadId: { not: null } }, orderBy: { createdAt: "desc" }, take: 1000,
      select: { id: true, leadId: true, direction: true, subject: true, body: true, sentVia: true, sentBy: true, readAt: true, createdAt: true } }),
    db.smsMessage.findMany({ where: { leadId: { not: null } }, orderBy: { createdAt: "desc" }, take: 1000,
      select: { id: true, leadId: true, direction: true, body: true, sentVia: true, sentBy: true, readAt: true, createdAt: true } }),
  ]);
  const msgLeadIds = [...new Set([...emails, ...sms].map((m) => m.leadId).filter(Boolean) as string[])];

  // THE WALL: only JV / partner / dumpster contacts — never consumers.
  const leads = await db.lead.findMany({ where: { id: { in: msgLeadIds } }, select: { id: true, name: true, phone: true, email: true, tags: true, score: true, emoji: true } });
  const scopeLeads = leads.filter((l) => inUnifiedScope(l.tags));
  const leadMap = new Map(scopeLeads.map((l) => [l.id, l]));

  type Msg = Thread["messages"][number];
  const byLead = new Map<string, Msg[]>();
  const add = (leadId: string, m: Msg) => { if (!leadMap.has(leadId)) return; const a = byLead.get(leadId) || []; a.push(m); byLead.set(leadId, a); };

  for (const e of emails) add(e.leadId!, { id: e.id, channel: "email", direction: e.direction, body: stripHtml(e.body).slice(0, 4000), subject: e.subject || "", at: e.createdAt.toISOString(), emoji: attribution(e.direction, e.sentVia, e.sentBy), read: e.direction === "outbound" || !!e.readAt });
  for (const m of sms) add(m.leadId!, { id: m.id, channel: "sms", direction: m.direction, body: m.body || "", subject: "", at: m.createdAt.toISOString(), emoji: attribution(m.direction, m.sentVia, m.sentBy), read: m.direction === "outbound" || !!m.readAt });

  const threads: Thread[] = scopeLeads.map((l) => {
    const messages = (byLead.get(l.id) || []).sort((a, b) => +new Date(b.at) - +new Date(a.at));
    return {
      leadId: l.id, name: l.name || l.email || l.phone || "Unknown", phone: l.phone || "", email: l.email || "",
      score: l.score, emoji: l.emoji || "", messages, lastAt: messages[0]?.at || "",
      unread: messages.filter((x) => x.direction === "inbound" && !x.read).length, lastChannel: messages[0]?.channel || "sms",
    };
  }).filter((t) => t.messages.length).sort((a, b) => +new Date(b.lastAt) - +new Date(a.lastAt));

  // UNREACHED — everyone in the dumpster we haven't sent a single message to yet.
  const dumpster = await db.lead.findMany({ where: { tags: { contains: BULK_TAG } }, orderBy: { createdAt: "desc" }, take: 1000, select: { id: true, name: true, phone: true, email: true } });
  const dumpIds = dumpster.map((d) => d.id);
  const [outE, outS] = await Promise.all([
    db.emailMessage.findMany({ where: { direction: "outbound", leadId: { in: dumpIds } }, select: { leadId: true } }),
    db.smsMessage.findMany({ where: { direction: "outbound", leadId: { in: dumpIds } }, select: { leadId: true } }),
  ]);
  const reached = new Set([...outE, ...outS].map((x) => x.leadId).filter(Boolean) as string[]);
  const unreached = dumpster.filter((d) => !reached.has(d.id)).map((d) => ({ id: d.id, name: d.name, phone: d.phone, email: d.email }));

  return <UnifiedInbox me={s.email} threads={threads} unreached={unreached} />;
}
