import { Card, Stat, Badge, Section, AIButton } from "@/components/ui";
import { usd, usd2, num, pct } from "@/lib/format";

type SampleAd = {
  headline: string;
  kind: "text" | "banner" | "display";
  cpcCents: number;
  placement: string;
  balanceCents: number;
  clicks: number;
};

export default function AdvertisersPage() {
  // Ad / AdEvent tables EMPTY — render realistic sample.
  const ads: SampleAd[] = [
    { headline: "Compare Plan G in 60 seconds", kind: "text", cpcCents: 320, placement: "results-top", balanceCents: 48000, clicks: 412 },
    { headline: "Dental + Vision add-on", kind: "banner", cpcCents: 180, placement: "sidebar", balanceCents: 22500, clicks: 1290 },
    { headline: "Switch carriers, keep your doctor", kind: "display", cpcCents: 410, placement: "article-inline", balanceCents: 73000, clicks: 233 },
    { headline: "Free hearing aid benefit", kind: "text", cpcCents: 95, placement: "footer", balanceCents: 9800, clicks: 2040 },
    { headline: "Medicare Advantage $0 premium", kind: "banner", cpcCents: 260, placement: "results-top", balanceCents: 56000, clicks: 705 },
  ];

  const activeAdvertisers = 9; // sample
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const totalSpendCents = ads.reduce((s, a) => s + a.cpcCents * a.clicks, 0);
  const avgCpcCents = Math.round(totalSpendCents / totalClicks);
  const prepaidCents = ads.reduce((s, a) => s + a.balanceCents, 0);

  // Auto-optimization comparison: revenue per 1000 views, not raw CPC.
  const views = 1000;
  const offerA = { name: "Offer A", ctr: 6.0, cpcCents: 150 }; // high CTR, low CPC
  const offerB = { name: "Offer B", ctr: 1.2, cpcCents: 520 }; // low CTR, high CPC
  const rpmA = (views * (offerA.ctr / 100)) * offerA.cpcCents; // cents per 1000 views
  const rpmB = (views * (offerB.ctr / 100)) * offerB.cpcCents;
  const winner = rpmA >= rpmB ? offerA.name : offerB.name;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Advertisers — CPC</h1>
        <p className="text-sm text-[var(--muted)]">
          Prepaid cost-per-click ads across the network. The auctioneer auto-optimizes for revenue, not raw bid.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Active Advertisers" value={num(activeAdvertisers)} sub="with live ads" tone="up" />
        <Stat label="Total Clicks" value={num(totalClicks)} sub="this month" />
        <Stat label="Avg CPC" value={usd2(avgCpcCents)} sub="blended" tone="gold" />
        <Stat label="Prepaid Balance" value={usd(prepaidCents)} sub="on file across accounts" />
      </div>

      <Section
        title="Live Ads"
        desc="Each ad draws down a prepaid balance per click."
        action={<AIButton label="Rebalance placements" />}
      >
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Headline</th>
                <th>Kind</th>
                <th>Placement</th>
                <th className="text-right">CPC Bid</th>
                <th className="text-right">Clicks</th>
                <th className="text-right">Spend</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((a, i) => (
                <tr key={i}>
                  <td className="font-medium">{a.headline}</td>
                  <td><Badge tone="default">{a.kind}</Badge></td>
                  <td className="text-[var(--muted)]">{a.placement}</td>
                  <td className="text-right">{usd2(a.cpcCents)}</td>
                  <td className="text-right">{num(a.clicks)}</td>
                  <td className="text-right text-[var(--brand)]">{usd(a.cpcCents * a.clicks)}</td>
                  <td className="text-right text-[var(--muted)]">{usd(a.balanceCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: Ad + AdEvent tables → per-impression/click billing &amp; balance draw-down.</p>
      </Section>

      <Section title="Auto-optimization" desc="The engine maximizes revenue-per-1,000-views (RPM), not just the highest CPC.">
        <div className="grid gap-4 md:grid-cols-3">
          <Card glow>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{offerA.name}</span>
              <Badge tone={winner === offerA.name ? "gold" : "default"}>{winner === offerA.name ? "★ served" : "held"}</Badge>
            </div>
            <p className="text-sm text-[var(--muted)] mt-2">High CTR, low CPC</p>
            <div className="mt-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-[var(--muted)]">CTR</span><span>{pct(offerA.ctr)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">CPC</span><span>{usd2(offerA.cpcCents)}</span></div>
              <div className="flex justify-between border-t border-[var(--border)] pt-1 mt-1"><span className="text-[var(--muted)]">RPM (per 1k views)</span><span className="font-bold text-[var(--brand)]">{usd2(rpmA)}</span></div>
            </div>
          </Card>
          <Card glow>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{offerB.name}</span>
              <Badge tone={winner === offerB.name ? "gold" : "default"}>{winner === offerB.name ? "★ served" : "held"}</Badge>
            </div>
            <p className="text-sm text-[var(--muted)] mt-2">Low CTR, high CPC</p>
            <div className="mt-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-[var(--muted)]">CTR</span><span>{pct(offerB.ctr)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">CPC</span><span>{usd2(offerB.cpcCents)}</span></div>
              <div className="flex justify-between border-t border-[var(--border)] pt-1 mt-1"><span className="text-[var(--muted)]">RPM (per 1k views)</span><span className="font-bold text-[var(--brand)]">{usd2(rpmB)}</span></div>
            </div>
          </Card>
          <Card>
            <span className="font-semibold">Verdict</span>
            <p className="text-sm text-[var(--muted)] mt-2">
              Despite a {usd2(offerB.cpcCents)} CPC, {offerB.name} earns less per 1,000 views.
              The engine serves <span className="text-[var(--gold)] font-medium">{winner}</span> — it wins on RPM.
            </p>
            <div className="mt-3 text-sm flex justify-between border-t border-[var(--border)] pt-2">
              <span className="text-[var(--muted)]">RPM lift</span>
              <span className="font-bold text-[var(--brand)]">+{pct(((Math.max(rpmA, rpmB) - Math.min(rpmA, rpmB)) / Math.min(rpmA, rpmB)) * 100)}</span>
            </div>
          </Card>
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: AdEvent CTR feedback loop → real-time RPM ranking per slot.</p>
      </Section>
    </>
  );
}
