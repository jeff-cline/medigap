import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, Stat, Section } from "@/components/ui";
import { num } from "@/lib/format";
import { DEFAULT_TEMPLATE } from "@/lib/fire";
import ListUploader from "@/components/fire/ListUploader";

export const dynamic = "force-dynamic";

export default async function FirePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [lists, campaigns, contactTotal, sent] = await Promise.all([
    db.emailList.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.emailCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.emailContact.count(),
    db.emailMessage.count({ where: { NOT: { batch: "" } } }),
  ]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">🔥 Fire — Predictive Data Outbound</h1>
            <p className="text-sm text-[var(--muted)] max-w-2xl">
              Upload lists, drip text or HTML emails through your warm Zapmail mailboxes at a controlled pace,
              with follow-up sequences. Text is inbox-first (no tracking); HTML can track opens.
            </p>
          </div>
          <Link href="/dashboard/u65" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]">← U65</Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <Stat label="Lists" value={num(lists.length)} sub="uploaded" tone="default" />
          <Stat label="Contacts" value={num(contactTotal)} sub="total imported" tone="up" />
          <Stat label="Campaigns" value={num(campaigns.length)} sub="all statuses" tone="gold" />
          <Stat label="Emails sent" value={num(sent)} sub="via Fire" tone="up" />
        </div>

        <Section title="Lists" desc="Your Predictive Data audiences. Upload once, reuse across campaigns.">
          <div className="space-y-3">
            <ListUploader />
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Contacts</th>
                    <th className="text-left p-3">Business emails</th>
                    <th className="text-left p-3">Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {lists.map((l) => (
                    <tr key={l.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="p-3 font-medium">{l.name}</td>
                      <td className="p-3">{num(l.total)}</td>
                      <td className="p-3 text-[var(--muted)]">{num(l.sendable)}</td>
                      <td className="p-3 text-xs text-[var(--muted)]">{l.createdAt.toISOString().slice(0, 10)}</td>
                    </tr>
                  ))}
                  {lists.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-[var(--muted)]">No lists yet — upload your first CSV above.</td></tr>}
                </tbody>
              </table>
            </Card>
          </div>
        </Section>

        <Section title="Default template" desc="The saved default — used when you start a new campaign.">
          <Card>
            <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Subject</div>
            <div className="font-semibold">{DEFAULT_TEMPLATE.subject}</div>
            <div className="mt-3 text-[10px] uppercase tracking-wide text-[var(--muted)]">Body (text)</div>
            <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-[var(--text)] leading-relaxed">{DEFAULT_TEMPLATE.body}</pre>
          </Card>
        </Section>

        <Section title="Campaigns" desc="Build a sequence (Day 1 + follow-ups), set the pace, and launch.">
          <Card>
            <p className="text-sm text-[var(--muted)]">
              The campaign builder, drip engine (per-hour throttle + warm-mailbox rotation + 30/mailbox/day cap),
              sequences, and the live sent/opened/pace dashboard are being wired up next. Your lists and the
              default template above are ready to go.
            </p>
          </Card>
        </Section>
      </div>
    </div>
  );
}
