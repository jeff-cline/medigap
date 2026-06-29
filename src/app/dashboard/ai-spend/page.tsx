import { db } from "@/lib/db";
import { Card, Stat, Section, Badge } from "@/components/ui";
import { num } from "@/lib/format";
import { ENGINES, costFromTokens } from "@/lib/voice";

export const dynamic = "force-dynamic";

const usd4 = (n: number) => `$${n.toFixed(4)}`;
const usd2 = (n: number) => `$${n.toFixed(2)}`;

export default async function AiSpendPage() {
  const since7 = new Date(Date.now() - 7 * 86400000);
  const [byProvider, totalCalls, last7] = await Promise.all([
    db.aiUsage.groupBy({ by: ["provider"], _sum: { promptTokens: true, completionTokens: true }, _count: true }),
    db.aiUsage.count(),
    db.aiUsage.aggregate({ where: { createdAt: { gte: since7 } }, _sum: { promptTokens: true, completionTokens: true }, _count: true }),
  ]);

  // Per-engine ACTUAL spend (each engine's tokens priced at its own rate).
  const rows = ENGINES.map((e) => {
    const g = byProvider.find((x) => x.provider === e.id);
    const pt = g?._sum.promptTokens ?? 0, ct = g?._sum.completionTokens ?? 0, calls = g?._count ?? 0;
    return { id: e.id, label: e.label, tier: e.tier, calls, pt, ct, cost: costFromTokens(e.id, pt, ct) };
  });
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalPT = rows.reduce((s, r) => s + r.pt, 0), totalCT = rows.reduce((s, r) => s + r.ct, 0);

  // "What if ALL our usage ran on engine X?" — the highest-vs-lowest comparison.
  const ifAll = ENGINES.map((e) => ({ id: e.id, label: e.label, cost: costFromTokens(e.id, totalPT, totalCT) }))
    .sort((a, b) => a.cost - b.cost);
  const lowest = ifAll[0], highest = ifAll[ifAll.length - 1];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">💰 AI Spend</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          What the voice AI actually costs — token usage logged on every call, priced per engine. Compare what
          you&apos;re spending now against running everything on the highest- or lowest-cost brain.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Total AI spend" value={usd2(totalCost)} sub="all time" tone="gold" />
        <Stat label="AI calls" value={num(totalCalls)} sub="logged turns" tone="default" />
        <Stat label="Tokens" value={num(totalPT + totalCT)} sub={`${num(totalPT)} in · ${num(totalCT)} out`} tone="default" />
        <Stat label="Last 7 days" value={num((last7._sum.promptTokens ?? 0) + (last7._sum.completionTokens ?? 0))} sub={`${num(last7._count)} calls`} tone="up" />
      </div>

      <Section title="Spend by engine" desc="Each engine's actual token usage, priced at its own rate.">
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
                <th className="text-left p-3">Engine</th>
                <th className="text-right p-3">Calls</th>
                <th className="text-right p-3">Tokens (in / out)</th>
                <th className="text-right p-3">Spend</th>
                <th className="text-right p-3">Avg / call</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-3 font-medium">{r.label} <span className="text-[11px] text-[var(--muted)]">· {r.tier}</span></td>
                  <td className="p-3 text-right tabular-nums">{num(r.calls)}</td>
                  <td className="p-3 text-right tabular-nums text-[var(--muted)]">{num(r.pt)} / {num(r.ct)}</td>
                  <td className="p-3 text-right tabular-nums text-[var(--gold)]">{usd4(r.cost)}</td>
                  <td className="p-3 text-right tabular-nums">{r.calls ? usd4(r.cost / r.calls) : "—"}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="p-3">Total</td>
                <td className="p-3 text-right tabular-nums">{num(totalCalls)}</td>
                <td className="p-3 text-right tabular-nums text-[var(--muted)]">{num(totalPT)} / {num(totalCT)}</td>
                <td className="p-3 text-right tabular-nums text-[var(--gold)]">{usd2(totalCost)}</td>
                <td className="p-3 text-right tabular-nums">{totalCalls ? usd4(totalCost / totalCalls) : "—"}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </Section>

      <Section title="Highest vs lowest — what if all usage ran on one engine" desc="Your total token volume priced on each brain, so you can see the real tradeoff.">
        <div className="grid gap-4 md:grid-cols-3">
          {ifAll.map((x) => (
            <Card key={x.id}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{x.label}</span>
                {x.id === highest.id && <Badge tone="gold">highest</Badge>}
                {x.id === lowest.id && <Badge tone="up">lowest</Badge>}
              </div>
              <div className="text-2xl font-bold mt-2 text-[var(--gold)]">{usd2(x.cost)}</div>
              <div className="text-[11px] text-[var(--muted)]">if 100% of usage ran here</div>
            </Card>
          ))}
          <Card glow>
            <div className="font-semibold">The difference</div>
            <div className="text-2xl font-bold mt-2">{usd2(highest.cost - lowest.cost)}</div>
            <div className="text-[11px] text-[var(--muted)]">
              {lowest.cost > 0 ? <>highest is <b className="text-[var(--text)]">{(highest.cost / lowest.cost).toFixed(0)}×</b> the lowest</> : "run some calls to compare"}
              {" "}· you&apos;re on <b className="text-[var(--text)]">{ENGINES.find((e) => rows.find((r) => r.id === e.id && r.calls > 0)) ? "mixed/selected engine" : "—"}</b>
            </div>
          </Card>
        </div>
        {totalCalls === 0 && <p className="text-xs text-[var(--muted)] mt-3">No AI calls logged yet — once the voice agent answers a call, usage appears here. Pricing uses public list rates (xAI $5/$15, Groq $0.59/$0.79 per million tokens).</p>}
      </Section>
    </>
  );
}
