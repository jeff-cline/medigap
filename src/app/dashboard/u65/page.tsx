import { db } from "@/lib/db";
import { Card, Stat, Section, Badge } from "@/components/ui";
import { usd2, num, fmtPhone } from "@/lib/format";
import { loadU65Config } from "@/lib/u65-store";
import { weekToDateStartUtcMs } from "@/lib/u65";
import U65Controls from "@/components/u65/U65Controls";

export const dynamic = "force-dynamic";

export default async function U65Page() {
  const cfg = await loadU65Config();
  const startMs = weekToDateStartUtcMs(Date.now());
  const calls = await db.u65Call.findMany({ where: { createdAt: { gte: new Date(startMs) } }, orderBy: { createdAt: "desc" }, take: 300 });

  const total = calls.length;
  const over121 = calls.filter((c) => c.transferSec >= 121).length;
  const billableCount = calls.filter((c) => c.billable).length;
  const billableCents = billableCount * 7500;
  const paidCents = calls.filter((c) => c.reconciled && c.ringbaPaid).length * 7500;
  const ringbaConnected = calls.some((c) => c.reconciled);

  const fmt = (d: Date) => new Date(d.getTime() - 6 * 3600_000).toISOString().slice(5, 16).replace("T", " ");

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">🎯 U65 — Under-65 Private Health Calls</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          Week-to-date (since Monday, UTC-6). Calls transfer to the SET number; a transfer leg of
          <b> ≥121 seconds</b> is billable at <b>$75</b>. &ldquo;Actually paid&rdquo; reconciles against Ringba/BrokerCalls.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Total U65 calls" value={num(total)} sub="week to date" tone="default" />
        <Stat label="Over 121s (ours)" value={num(over121)} sub="transfer leg" tone="up" />
        <Stat label="Billable (ours)" value={usd2(billableCents)} sub={`${num(billableCount)} × $75`} tone="gold" />
        <Stat label="Actually paid (Ringba)" value={ringbaConnected ? usd2(paidCents) : "—"} sub={ringbaConnected ? "reconciled" : "connect Ringba"} tone={ringbaConnected ? "up" : "down"} />
      </div>

      <Section title="Controls" desc="States, destination number, hours (UTC-6), after-hours behavior, and Ringba sync.">
        <U65Controls initial={cfg} />
      </Section>

      <Section title="U65 calls this week" desc="Every U65 call — including after-hours — newest first.">
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
                <th className="text-left p-3">When (UTC-6)</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Source</th>
                <th className="text-left p-3">State</th>
                <th className="text-left p-3">Answer</th>
                <th className="text-left p-3">Transfer</th>
                <th className="text-left p-3">Billable</th>
                <th className="text-left p-3">Ringba</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-3 whitespace-nowrap text-xs text-[var(--muted)]">{fmt(c.createdAt)}{c.afterHours ? " · AH" : ""}</td>
                  <td className="p-3">{c.name || <span className="text-[var(--muted)]">{c.fromNumber ? fmtPhone(c.fromNumber) : "—"}</span>}</td>
                  <td className="p-3 text-xs">{c.source === "direct_220" ? "Direct" : "AI"}</td>
                  <td className="p-3 text-xs">{c.state || "—"}</td>
                  <td className="p-3 text-xs">{c.answer || "—"}</td>
                  <td className="p-3 text-xs">{c.transferSec ? `${c.transferSec}s` : "—"}</td>
                  <td className="p-3">{c.billable ? <Badge tone="brand">$75</Badge> : <span className="text-[var(--muted)] text-xs">—</span>}</td>
                  <td className="p-3">{c.reconciled ? <Badge tone={c.ringbaPaid ? "brand" : "default"}>{c.ringbaPaid ? "paid" : "no"}</Badge> : <span className="text-[var(--muted)] text-xs">—</span>}</td>
                </tr>
              ))}
              {calls.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-[var(--muted)]">No U65 calls this week yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      </Section>
    </>
  );
}
