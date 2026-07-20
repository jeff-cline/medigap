import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, Stat, Section, Badge } from "@/components/ui";
import { num } from "@/lib/format";
import { DEFAULT_TEMPLATE } from "@/lib/fire";
import ListUploader from "@/components/fire/ListUploader";
import CampaignBuilder from "@/components/fire/CampaignBuilder";
import CampaignControls from "@/components/fire/CampaignControls";

export const dynamic = "force-dynamic";

export default async function FirePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [lists, campaigns, contactTotal, sentTotal, openedTotal] = await Promise.all([
    db.emailList.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.emailCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    db.emailContact.count(),
    db.emailMessage.count({ where: { batch: { not: "" }, status: "sent" } }),
    db.emailMessage.count({ where: { batch: { not: "" }, openedAt: { not: null } } }),
  ]);

  const stats = await Promise.all(campaigns.map(async (camp) => {
    const [total, sent, opened, left, pace24] = await Promise.all([
      db.campaignRecipient.count({ where: { campaignId: camp.id } }),
      db.emailMessage.count({ where: { batch: camp.id, status: "sent" } }),
      db.emailMessage.count({ where: { batch: camp.id, openedAt: { not: null } } }),
      db.campaignRecipient.count({ where: { campaignId: camp.id, status: { in: ["pending", "in_progress"] } } }),
      db.emailMessage.count({ where: { batch: camp.id, createdAt: { gte: new Date(Date.now() - 86400_000) } } }),
    ]);
    return { camp, total, sent, opened, left, pace24, estDays: left > 0 && pace24 > 0 ? Math.ceil(left / pace24) : null };
  }));

  const listOpts = lists.map((l) => ({ id: l.id, name: l.name, total: l.total, sendable: l.sendable }));

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">🔥 Fire — Predictive Data Outbound</h1>
            <p className="text-sm text-[var(--muted)] max-w-2xl">
              Drip text or HTML emails through your warm Zapmail mailboxes at a controlled pace, only during your
              send window, with follow-up sequences. Text is inbox-first (no tracking); HTML can track opens.
            </p>
          </div>
          <Link href="/dashboard/u65" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]">← U65</Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <Stat label="Contacts" value={num(contactTotal)} sub="imported" tone="default" />
          <Stat label="Emails sent" value={num(sentTotal)} sub="via Fire" tone="up" />
          <Stat label="Opened" value={num(openedTotal)} sub="HTML-tracked" tone="gold" />
          <Stat label="Campaigns" value={num(campaigns.length)} sub="all statuses" tone="up" />
        </div>

        <Section title="Campaigns" desc="Build a sequence, set the pace & send window, and Start Send Now.">
          <div className="space-y-3">
            <CampaignBuilder lists={listOpts} defaultSubject={DEFAULT_TEMPLATE.subject} defaultBody={DEFAULT_TEMPLATE.body} />
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="text-left p-3">Campaign</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Sent</th>
                    <th className="text-left p-3">Opened</th>
                    <th className="text-left p-3">Left</th>
                    <th className="text-left p-3">Pace/day</th>
                    <th className="text-left p-3">Window (CST)</th>
                    <th className="text-left p-3">Est. finish</th>
                    <th className="text-left p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map(({ camp, sent, opened, left, pace24, estDays }) => (
                    <tr key={camp.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="p-3 font-medium">{camp.name}<div className="text-[11px] text-[var(--muted)]">{camp.emailField} · {num(camp.perHour)}/hr</div></td>
                      <td className="p-3"><Badge tone={camp.status === "running" ? "up" : camp.status === "done" ? "brand" : camp.status === "paused" ? "gold" : "default"}>{camp.status}</Badge></td>
                      <td className="p-3">{num(sent)}</td>
                      <td className="p-3 text-[var(--muted)]">{camp.tracking ? num(opened) : "—"}</td>
                      <td className="p-3">{num(left)}</td>
                      <td className="p-3 text-[var(--muted)]">{num(pace24)}</td>
                      <td className="p-3 text-xs text-[var(--muted)]">{camp.sendStart}–{camp.sendEnd} · {camp.sendDays.split(",").length}d</td>
                      <td className="p-3 text-xs text-[var(--muted)]">{estDays != null ? `~${estDays}d` : left === 0 ? "done" : "—"}</td>
                      <td className="p-3"><CampaignControls id={camp.id} status={camp.status} /></td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-[var(--muted)]">No campaigns yet — create one above.</td></tr>}
                </tbody>
              </table>
            </Card>
          </div>
        </Section>

        <Section title="Lists" desc="Your Predictive Data audiences. Upload once, reuse across campaigns.">
          <div className="space-y-3">
            <ListUploader />
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="text-left p-3">Name</th><th className="text-left p-3">Contacts</th><th className="text-left p-3">Business emails</th><th className="text-left p-3">Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {lists.map((l) => (
                    <tr key={l.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="p-3 font-medium">{l.name}</td><td className="p-3">{num(l.total)}</td><td className="p-3 text-[var(--muted)]">{num(l.sendable)}</td><td className="p-3 text-xs text-[var(--muted)]">{l.createdAt.toISOString().slice(0, 10)}</td>
                    </tr>
                  ))}
                  {lists.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-[var(--muted)]">No lists yet — upload your first CSV above.</td></tr>}
                </tbody>
              </table>
            </Card>
          </div>
        </Section>

        <Section title="Default template" desc="Prefilled into Day 1 of every new campaign.">
          <Card>
            <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Subject</div>
            <div className="font-semibold">{DEFAULT_TEMPLATE.subject}</div>
            <div className="mt-3 text-[10px] uppercase tracking-wide text-[var(--muted)]">Body (text)</div>
            <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-[var(--text)] leading-relaxed">{DEFAULT_TEMPLATE.body}</pre>
          </Card>
        </Section>
      </div>
    </div>
  );
}
