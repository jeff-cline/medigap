import Link from "next/link";
import { db } from "@/lib/db";
import { Card, Stat, Section, Badge } from "@/components/ui";
import { usd2, num, fmtPhone } from "@/lib/format";
import { loadU65Config } from "@/lib/u65-store";
import { weekToDateStartUtcMs } from "@/lib/u65";
import U65Controls from "@/components/u65/U65Controls";

export const dynamic = "force-dynamic";

type SP = { range?: string; from?: string; to?: string; show?: string };

// A wall-clock date (UTC-6) → UTC ms at that day's midnight (+addDays).
function parseLocalDate(s: string | undefined, addDays = 0): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  if (!m) return null;
  return Date.UTC(+m[1], +m[2] - 1, +m[3] + addDays, 6, 0, 0); // midnight UTC-6 = 06:00 UTC
}

function resolveRange(sp: SP): { startMs: number; endMs: number | null; label: string; range: string } {
  const now = Date.now();
  const DAY = 86400_000;
  if (sp.from || sp.to) {
    return { startMs: parseLocalDate(sp.from) ?? 0, endMs: sp.to ? parseLocalDate(sp.to, 1) : null, label: `${sp.from || "start"} → ${sp.to || "now"}`, range: "custom" };
  }
  const r = sp.range || "week";
  if (r === "all") return { startMs: 0, endMs: null, label: "all time", range: "all" };
  if (r === "last7") return { startMs: now - 7 * DAY, endMs: null, label: "last 7 days", range: "last7" };
  if (r === "last30") return { startMs: now - 30 * DAY, endMs: null, label: "last 30 days", range: "last30" };
  return { startMs: weekToDateStartUtcMs(now), endMs: null, label: "this week", range: "week" };
}

