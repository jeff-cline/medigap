import { Card, Stat, Badge, Section } from "@/components/ui";
import Gauge from "@/components/Gauge";
import { usd, num, pct } from "@/lib/format";

type Window = {
  date: string;
  channel: string;
  region: string;
  exhaustedAt: string;
  missedCalls: number;
  missedCents: number;
};

export default async function MissedPage() {
  // MissedOpportunity table not yet wired — realistic sample windows.
  const windows: Window[] = [
    { date: "2026-06-18", channel: "Google", region: "85016 · AZ", exhaustedAt: "12:14 PM", missedCalls: 38, missedCents: 152_000 },
    { date: "2026-06-18", channel: "Facebook", region: "FL (statewide)", exhaustedAt: "2:48 PM", missedCalls: 21, missedCents: 84_000 },
    { date: "2026-06-17", channel: "TV", region: "Phoenix DMA", exhaustedAt: "11:02 AM", missedCalls: 54, missedCents: 243_000 },
    { date: "2026-06-17", channel: "Google", region: "10001 · NY", exhaustedAt: "1:33 PM", missedCalls: 17, missedCents: 76_500 },
    { date: "2026-06-16", channel: "Affiliate", region: "National", exhaustedAt: "9:50 AM", missedCalls: 29, missedCents: 116_000 },
  ];

  const today = windows.filter((w) => w.date === "2026-06-18");
  const missedRevToday = today.reduce((s, w) => s + w.missedCents, 0);
  const missedCallsToday = today.reduce((s, w) => s + w.missedCalls, 0);
  const hoursDark = 6.8;
  const recoverablePct = 72;
  const budgetUtil = 88;

  const channelTone: Record<string, "default" | "up" | "down" | "gold" | "brand"> = {
    Google: "brand",
    Facebook: "brand",
    TV: "gold",
    Affiliate: "default",
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Missed Opportunity</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          When a channel&apos;s budget runs out mid-day (say noon) while demand is still live, we keep logging the gap —
          the calls and revenue we&apos;d have captured if we&apos;d spent more. The AI flags these windows to recommend
          budget increases where ROI was still positive.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Est. Missed Revenue" value={usd(missedRevToday)} sub="today" tone="down" />
        <Stat label="Missed Calls" value={num(missedCallsToday)} sub="today, budget-capped" tone="down" />
        <Stat label="Hours Dark" value={`${hoursDark}h`} sub="channels with $0 left" tone="down" />
        <Stat label="Recoverable" value={pct(recoverablePct)} sub="still ROI-positive" tone="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] items-start mb-8">
        <Section title="Missed Windows" desc="Where budget ran dry while demand was still live.">
          <Card className="!p-0 overflow-hidden">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Channel</th>
                  <th>Zip / Region</th>
                  <th>Budget Exhausted</th>
                  <th className="text-right">Missed Calls</th>
                  <th className="text-right">Est. Missed $</th>
                </tr>
              </thead>
              <tbody>
                {windows.map((w, i) => (
                  <tr key={i}>
                    <td className="text-[var(--muted)] text-sm">{w.date}</td>
                    <td><Badge tone={channelTone[w.channel] ?? "default"}>{w.channel}</Badge></td>
                    <td className="text-[var(--muted)]">{w.region}</td>
                    <td className="text-[var(--danger)] text-sm">{w.exhaustedAt}</td>
                    <td className="text-right">{num(w.missedCalls)}</td>
                    <td className="text-right font-medium text-[var(--danger)]">{usd(w.missedCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="text-xs text-[var(--muted)] mt-2">Wired next: MissedOpportunity table — pacing engine logs every cap-out with live demand estimate.</p>
        </Section>

        <Section title="Budget Utilization" desc="How fully today's budget was spent.">
          <Gauge value={budgetUtil} max={100} label="Budget Utilization" suffix="%" />
          <Card className="mt-4">
            <p className="text-sm text-[var(--muted)]">
              At <span className="text-[var(--brand)] font-medium">{budgetUtil}%</span> utilization with demand still live,
              the AI recommends a budget lift on ROI-positive windows.
            </p>
            <div className="mt-3"><Badge tone="gold">AI flag: raise Google/AZ cap +20%</Badge></div>
          </Card>
        </Section>
      </div>
    </>
  );
}
