import Link from "next/link";
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

      <Card className="mb-6 border-l-4 border-[var(--brand)]">
        <div className="text-sm font-semibold mb-2">📞 Test lines — call these to test the flow</div>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">AI line (1-800-MEDIGAP)</div>
            <div className="font-semibold">{fmtPhone("+18006334427")}</div>
            <div className="text-xs text-[var(--muted)]">intake → asks the U65 question → transfers</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Direct line (no AI)</div>
            <div className="font-semibold text-[var(--brand)]">{fmtPhone(cfg.directNumber)}</div>
            <div className="text-xs text-[var(--muted)]">straight to the SET number</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">SET number (buyer)</div>
            <div className="font-semibold">{fmtPhone(cfg.setNumber)}</div>
            <div className="text-xs text-[var(--muted)]">where qualified calls land</div>
          </div>
        </div>
        <p className="text-xs text-[var(--muted)] mt-3">
          Caller ID now passes the <b className="text-[var(--text)]">customer&apos;s number</b> to the buyer (not the 1-800 line).
          To activate the direct line, point {fmtPhone(cfg.directNumber)}&apos;s Twilio voice webhook (HTTP POST) at{" "}
          <code className="text-[var(--brand2)]">https://medigap.plus/api/u65/direct</code>.
        </p>
      </Card>

      <Section title="Controls" desc="States, destination number, hours (UTC-6), after-hours behavior, and Ringba sync.">
        <U65Controls initial={cfg} />
      </Section>

      <Section title="U65 calls this week" desc="Every U65 call — including after-hours — newest first.">
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
                <th className="text-left p-3">When (UTC-6)</th>
                <th className="text-left p-3">Age</th>
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
                  <td className="p-3 whitespace-nowrap text-xs">{typeof c.age === "number" ? c.age : <span className="text-[var(--muted)]">—</span>}</td>
                  <td className="p-3">{c.callId
                    ? <Link href={`/dashboard/calls/${c.callId}`} className="text-[var(--brand)] hover:underline" title="View AI conversation, caller info & appended data">{c.name || (c.fromNumber ? fmtPhone(c.fromNumber) : "View call")}</Link>
                    : (c.name || <span className="text-[var(--muted)]">{c.fromNumber ? fmtPhone(c.fromNumber) : "—"}</span>)}</td>
                  <td className="p-3 text-xs">{c.source === "direct_220" ? "Direct" : "AI"}</td>
                  <td className="p-3 text-xs">{c.state || "—"}</td>
                  <td className="p-3 text-xs">{c.answer || "—"}</td>
                  <td className="p-3 text-xs">{c.transferSec ? `${c.transferSec}s` : "—"}</td>
                  <td className="p-3">{c.billable ? <Badge tone="brand">$75</Badge> : <span className="text-[var(--muted)] text-xs">—</span>}</td>
                  <td className="p-3">{c.reconciled ? <Badge tone={c.ringbaPaid ? "brand" : "default"}>{c.ringbaPaid ? "paid" : "no"}</Badge> : <span className="text-[var(--muted)] text-xs">—</span>}</td>
                </tr>
              ))}
              {calls.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-[var(--muted)]">No U65 calls this week yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      </Section>
    </>
  );
}