export default async function U65Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { startMs, endMs, label, range } = resolveRange(sp);
  const cfg = await loadU65Config();
  const calls = await db.u65Call.findMany({
    where: { createdAt: { gte: new Date(startMs), ...(endMs ? { lt: new Date(endMs) } : {}) } },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const total = calls.length;
  const over121 = calls.filter((c) => c.transferSec >= 121).length;
  const billableCount = calls.filter((c) => c.billable).length;
  const billableCents = billableCount * 7500;
  const paidCents = calls.filter((c) => c.reconciled && c.ringbaPaid).length * 7500;
  const ringbaConnected = calls.some((c) => c.reconciled);

  // Unbilled transfers = calls forwarded to the buyer that didn't earn the $75.
  // Split them so a buyer that stops answering jumps right out.
  const unbilled = total - billableCount;
  const noAnswer = calls.filter((c) => !c.billable && c.transferSec === 0).length;   // buyer never picked up
  const shortConn = calls.filter((c) => !c.billable && c.transferSec > 0 && c.transferSec < 121).length; // answered but < 2 min

  // Clickable filter: show all / only billable / only unbilled. Preserves the current date range.
  const show = sp.show === "unbilled" || sp.show === "billable" ? sp.show : "";
  const shown = show === "unbilled" ? calls.filter((c) => !c.billable) : show === "billable" ? calls.filter((c) => c.billable) : calls;
  const rangeQs = sp.from || sp.to ? `from=${sp.from || ""}&to=${sp.to || ""}` : `range=${range}`;

  const fmt = (d: Date) => new Date(d.getTime() - 6 * 3600_000).toISOString().slice(5, 16).replace("T", " ");
  const presets: [string, string][] = [["week", "This week"], ["last7", "Last 7 days"], ["last30", "Last 30 days"], ["all", "All time"]];

  // A direct call's source encodes the dial-in (QR) number it came from: "direct_<last10>".
  // Show the actual tracking number so A/B/C lines are distinguishable in the report;
  // legacy "direct_220" rows are the original 346-220-3471 line. Anything else = AI screener.
  const sourceLabel = (source: string): string => {
    if (source === "direct_220") return fmtPhone("+13462203471");
    const m = /^direct_(\d{10})$/.exec(source || "");
    return m ? fmtPhone("+1" + m[1]) : "AI";
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">🎯 U65 — Under-65 Private Health Calls</h1>
          <p className="text-sm text-[var(--muted)] max-w-3xl">
            Calls transfer to the SET number; a transfer leg of <b>≥121 seconds</b> is billable at <b>$75</b>.
            &ldquo;Actually paid&rdquo; reconciles against Ringba/BrokerCalls. Use the date picker below to view any range.
          </p>
        </div>
        <Link href="/fire" className="shrink-0 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0d9488] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#0d9488]/30 hover:brightness-110">
          ⚡ Activate Predictive Data
        </Link>
      </div>

      {(noAnswer > 0 || shortConn > 0) && (
        <Card className="mb-6 border-l-4 border-[#ef4444] bg-[#ef4444]/5">
          <div className="text-sm font-bold text-[#ef4444]">
            ⚠ {num(noAnswer)} forwarded call{noAnswer === 1 ? "" : "s"} got NO ANSWER{shortConn > 0 ? ` · ${num(shortConn)} answered but dropped under 2 min` : ""} — {label}
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">
            These transferred to your SET buyer <b>{fmtPhone(cfg.setNumber)}</b> but didn&rsquo;t connect long enough to bill — likely lost revenue. Confirm the buyer line is staffed and answering, then follow up with the callers below (their real numbers are in the list).
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Stat label="Total U65 calls" value={num(total)} sub={label} tone="default" />
        <Stat label="Over 121s (ours)" value={num(over121)} sub="transfer leg" tone="up" />
        <Link href={`/dashboard/u65?${rangeQs}&show=billable`} className={`block rounded-2xl ${show === "billable" ? "ring-2 ring-[var(--gold)]" : ""}`}>
          <Stat label="Billable (ours) ›" value={usd2(billableCents)} sub={`${num(billableCount)} × $75 — click to list`} tone="gold" />
        </Link>
        <Link href={`/dashboard/u65?${rangeQs}&show=unbilled`} className={`block rounded-2xl ${show === "unbilled" ? "ring-2 ring-[#ef4444]" : ""}`}>
          <Stat label="Unbilled transfers ›" value={num(unbilled)} sub={`${num(noAnswer)} no-answer · ${num(shortConn)} short — click to list`} tone={noAnswer > 0 ? "down" : "default"} />
        </Link>
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

      <Section title={`U65 calls — ${label}`} desc="Every U65 call — including after-hours — newest first.">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {presets.map(([val, lbl]) => (
            <Link key={val} href={`/dashboard/u65?range=${val}`}
              className={`rounded-lg px-3 py-1.5 text-xs border ${range === val ? "bg-[var(--brand)]/10 text-[var(--brand)] border-[var(--brand)]/40" : "text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)]"}`}>
              {lbl}
            </Link>
          ))}
          <form action="/dashboard/u65" className="ml-auto flex flex-wrap items-center gap-2 text-xs">
            <label className="text-[var(--muted)]">From</label>
            <input type="date" name="from" defaultValue={sp.from || ""} className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-xs" />
            <label className="text-[var(--muted)]">To</label>
            <input type="date" name="to" defaultValue={sp.to || ""} className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-xs" />
            <button className="rounded border border-[var(--border)] px-3 py-1 hover:text-[var(--brand)]">Apply</button>
          </form>
        </div>
        {show && (
          <div className="mb-3 text-xs">
            <span className={`rounded-full px-2 py-1 font-semibold ${show === "unbilled" ? "bg-[#ef4444]/15 text-[#ef4444]" : "bg-[var(--gold)]/15 text-[var(--gold)]"}`}>
              Filtered: {show === "unbilled" ? "unbilled transfers only" : "billable only"} ({num(shown.length)})
            </span>{" "}
            <Link href={`/dashboard/u65?${rangeQs}`} className="text-[var(--muted)] underline">clear filter</Link>
          </div>
        )}
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
                <th className="text-left p-3">When (UTC-6)</th>
                <th className="text-left p-3">Inbound (caller)</th>
                <th className="text-left p-3">Called into</th>
                <th className="text-left p-3">→ Sent to buyer</th>
                <th className="text-left p-3">Caller ID → buyer</th>
                <th className="text-left p-3">Result</th>
                <th className="text-left p-3">Transfer</th>
                <th className="text-left p-3">Billable</th>
                <th className="text-left p-3">Ringba</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => {
                const callerCid = c.fromNumber ? fmtPhone(c.fromNumber) : "";
                return (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-3 whitespace-nowrap text-xs text-[var(--muted)]">{fmt(c.createdAt)}{c.afterHours ? " · AH" : ""}</td>
                  <td className="p-3 whitespace-nowrap">{c.callId
                    ? <Link href={`/dashboard/calls/${c.callId}`} className="text-[var(--brand)] hover:underline" title="View AI conversation, caller info & appended data">{c.fromNumber ? fmtPhone(c.fromNumber) : "View call"}</Link>
                    : <span>{c.fromNumber ? fmtPhone(c.fromNumber) : "—"}</span>}
                    <div className="text-[11px] text-[var(--muted)]">{[c.name, typeof c.age === "number" ? `age ${c.age}` : "", c.state].filter(Boolean).join(" · ") || "—"}</div>
                  </td>
                  <td className="p-3 text-xs whitespace-nowrap">{sourceLabel(c.source)}</td>
                  <td className="p-3 text-xs whitespace-nowrap">{c.forwardedTo ? fmtPhone(c.forwardedTo) : <span className="text-[var(--muted)]">not sent</span>}</td>
                  <td className="p-3 text-xs whitespace-nowrap">{callerCid
                    ? <span className="text-[#22c55e]" title="The buyer sees the caller's own number">✓ {callerCid}</span>
                    : <span className="text-[#f59e0b]" title="Caller withheld number — fell back to toll-free">⚠ toll-free</span>}</td>
                  <td className="p-3 text-xs">{c.answer || "—"}</td>
                  <td className="p-3 text-xs">{c.transferSec ? `${c.transferSec}s` : "—"}</td>
                  <td className="p-3">{c.billable ? <Badge tone="brand">$75</Badge> : <span className="text-[var(--muted)] text-xs">—</span>}</td>
                  <td className="p-3">{c.reconciled ? <Badge tone={c.ringbaPaid ? "brand" : "default"}>{c.ringbaPaid ? "paid" : "no"}</Badge> : <span className="text-[var(--muted)] text-xs">—</span>}</td>
                </tr>
                );
              })}
              {shown.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-[var(--muted)]">No {show || "U65"} calls in this range. <Link href="/dashboard/u65?range=all" className="text-[var(--brand)] hover:underline">View all time →</Link></td></tr>}
            </tbody>
          </table>
          </div>
        </Card>
      </Section>
    </>
  );
}
