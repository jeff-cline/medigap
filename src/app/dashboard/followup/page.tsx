import Link from "next/link";
import { db } from "@/lib/db";
import { Card, Stat, Section, Badge } from "@/components/ui";
import { num, fmtPhone } from "@/lib/format";

export const dynamic = "force-dynamic";

const cst = (d: Date | null | undefined) => (d ? new Date(d.getTime() - 6 * 3600_000).toISOString().slice(5, 16).replace("T", " ") : "—");

export default async function FollowupPage() {
  const rows = await db.followupText.findMany({ orderBy: { createdAt: "desc" }, take: 500 }).catch(() => [] as Awaited<ReturnType<typeof db.followupText.findMany>>);
  const scheduled = rows.filter((r) => r.status === "scheduled").length;
  const sent = rows.filter((r) => r.status === "sent").length;
  const failed = rows.filter((r) => r.status === "failed" || r.status === "skipped").length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">📞 Follow-Up — missed U65 callers</h1>
          <p className="text-sm text-[var(--muted)] max-w-3xl">
            Every missed / unbilled call is auto-queued a text at <b>10:00 AM CST the next business day</b>, from 1-800-MEDIGAP:
            <i> &ldquo;Sorry we missed you — please call (the number they called), M–F 9–6. We appreciate the opportunity to serve you.&rdquo;</i>{" "}
            Replies land in <Link href="/dashboard/communications" className="text-[var(--brand)] hover:underline">Communications</Link>.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Queued (pending)" value={num(scheduled)} sub="waiting for 10 AM next biz day" tone="gold" />
        <Stat label="Texts sent" value={num(sent)} sub="follow-ups delivered" tone="up" />
        <Stat label="Failed / skipped" value={num(failed)} sub="opted out or send error" tone={failed > 0 ? "down" : "default"} />
      </div>

      <Section title="Follow-up texts" desc="Newest first. Click a name to open their lead. The report shows when each text is scheduled and when it was sent.">
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="text-left p-3">Caller</th>
                  <th className="text-left p-3">Their number</th>
                  <th className="text-left p-3">Number they called</th>
                  <th className="text-left p-3">State</th>
                  <th className="text-left p-3">Scheduled (CST)</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Sent (CST)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="p-3">
                      {r.leadId
                        ? <Link href={`/dashboard/leads/${r.leadId}`} className="text-[var(--brand)] hover:underline font-medium" title="Open lead">{r.callerName || fmtPhone(r.toNumber) || "View lead"}</Link>
                        : <span className="font-medium">{r.callerName || fmtPhone(r.toNumber) || "—"}</span>}
                    </td>
                    <td className="p-3 text-xs whitespace-nowrap">{r.toNumber ? fmtPhone(r.toNumber) : "—"}</td>
                    <td className="p-3 text-xs whitespace-nowrap">{r.calledNumber ? fmtPhone(r.calledNumber) : "—"}</td>
                    <td className="p-3 text-xs">{r.state || "—"}</td>
                    <td className="p-3 text-xs whitespace-nowrap text-[var(--muted)]">{cst(r.sendAt)}</td>
                    <td className="p-3">
                      {r.status === "sent" ? <Badge tone="up">sent ✓</Badge>
                        : r.status === "scheduled" ? <Badge tone="gold">queued</Badge>
                        : <Badge tone="default">{r.status}</Badge>}
                    </td>
                    <td className="p-3 text-xs whitespace-nowrap text-[var(--muted)]">{r.sentAt ? cst(r.sentAt) : "—"}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-[var(--muted)]">No follow-ups yet. Missed U65 calls will auto-queue here.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>
    </>
  );
}
