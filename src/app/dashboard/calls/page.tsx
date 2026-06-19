import Link from "next/link";
import { Card, Stat, Badge, Section } from "@/components/ui";
import Gauge from "@/components/Gauge";
import CallSimulator from "@/components/CallSimulator";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/logic";
import { usd, usd2, num, TOLLFREE } from "@/lib/format";

export const dynamic = "force-dynamic";

function mmss(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function fmtPhone(p: string) {
  const d = p.replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
}

export default async function CallsPage() {
  const [calls, agents, totalCount, defaultCount, soldCount, unrealizedAgg, realizedAgg, s] = await Promise.all([
    db.call.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { lead: true } }),
    db.user.findMany({ where: { role: "agent" }, select: { id: true, name: true } }),
    db.call.count(),
    db.call.count({ where: { disposition: "default" } }),
    db.call.count({ where: { disposition: "sold" } }),
    db.ledgerEntry.aggregate({ where: { type: "revenue", realized: false }, _sum: { amountCents: true } }),
    db.ledgerEntry.aggregate({ where: { type: "revenue", realized: true, OR: [{ category: "call" }, { category: "default_call" }] }, _sum: { amountCents: true } }),
    getSettings(),
  ]);
  const agentName = new Map(agents.map((a) => [a.id, a.name]));

  const total = totalCount;
  const realizedCall = realizedAgg._sum.amountCents ?? 0;
  const unrealized = unrealizedAgg._sum.amountCents ?? 0;
  const avgValue = total > 0 ? Math.round((realizedCall + unrealized) / total) : s.defaultCallPriceCents;
  const durSum = calls.reduce((acc, c) => acc + c.durationSec, 0);
  const avgDuration = calls.length > 0 ? Math.round(durSum / calls.length) : 0;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Calls</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          The highest-value asset in the network. Every channel pushes inbound to {TOLLFREE}, which routes to the
          winning agent with a live whisper announcing zip, state, and any detected money word before connect.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Total Calls" value={num(total)} sub={`${num(soldCount)} sold · ${num(defaultCount)} default`} tone="default" />
        <Stat label="Avg Call Value" value={usd2(avgValue)} sub="across all calls" tone="gold" />
        <Stat label="Default (House) Calls" value={num(defaultCount)} sub={`→ ${fmtPhone(s.defaultForwardNumber)} @ ${usd2(s.defaultCallPriceCents)}`} tone="up" />
        <Stat label="Unrealized (House) $" value={usd(unrealized)} sub={s.showUnrealized ? "included in totals" : "EXCLUDED (toggle off)"} tone={s.showUnrealized ? "gold" : "down"} />
      </div>

      <Section title="Simulate Inbound Call" desc="Fire a call through the live auction to see routing & billing.">
        <Card glow>
          <CallSimulator />
        </Card>
      </Section>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr] mb-8 items-start">
        <Gauge value={Number((avgValue / 100).toFixed(2))} max={Math.max(50, (avgValue / 100) * 1.5)} label="Avg $/Call" unit="$" />
        <Card>
          <div className="text-sm font-semibold mb-2">Routing — {TOLLFREE}</div>
          <p className="text-sm text-[var(--muted)]">
            Inbound is matched to the live agent auction by zip → state → national; the winning agent hears a whisper
            and is bridged. <b className="text-[var(--text)]">Any call no agent buys becomes a default/house call</b> — it&apos;s
            forwarded to <b className="text-[var(--text)]">{fmtPhone(s.defaultForwardNumber)}</b> and booked at{" "}
            <b className="text-[var(--gold)]">{usd2(s.defaultCallPriceCents)}</b> as <b className="text-[var(--gold)]">unrealized</b> revenue to your God account.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="up">Sold → winning agent</Badge>
            <Badge tone="gold">Default → house @ {usd2(s.defaultCallPriceCents)}</Badge>
            <Badge tone={s.callWhisper ? "brand" : "default"}>Whisper {s.callWhisper ? "on" : "off"}</Badge>
          </div>
          <p className="text-xs text-[var(--muted)] mt-3">
            Go live: in Twilio set your toll-free <b>Voice &ldquo;A call comes in&rdquo;</b> webhook (HTTP POST) to{" "}
            <code className="text-[var(--brand2)]">https://medigap.plus/api/calls/inbound</code>. Adjust the house price, forward number &amp; whisper in <Link href="/dashboard/settings" className="text-[var(--brand)]">Settings</Link>.
          </p>
        </Card>
      </div>

      <Section title="Recent Calls" desc="Live inbound — newest first.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Lead</th>
                <th>Zip / State</th>
                <th className="text-right">Duration</th>
                <th>Status</th>
                <th>Disposition</th>
                <th>Money Word</th>
                <th className="text-right">Price</th>
                <th>Routed To</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => {
                const statusTone = c.status === "connected" || c.status === "completed" ? "up" : c.status === "missed" ? "down" : "default";
                const isDefault = c.disposition === "default";
                const routedTo = c.bidWinnerId ? (agentName.get(c.bidWinnerId) || "agent") : isDefault ? `House ${fmtPhone(c.forwardedTo)}` : "—";
                return (
                  <tr key={c.id}>
                    <td className="text-[var(--muted)] text-sm">{c.createdAt.toISOString().slice(5, 16).replace("T", " ")}</td>
                    <td className="font-medium">
                      <Link href={`/dashboard/calls/${c.id}`} className="text-[var(--brand)] hover:underline">
                        {c.lead?.name || (c.fromNumber ? fmtPhone(c.fromNumber) : "Unknown")}
                      </Link>
                    </td>
                    <td className="text-[var(--muted)]">{[c.zip, c.state].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="text-right">{mmss(c.durationSec)}</td>
                    <td><Badge tone={statusTone}>{c.status}</Badge></td>
                    <td>
                      <Badge tone={isDefault ? "gold" : "up"}>{isDefault ? "default" : "sold"}</Badge>
                      {!c.realized && <span className="ml-1 text-[10px] font-bold text-[var(--gold)]">UNREALIZED</span>}
                    </td>
                    <td>{c.moneyWord ? <span className="text-[var(--gold)] text-sm font-medium">{c.moneyWord}</span> : <span className="text-[var(--muted)]">—</span>}</td>
                    <td className="text-right font-medium text-[var(--brand)]">{c.priceCents > 0 ? usd2(c.priceCents) : "—"}</td>
                    <td className="text-[var(--muted)] text-sm">{routedTo}</td>
                  </tr>
                );
              })}
              {calls.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-[var(--muted)] py-8">
                    No calls yet. Live calls to {TOLLFREE} appear here the moment Twilio is connected — or fire a simulated inbound above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </Section>
    </>
  );
}
