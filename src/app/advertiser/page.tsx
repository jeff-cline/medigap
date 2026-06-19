import { Card, Stat, Section, Badge } from "@/components/ui";
import Gauge from "@/components/Gauge";
import AdUploadForm from "@/components/portal/AdUploadForm";
import { usd, usd2, num } from "@/lib/format";

// Ad + AdEvent tables are empty — inline sample data for the demo.
const sampleAds = [
  { headline: "Compare Medigap in 60s", kind: "text", cpcCents: 250, placement: "Quote results", clicks: 412, spendCents: 103000, active: true },
  { headline: "Plan G from $0 extra", kind: "banner", cpcCents: 310, placement: "Article sidebar", clicks: 188, spendCents: 58280, active: true },
  { headline: "Switch & save in AEP", kind: "display", cpcCents: 190, placement: "Homepage hero", clicks: 76, spendCents: 14440, active: false },
];

export default function AdvertiserPortal() {
  const clicks7d = sampleAds.reduce((s, a) => s + a.clicks, 0);
  const spend7d = sampleAds.reduce((s, a) => s + a.spendCents, 0);
  const avgCpc = Math.round(spend7d / clicks7d);
  // CTR demo: clicks vs impressions estimate.
  const impressions = 9800;
  const ctr = (clicks7d / impressions) * 100;

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Advertiser Portal</h1>
          <p className="text-sm text-[var(--muted)]">CPC text, banner & display across the medigap.plus network.</p>
        </div>
        <button className="btn btn-brand" type="button">Top up balance</button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Balance" value={usd(124500)} sub="prepaid credit" tone="gold" />
        <Stat label="Clicks (7d)" value={num(clicks7d)} sub="across all ads" tone="up" />
        <Stat label="Avg CPC" value={usd2(avgCpc)} sub="blended" />
        <Stat label="Spend (7d)" value={usd(spend7d)} sub="ads + placement" tone="down" />
      </div>

      <Section title="Performance" desc="Click-through rate across active placements.">
        <div className="grid gap-4 md:grid-cols-3">
          <Gauge value={Number(ctr.toFixed(1))} max={10} label="CTR" suffix="%" />
          <Card className="md:col-span-2">
            <div className="font-semibold">Balance & billing</div>
            <p className="text-sm text-[var(--muted)] mt-2">
              You are charged per click. Top up your prepaid balance to keep ads live; ads pause automatically at $0.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone="up">Auto-reload off</Badge>
              <Badge tone="brand">Stripe</Badge>
            </div>
            <p className="text-xs text-[var(--muted)] mt-3">Wired next: Stripe top-ups + real-time click tracking via AdEvent.</p>
          </Card>
        </div>
      </Section>

      <Section title="My Ads" desc="Live creatives and their CPC performance.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr><th>Headline</th><th>Kind</th><th className="text-right">CPC</th><th>Placement</th><th className="text-right">Clicks</th><th className="text-right">Spend</th><th>Status</th></tr>
            </thead>
            <tbody>
              {sampleAds.map((a, i) => (
                <tr key={i}>
                  <td className="font-medium">{a.headline}</td>
                  <td><Badge tone="brand">{a.kind}</Badge></td>
                  <td className="text-right font-medium">{usd2(a.cpcCents)}</td>
                  <td className="text-[var(--muted)]">{a.placement}</td>
                  <td className="text-right">{num(a.clicks)}</td>
                  <td className="text-right">{usd(a.spendCents)}</td>
                  <td>{a.active ? <Badge tone="up">Active</Badge> : <Badge tone="down">Paused</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: Ad table (currently empty) + AdEvent click logging.</p>
      </Section>

      <Section title="Upload a New Ad" desc="Text ads go live instantly; banner & display review within 24h.">
        <AdUploadForm />
      </Section>
    </>
  );
}
