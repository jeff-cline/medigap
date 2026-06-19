import { Card, Stat, Badge, Section, AIButton } from "@/components/ui";
import { db } from "@/lib/db";
import { usd, usd2, num } from "@/lib/format";

export default async function MarketingPage() {
  const [googleAgg, fbAgg, leads] = await Promise.all([
    db.ledgerEntry.aggregate({ where: { type: "spend", channel: "google" }, _sum: { amountCents: true } }),
    db.ledgerEntry.aggregate({ where: { type: "spend", channel: "facebook" }, _sum: { amountCents: true } }),
    db.lead.count(),
  ]);
  const googleSpend = googleAgg._sum.amountCents ?? 0;
  const fbSpend = fbAgg._sum.amountCents ?? 0;
  const totalAdSpend = googleSpend + fbSpend;
  const cpl = leads > 0 ? Math.round(totalAdSpend / leads) : 0;
  const calls = await db.call.count();
  const cpa = calls > 0 ? Math.round(totalAdSpend / calls) : 0;

  // Sample campaigns — realistic until Google/Meta APIs are wired.
  const campaigns = [
    { channel: "Google", name: "Medigap — Plan G Exact", spend: 142000, clicks: 1840, leads: 96, calls: 41, roas: 3.4, winner: "B" },
    { channel: "Google", name: "1-800-MEDIGAP Brand", spend: 38000, clicks: 920, leads: 78, calls: 60, roas: 6.1, winner: "A" },
    { channel: "Facebook", name: "Turning 65 — Lookalike 1%", spend: 96000, clicks: 2210, leads: 64, calls: 22, roas: 2.2, winner: "B" },
    { channel: "Facebook", name: "Retargeting — Quote Abandon", spend: 27000, clicks: 640, leads: 51, calls: 33, roas: 4.8, winner: "A" },
    { channel: "TV", name: "Daytime Cable — DR Spot", spend: 210000, clicks: 0, leads: 88, calls: 70, roas: 2.9, winner: "—" },
  ];

  const cplOf = (c: (typeof campaigns)[number]) => (c.leads > 0 ? Math.round(c.spend / c.leads) : 0);

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Marketing</h1>
          <p className="text-sm text-[var(--muted)] max-w-3xl">
            Run Google, Facebook, and TV campaigns from one console. You supply seed titles and descriptions; the
            platform auto-inserts tracking links, runs A/B tests across creatives, and does keyword→creative matching
            so the highest-converting message reaches each segment.
          </p>
        </div>
        <AIButton label="Generate creative" />
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Ad Spend — Google" value={usd(googleSpend)} sub="search + PMax" tone="down" />
        <Stat label="Ad Spend — Facebook" value={usd(fbSpend)} sub="prospecting + retargeting" tone="down" />
        <Stat label="Blended CPL" value={usd2(cpl)} sub={`${num(leads)} leads`} tone="gold" />
        <Stat label="Blended CPA" value={usd2(cpa)} sub={`${num(calls)} calls`} tone="gold" />
      </div>

      <Section title="Campaigns" desc="Live performance across every channel.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Channel</th>
                <th>Campaign</th>
                <th className="text-right">Spend</th>
                <th className="text-right">Clicks</th>
                <th className="text-right">Leads</th>
                <th className="text-right">Calls</th>
                <th className="text-right">CPL</th>
                <th className="text-right">ROAS</th>
                <th>A/B</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.name}>
                  <td>
                    <Badge tone={c.channel === "Google" ? "up" : c.channel === "Facebook" ? "brand" : "gold"}>
                      {c.channel}
                    </Badge>
                  </td>
                  <td className="font-medium">{c.name}</td>
                  <td className="text-right text-[var(--danger)]">−{usd(c.spend)}</td>
                  <td className="text-right">{c.clicks ? num(c.clicks) : "—"}</td>
                  <td className="text-right">{num(c.leads)}</td>
                  <td className="text-right">{num(c.calls)}</td>
                  <td className="text-right">{usd2(cplOf(c))}</td>
                  <td className={`text-right font-medium ${c.roas >= 3 ? "text-[var(--brand)]" : "text-[var(--gold)]"}`}>
                    {c.roas.toFixed(1)}x
                  </td>
                  <td>{c.winner === "—" ? <span className="text-[var(--muted)]">—</span> : <Badge tone="up">{c.winner} wins</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: Google Ads + Meta Marketing API via Integrations.</p>
      </Section>

      <Section title="A/B Test — Live Headline Experiment" desc="Plan G Exact campaign — auto-promoting the winner.">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { v: "A", headline: "Compare Medigap Plans in 60 Seconds", ctr: 3.1, conv: 4.2, winning: false },
            { v: "B", headline: "Turning 65? Lock Your Rate Before It Climbs", ctr: 4.7, conv: 6.8, winning: true },
          ].map((t) => (
            <Card key={t.v} glow={t.winning} className={t.winning ? "border-[var(--brand)]/40" : ""}>
              <div className="flex items-center justify-between mb-2">
                <Badge tone={t.winning ? "up" : "default"}>Variant {t.v}{t.winning ? " · winning" : ""}</Badge>
                <span className="text-xs text-[var(--muted)]">auto-rotated</span>
              </div>
              <div className="text-lg font-semibold">{t.headline}</div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">CTR</div>
                  <div className={`text-2xl font-bold ${t.winning ? "text-[var(--brand)]" : "text-[var(--text)]"}`}>{t.ctr.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Conv. Rate</div>
                  <div className={`text-2xl font-bold ${t.winning ? "text-[var(--brand)]" : "text-[var(--text)]"}`}>{t.conv.toFixed(1)}%</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">
          Wired next: statistical-significance gating before auto-promoting the winning variant.
        </p>
      </Section>
    </>
  );
}
