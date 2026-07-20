import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, Stat, Section, Badge } from "@/components/ui";
import { usd2, num } from "@/lib/format";
import { DEFAULT_TEMPLATE } from "@/lib/fire";
import ListUploader from "@/components/fire/ListUploader";
import CampaignBuilder from "@/components/fire/CampaignBuilder";
import CampaignControls from "@/components/fire/CampaignControls";

export const dynamic = "force-dynamic";

const REVENUE_PER_CALL = 7500; // $75.00
const COST_PER_EMAIL = 5;      // $0.05

export default async function FirePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const tab = (await searchParams).tab === "calls" ? "calls" : "emails";

  const [lists, campaigns, contactTotal, sentTotal, openedTotal, conversions] = await Promise.all([
    db.emailList.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.emailCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    db.emailContact.count(),
    db.emailMessage.count({ where: { batch: { not: "" }, status: "sent" } }),
    db.emailMessage.count({ where: { batch: { not: "" }, openedAt: { not: null } } }),
    db.campaignRecipient.count({ where: { calledBackAt: { not: null } } }),
  ]);

  const revenueCents = conversions * REVENUE_PER_CALL;
  const costCents = sentTotal * COST_PER_EMAIL;
  const roas = costCents > 0 ? revenueCents / costCents : 0;
  const convRate = sentTotal > 0 ? (conversions / sentTotal) * 100 : 0;

  // Tab data
  const convertedRecips = await db.campaignRecipient.findMany({ where: { calledBackAt: { not: null } }, select: { email: true } });
  const convertedSet = new Set(convertedRecips.map((r) => r.email.toLowerCase()));
  const emails = tab === "emails" ? await db.emailMessage.findMany({ where: { batch: { not: "" } }, orderBy: { createdAt: "desc" }, take: 150 }) : [];
  const calls = tab === "calls" ? await db.campaignRecipient.findMany({ where: { calledBackAt: { not: null } }, orderBy: { calledBackAt: "desc" }, take: 150 }) : [];

  const campStats = await Promise.all(campaigns.map(async (camp) => {
    const [sent, left] = await Promise.all([
      db.emailMessage.count({ where: { batch: camp.id, status: "sent" } }),
      db.campaignRecipient.count({ where: { campaignId: camp.id, status: { in: ["pending", "in_progress"] } } }),
    ]);
    return { camp, sent, left };
  }));
  const listOpts = lists.map((l) => ({ id: l.id, name: l.name, total: l.total, sendable: l.sendable }));
  const fmt = (d: Date) => new Date(d.getTime() - 6 * 3600_000).toISOString().slice(5, 16).replace("T", " ");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">🔥 Fire — Outbound → Inbound Conversion</h1>
            <p className="text-sm text-[var(--muted)] max-w-2xl">Emails go out through warm Zapmail mailboxes. When someone we emailed <b>calls back</b>, we match their number and turn them <span className="text-[#22c55e] font-semibold">green</span> — click in to watch the voice‑AI call. $75/call revenue, $0.05/email cost, ROAS below.</p>
          </div>
          <Link href="/dashboard/u65" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]">← U65</Link>
        </div>

        {/* Conversion / ROAS KPIs */}
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
          <Stat label="Emails sent" value={num(sentTotal)} sub={`${num(contactTotal)} contacts`} tone="default" />
          <Stat label="Calls back" value={num(conversions)} sub="matched → green" tone="up" />
          <Stat label="Conversion" value={`${convRate.toFixed(1)}%`} sub="calls ÷ emails" tone="gold" />
          <Stat label="Revenue" value={usd2(revenueCents)} sub={`${num(conversions)} × $75`} tone="up" />
          <Stat label="Cost (COGS)" value={usd2(costCents)} sub={`${num(sentTotal)} × $0.05`} tone="down" />
          <div className="rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/5 p-4">
            <div className="text-xs uppercase text-[var(--muted)]">ROAS</div>
            <div className="mt-1 text-3xl font-bold text-[#22c55e]">{roas.toFixed(1)}×</div>
            <div className="text-xs text-[var(--muted)]">revenue ÷ cost</div>
          </div>
        </div>

        {/* Tabs: Outbound emails | Inbound calls */}
        <Section title="Conversion tracker" desc="Every outbound email, and the ones who called back (green). Click a call to watch the voice‑AI conversation.">
          <div className="mb-3 flex gap-2">
            <Link href="/fire?tab=emails" className={`rounded-lg px-3 py-1.5 text-sm border ${tab === "emails" ? "bg-[var(--brand)]/10 text-[var(--brand)] border-[var(--brand)]/40" : "text-[var(--muted)] border-[var(--border)]"}`}>Outbound emails ({num(sentTotal)})</Link>
            <Link href="/fire?tab=calls" className={`rounded-lg px-3 py-1.5 text-sm border ${tab === "calls" ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/40" : "text-[var(--muted)] border-[var(--border)]"}`}>Inbound calls — converted ({num(conversions)})</Link>
          </div>
          <Card className="!p-0 overflow-hidden">
            {tab === "emails" ? (
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]"><th className="text-left p-3">When</th><th className="text-left p-3">To</th><th className="text-left p-3">Campaign</th><th className="text-left p-3">Opened</th><th className="text-left p-3">Status</th></tr></thead>
                <tbody>
                  {emails.map((m) => {
                    const converted = convertedSet.has((m.to || "").toLowerCase());
                    return (
                      <tr key={m.id} className={`border-b border-[var(--border)] last:border-0 ${converted ? "bg-[#22c55e]/10" : ""}`}>
                        <td className="p-3 text-xs text-[var(--muted)] whitespace-nowrap">{fmt(m.createdAt)}</td>
                        <td className={`p-3 ${converted ? "text-[#22c55e] font-semibold" : ""}`}>{m.to}{converted && " ● called"}</td>
                        <td className="p-3 text-xs text-[var(--muted)]">{m.templateName || "—"}</td>
                        <td className="p-3 text-xs">{m.openedAt ? "✓" : "—"}</td>
                        <td className="p-3 text-xs">{m.status === "sent" ? <span className="text-[var(--brand)]">sent</span> : <span className="text-red-400">{m.status}</span>}</td>
                      </tr>
                    );
                  })}
                  {emails.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-[var(--muted)]">No emails sent yet — launch a campaign below.</td></tr>}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]"><th className="text-left p-3">Called back</th><th className="text-left p-3">Who (we emailed)</th><th className="text-left p-3">Value</th><th className="text-left p-3">Watch the call</th></tr></thead>
                <tbody>
                  {calls.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border)] last:border-0 bg-[#22c55e]/10">
                      <td className="p-3 text-xs text-[var(--muted)] whitespace-nowrap">{r.calledBackAt ? fmt(r.calledBackAt) : "—"}</td>
                      <td className="p-3 text-[#22c55e] font-semibold">{r.firstName || r.email}<div className="text-[11px] text-[var(--muted)] font-normal">{r.email}</div></td>
                      <td className="p-3"><Badge tone="brand">$75</Badge></td>
                      <td className="p-3">{r.callId ? <Link href={`/dashboard/calls/${r.callId}`} className="text-[var(--brand)] hover:underline">▶ Watch voice‑AI call</Link> : <span className="text-[var(--muted)] text-xs">—</span>}</td>
                    </tr>
                  ))}
                  {calls.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-[var(--muted)]">No call‑backs yet. When someone we emailed calls in, they turn green here.</td></tr>}
                </tbody>
              </table>
            )}
          </Card>
        </Section>

        <Section title="Campaigns" desc="Build a sequence, set the pace & send window, and Start Send Now.">
          <div className="space-y-3">
            <CampaignBuilder lists={listOpts} defaultSubject={DEFAULT_TEMPLATE.subject} defaultBody={DEFAULT_TEMPLATE.body} />
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]"><th className="text-left p-3">Campaign</th><th className="text-left p-3">Status</th><th className="text-left p-3">Sent</th><th className="text-left p-3">Left</th><th className="text-left p-3">Window (CST)</th><th className="text-left p-3"></th></tr></thead>
                <tbody>
                  {campStats.map(({ camp, sent, left }) => (
                    <tr key={camp.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="p-3 font-medium">{camp.name}<div className="text-[11px] text-[var(--muted)]">{camp.emailField} · {num(camp.perHour)}/hr</div></td>
                      <td className="p-3"><Badge tone={camp.status === "running" ? "up" : camp.status === "done" ? "brand" : camp.status === "paused" ? "gold" : "default"}>{camp.status}</Badge></td>
                      <td className="p-3">{num(sent)}</td>
                      <td className="p-3">{num(left)}</td>
                      <td className="p-3 text-xs text-[var(--muted)]">{camp.sendStart}–{camp.sendEnd} · {camp.sendDays.split(",").length}d</td>
                      <td className="p-3"><CampaignControls id={camp.id} status={camp.status} /></td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-[var(--muted)]">No campaigns yet — create one above.</td></tr>}
                </tbody>
              </table>
            </Card>
          </div>
        </Section>

        <Section title="Lists" desc="Your Predictive Data audiences.">
          <div className="space-y-3">
            <ListUploader />
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]"><th className="text-left p-3">Name</th><th className="text-left p-3">Contacts</th><th className="text-left p-3">Business emails</th><th className="text-left p-3">Uploaded</th></tr></thead>
                <tbody>
                  {lists.map((l) => (
                    <tr key={l.id} className="border-b border-[var(--border)] last:border-0"><td className="p-3 font-medium">{l.name}</td><td className="p-3">{num(l.total)}</td><td className="p-3 text-[var(--muted)]">{num(l.sendable)}</td><td className="p-3 text-xs text-[var(--muted)]">{l.createdAt.toISOString().slice(0, 10)}</td></tr>
                  ))}
                  {lists.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-[var(--muted)]">No lists yet.</td></tr>}
                </tbody>
              </table>
            </Card>
          </div>
        </Section>
      </div>
    </div>
  );
}
