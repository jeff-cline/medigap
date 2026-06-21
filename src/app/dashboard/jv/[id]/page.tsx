import Link from "next/link";
import { notFound } from "next/navigation";
import JvDeal, { type DealLead } from "@/components/jv/JvDeal";
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
  const messages = sms.map((m) => ({ dir: m.direction, body: m.body, at: cstFull(m.createdAt) }));
  const notes = lead.notes.map((n) => ({ author: n.authorName || "team", body: n.body, at: cstFull(n.createdAt) }));
  const docs = lead.docs.map((d) => ({ url: d.url, label: d.label, by: d.uploadedBy || "—", at: cstFull(d.createdAt) }));

  return (
    <>
      <div className="mb-4">
        <Link href="/dashboard/jv" className="text-sm text-[var(--muted)] hover:text-[var(--brand)]">← Deal Room</Link>
        <h1 className="text-2xl font-bold mt-1">{lead.name || "(no name)"}</h1>
        <p className="text-sm text-[var(--muted)]">{lead.email || "no email"} · {lead.phone || "no phone"}{lead.zip ? ` · ${lead.zip}` : ""}</p>
      </div>
      <JvDeal lead={dealLead} messages={messages} notes={notes} docs={docs} />
    </>
  );
}
