import Link from "next/link";
import { Card, Stat, Section, Badge } from "@/components/ui";
import Gauge from "@/components/Gauge";
import { getMoneySnapshot, recentLedger, getSetting } from "@/lib/queries";
import { db } from "@/lib/db";
import { usd, num } from "@/lib/format";

export default async function DashboardHome() {
  const m = await getMoneySnapshot();
  const ledger = await recentLedger(10);
  const target = parseFloat(await getSetting("arbitrageTarget", "3.0"));
  const pinned = await db.autonomousLog.findFirst({ where: { pinned: true }, orderBy: { createdAt: "desc" } });

  return (
    <>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">God Dashboard</h1>
          <p className="text-sm text-[var(--muted)]">Total network performance — everything reports up here.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button className="btn btn-ghost !py-1.5">Today</button>
          <button className="btn btn-ghost !py-1.5">Week</button>
          <button className="btn btn-brand !py-1.5">Month</button>
        </div>
      </div>

      {pinned && (
        <div className="card glow p-4 mb-6 border-l-4 border-l-[var(--gold)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-[var(--gold)] font-semibold uppercase tracking-wide">✦ Autonomous AI — needs your call</div>
              <div className="mt-1 font-medium">{pinned.question}</div>
              <div className="text-sm text-[var(--muted)] mt-1">{pinned.rationale}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="btn btn-brand !py-1.5 text-sm">Approve</button>
              <button className="btn btn-ghost !py-1.5 text-sm">Decline</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Revenue (MTD)" value={usd(m.revenue)} sub="all units" tone="up" />
        <Stat label="Spend (MTD)" value={usd(m.spend)} sub="ads + ops" tone="down" />
        <Stat label="Profit (MTD)" value={usd(m.profit)} sub="revenue − spend" tone={m.profit >= 0 ? "up" : "down"} />
        <Stat label="Arbitrage Ratio" value={`${m.roi.toFixed(2)}x`} sub={`target ${target.toFixed(1)}x ($1→$${target.toFixed(0)})`} tone="gold" />
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Gauge value={Number(m.roi.toFixed(2))} max={Math.max(4, target + 1)} label="Arbitrage Velocity (x)" />
        <Gauge value={m.calls} max={Math.max(50, m.calls * 1.4)} label="Calls — Volume" />
        <Gauge value={m.leads} max={Math.max(100, m.leads * 1.4)} label="Leads — Volume" />
      </div>

      <Section title="Business Units" desc="Tap a unit tab above to drill in. Each reports up to this dashboard.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Agents", `${num(m.agents)} active`, "Pay-per-call auction", "/dashboard/agents"],
            ["Advertisers", `${num(m.advertisers)} active`, "CPC banner & text ads", "/dashboard/advertisers"],
            ["Money Words", "Live", "Keyword-triggered flows", "/dashboard/money-words"],
            ["Live Upsells", "Live", "Re-monetize every call", "/dashboard/upsells"],
            ["Autonomous Risk", "Carrier mode", "Enroll · collect · sweep", "/dashboard/risk"],
            ["Investors", `${num(m.investors)} funded`, "Deposit & profit waterfall", "/dashboard/investors"],
            ["Accounting", "To the cent", "Every dollar in & out", "/dashboard/accounting"],
            ["Autonomous Logic", "Learning ✦", "AI decisions & questions", "/dashboard/autonomous"],
          ].map(([t, badge, desc, href]) => (
            <Link key={href} href={href} className="card p-5 hover:glow transition block">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t}</span>
                <Badge tone="brand">{badge}</Badge>
              </div>
              <p className="text-sm text-[var(--muted)] mt-2">{desc}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Recent Ledger" desc="Live money movement across the network." action={<Link href="/dashboard/accounting" className="text-sm text-[var(--brand)]">Full ledger →</Link>}>
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead><tr><th>When</th><th>Type</th><th>Category</th><th>Channel</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {ledger.map((l) => (
                <tr key={l.id}>
                  <td className="text-[var(--muted)]">{l.createdAt.toISOString().slice(0, 10)}</td>
                  <td>{l.type === "revenue" ? <Badge tone="up">revenue</Badge> : <Badge tone="down">spend</Badge>}</td>
                  <td>{l.category}</td>
                  <td className="text-[var(--muted)]">{l.channel || "—"}</td>
                  <td className={`text-right font-medium ${l.type === "revenue" ? "text-[var(--brand)]" : "text-[var(--danger)]"}`}>{l.type === "revenue" ? "+" : "−"}{usd(l.amountCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>
    </>
  );
}
