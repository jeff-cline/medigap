import Link from "next/link";
import { notFound } from "next/navigation";
import JvDeal, { type DealLead, type Activity } from "@/components/jv/JvDeal";
import { AppendedBlock } from "@/components/AppendedData";
import AppendButton from "@/components/AppendButton";
import { Card, Section } from "@/components/ui";
import { db } from "@/lib/db";
import { cstFull } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function JvDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: "desc" } },
      docs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!lead) notFound();

  const sms = await db.smsMessage.findMany({
    where: { leadId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { direction: true, body: true, createdAt: true },
  });

  const dealLead: DealLead = {
    id: lead.id, name: lead.name, phone: lead.phone, email: lead.email, zip: lead.zip, state: lead.state,
    priority: lead.priority, ltvMonthly: lead.ltvMonthlyCents ? String(lead.ltvMonthlyCents / 100) : "",
    jvInterest: lead.jvInterest, status: lead.status, optOut: lead.smsOptOut,
    autoReply: lead.autoReply, autoReplySent: lead.autoReplySent,
  };
  const [founderEmails, calls] = await Promise.all([
    db.emailMessage.findMany({
      where: { leadId: id, founder: true },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { subject: true, engine: true, status: true, templateName: true, direction: true, openedAt: true, repliedAt: true, createdAt: true },
    }),
    db.call.findMany({ where: { leadId: id }, orderBy: { createdAt: "desc" }, take: 100, select: { status: true, direction: true, durationSec: true, createdAt: true } }),
  ]);

  const messages = sms.map((m) => ({ dir: m.direction, body: m.body, at: cstFull(m.createdAt) }));
  const notes = lead.notes.map((n) => ({ author: n.authorName || "team", body: n.body, at: cstFull(n.createdAt) }));
  const docs = lead.docs.map((d) => ({ url: d.url, label: d.label, by: d.uploadedBy || "—", at: cstFull(d.createdAt) }));

  // Merge every channel into one timestamped activity stream (newest first).
  const emailStatus = (e: { direction: string; status: string; openedAt: Date | null; repliedAt: Date | null }) =>
    e.direction === "inbound" ? "reply received" : e.status === "failed" ? "failed" : e.repliedAt ? "replied" : e.openedAt ? "opened" : "sent";
  const activity: Activity[] = [
    ...founderEmails.map((e) => ({ kind: "email" as const, dir: e.direction, label: `${e.engine}${e.templateName ? " · " + e.templateName : ""}`, body: e.subject, at: cstFull(e.createdAt), status: emailStatus(e), _t: e.createdAt.getTime() })),
    ...sms.map((m) => ({ kind: "sms" as const, dir: m.direction, label: "text", body: m.body, at: cstFull(m.createdAt), _t: m.createdAt.getTime() })),
    ...calls.map((c) => ({ kind: "call" as const, dir: c.direction, label: "call", body: `${c.status} · ${Math.floor(c.durationSec / 60)}:${String(c.durationSec % 60).padStart(2, "0")}`, at: cstFull(c.createdAt), status: c.status, _t: c.createdAt.getTime() })),
    ...lead.notes.map((n) => ({ kind: "note" as const, dir: "note", label: n.authorName || "team", body: n.body, at: cstFull(n.createdAt), _t: n.createdAt.getTime() })),
  ].sort((a, b) => b._t - a._t).map(({ _t, ...rest }) => { void _t; return rest; });

  return (
    <>
      <div className="mb-4">
        <Link href="/dashboard/jv" className="text-sm text-[var(--muted)] hover:text-[var(--brand)]">← Deal Room</Link>
        <h1 className="text-2xl font-bold mt-1">{lead.name || "(no name)"}</h1>
        <p className="text-sm text-[var(--muted)]">{lead.email || "no email"} · {lead.phone || "no phone"}{lead.zip ? ` · ${lead.zip}` : ""}</p>
      </div>
      <JvDeal lead={dealLead} messages={messages} notes={notes} docs={docs} activity={activity} />

      <div className="mt-6">
        <Section title="Appended Data" desc="Enriched contact data shown in gold beside the original record — never overwritten." action={<AppendButton leadId={lead.id} />}>
          <Card><AppendedBlock raw={lead.appended} /></Card>
        </Section>
      </div>
    </>
  );
}
