import { Card, Stat, Badge, Section, AIButton } from "@/components/ui";
import Gauge from "@/components/Gauge";
import { db } from "@/lib/db";
import { pnl } from "@/lib/logic";
import { usd, num, pct } from "@/lib/format";

const channelLabel: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  tv: "TV",
  vibe: "Vibe",
  organic: "Organic",
};
const channelTone: Record<string, "default" | "up" | "down" | "gold" | "brand"> = {
  google: "up",
  facebook: "brand",
  tv: "gold",
  vibe: "brand",
  organic: "default",
};

export default async function MissedPage() {
  const [campaigns, p] = await Promise.all([
    db.campaign.findMany({ where: { active: true }, orderBy: { spendCents: "desc" } }),
    pnl(),
  ]);

  // Value of a captured call = network revenue ÷ calls billed, falling back to the call-bid floor.
  const minBidRow = await db.setting.findUnique({ where: { key: "minCallBidCents" } });
  const minBid = parseInt(minBidRow?.value || "2500", 10);
  const totalCalls = campaigns.reduce((s, c) => s + c.calls, 0);
  const avgCallValue = p.revenue > 0 && totalCalls > 0 ? Math.round(p.revenue / totalCalls) : minBid;

  // Model a "missed window" per high-spend channel: we treat spend running notably above a
  // per-channel notional daily cap as evidence the budget exhausted while demand was still live.
  // Missed calls are ESTIMATED from each campaign's own call-per-dollar efficiency applied to the
  // overspend gap. Honestly an estimate — labeled as such.
  const NOTIONAL_CAP = 150_000; // cents/day per campaign before we assume cap-out risk
  const RECOVERABLE = 0.7; // share of the gap that was still ROI-positive

  const windows = campaigns
    .filter((c) => c.spendCents > NOTIONAL_CAP && c.calls > 0)
    .map((c) => {
      const overspend = c.spendCents - NOTIONAL_CAP;
      // Calls-per-cent for this campaign, projected onto the recoverable overspend gap.
      const callsPerCent = c.calls / c.spendCents;
      const missedCalls = Math.round(overspend * callsPerCent * RECOVERABLE);
      const missedCents = missedCalls * avgCallValue;
      return {
        id: c.id,
        channel: c.channel,
        name: c.name,
        capPct: Math.min(100, Math.round((c.spendCents / NOTIONAL_CAP) * 100)),
        missedCalls,
        missedCents,
      };
    })
    .filter((w) => w.missedCalls > 0)
    .sort((a, b) => b.missedCents - a.missedCents);

  const missedRev = windows.reduce((s, w) => s + w.missedCents, 0);
  const missedCalls = windows.reduce((s, w) => s + w.missedCalls, 0);
  // Hours dark: rough proxy from how far over cap the flagged channels ran (capped at 12h/window).
  const hoursDark = windows.length
    ? Math.min(12, Number((windows.reduce((s, w) => s + (w.capPct - 100) / 100, 0) * 2).toFixed(1)))
    : 0;
  const recoverablePct = Math.round(RECOVERABLE * 100);

  // Budget utilization: total spend vs. total notional cap across active campaigns.
  const totalSpend = campaigns.reduce((s, c) => s + c.spendCents, 0);
  const totalCap = Math.max(1, campaigns.length * NOTIONAL_CAP);
  const budgetUtil = Math.min(100, Math.round((totalSpend / totalCap) * 100));

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Missed Opportunity</h1>
          <p className="text-sm text-[var(--muted)] max-w-3xl">
            When a channel&apos;s budget runs out mid-day while demand is still live, we log the gap — the calls and
            revenue we&apos;d have captured if we&apos;d spent more. Figures below are <span className="text-[var(--text)]">estimates</span>{" "}
            derived from each campaign&apos;s real spend and call efficiency. The AI flags ROI-positive windows to recommend
            budget increases.
          </p>
        </div>
        <AIButton label="Recommend budgets" />
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Est. Missed Revenue" value={usd(missedRev)} sub="today, budget-capped" tone="down" />
        <Stat label="Est. Missed Calls" value={num(missedCalls)} sub="demand left on the table" tone="down" />
        <Stat label="Hours Dark" value={`${hoursDark}h`} sub="channels past notional cap" tone="down" />
        <Stat label="Recoverable" value={pct(recoverablePct)} sub="still ROI-positive" tone="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] items-start mb-8">
        <Section title="Missed Windows" desc="Active campaigns running past their notional daily cap with live demand.">
          {windows.length === 0 ? (
            <Card>
              <p className="text-sm text-[var(--muted)]">
                No capped-out windows detected — every active campaign is pacing within its notional daily budget. Nice.
              </p>
            </Card>
          ) : (
            <Card className="!p-0 overflow-hidden">
              <table>
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Campaign</th>
                    <th className="text-right">Budget Used</th>
                    <th className="text-right">Est. Missed Calls</th>
                    <th className="text-right">Est. Missed $</th>
                  </tr>
                </thead>
                <tbody>
                  {windows.map((w) => (
                    <tr key={w.id}>
                      <td><Badge tone={channelTone[w.channel] ?? "default"}>{channelLabel[w.channel] ?? w.channel}</Badge></td>
                      <td className="font-medium">{w.name}</td>
                      <td className="text-right text-[var(--danger)]">{w.capPct}%</td>
                      <td className="text-right">{num(w.missedCalls)}</td>
                      <td className="text-right font-medium text-[var(--danger)]">{usd(w.missedCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          <p className="text-xs text-[var(--muted)] mt-2">
            Estimate basis: each campaign&apos;s own calls-per-dollar applied to spend above a {usd(150_000)} notional daily
            cap, valued at {usd(avgCallValue)}/call ({p.revenue > 0 ? "network revenue ÷ calls" : "call-bid floor"}),
            {recoverablePct}% recoverable. Wired next: real pacing engine logging every cap-out against live demand.
          </p>
        </Section>

        <Section title="Budget Utilization" desc="How fully today's notional budget was spent.">
          <Gauge value={budgetUtil} max={100} label="Budget Utilization" suffix="%" />
          <Card className="mt-4">
            <p className="text-sm text-[var(--muted)]">
              At <span className="text-[var(--brand)] font-medium">{budgetUtil}%</span> utilization
              {windows.length > 0 ? " with demand still live, " : ", "}
              the AI {windows.length > 0 ? "recommends a budget lift on the ROI-positive windows above." : "sees headroom — no lift needed yet."}
            </p>
            {windows.length > 0 && (
              <div className="mt-3">
                <Badge tone="gold">AI flag: raise {channelLabel[windows[0].channel] ?? windows[0].channel} cap +20%</Badge>
              </div>
            )}
          </Card>
        </Section>
      </div>
    </>
  );
}
