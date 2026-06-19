import { Card, Stat, Section, Badge } from "@/components/ui";
import Gauge from "@/components/Gauge";
import AdUploadForm from "@/components/portal/AdUploadForm";
import TopUpForm from "@/components/portal/TopUpForm";
import AdActiveToggle from "@/components/portal/AdActiveToggle";
import { usd, usd2, num } from "@/lib/format";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdvertiserPortal() {
  const session = await getSession();

  const ads = session
    ? await db.ad.findMany({
        where: { advertiserId: session.uid },
        orderBy: { createdAt: "desc" },
        include: { events: true },
      })
    : [];

  // Per-ad derived stats from REAL AdEvent rows.
  const rows = ads.map((a) => {
    const clicks = a.events.filter((e) => e.kind === "click").length;
    const impressions = a.events.filter((e) => e.kind === "impression").length;
    const spendCents = a.events
      .filter((e) => e.kind === "click")
      .reduce((s, e) => s + e.costCents, 0);
    return { ad: a, clicks, impressions, spendCents };
  });

  const totalBalanceCents = rows.reduce((s, r) => s + r.ad.balanceCents, 0);
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const totalSpendCents = rows.reduce((s, r) => s + r.spendCents, 0);
  const avgCpcCents = ads.length
    ? Math.round(ads.reduce((s, a) => s + a.bidCents, 0) / ads.length)
    : 0;
  const ctr = totalImpressions ? (totalClicks / totalImpressions) * 100 : 0;

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Advertiser Portal</h1>
          <p className="text-sm text-[var(--muted)]">
            CPC text, banner &amp; display across the medigap.plus network.
          </p>
        </div>
        <TopUpForm />
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Total Balance" value={usd(totalBalanceCents)} sub="prepaid across ads" tone="gold" />
        <Stat label="Clicks" value={num(totalClicks)} sub="all ads, lifetime" tone="up" />
        <Stat label="Avg CPC" value={usd2(avgCpcCents)} sub="blended bid" />
        <Stat label="Spend" value={usd(totalSpendCents)} sub="billed click costs" tone="down" />
      </div>

      <Section title="Performance" desc="Click-through rate across your active placements.">
        <div className="grid gap-4 md:grid-cols-3">
          <Gauge value={Number(ctr.toFixed(1))} max={10} label="CTR" suffix="%" />
          <Card className="md:col-span-2">
            <div className="font-semibold">Balance &amp; billing</div>
            <p className="text-sm text-[var(--muted)] mt-2">
              You&apos;re charged your CPC bid per click. Top up your prepaid balance to keep ads live —
              an ad pauses automatically when its balance reaches $0.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone={totalBalanceCents > 0 ? "up" : "down"}>
                {totalBalanceCents > 0 ? "Funded" : "Out of balance"}
              </Badge>
              <Badge tone="brand">CPC billing</Badge>
            </div>
            <p className="text-xs text-[var(--muted)] mt-3">
              {num(totalImpressions)} impressions · {num(totalClicks)} clicks served from real AdEvent data.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="My Ads" desc="Live creatives and their CPC performance.">
        {rows.length === 0 ? (
          <Card>
            <div className="font-semibold">No ads yet</div>
            <p className="text-sm text-[var(--muted)] mt-1 mb-4">
              Create your first ad below — text ads go live instantly.
            </p>
            <AdUploadForm />
          </Card>
        ) : (
          <Card className="!p-0 overflow-hidden">
            <table>
              <thead>
                <tr>
                  <th>Headline</th>
                  <th>Kind</th>
                  <th className="text-right">CPC</th>
                  <th>Placement</th>
                  <th className="text-right">Clicks</th>
                  <th className="text-right">Spend</th>
                  <th className="text-right">Balance</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ ad, clicks, spendCents }) => (
                  <tr key={ad.id}>
                    <td className="font-medium">{ad.headline}</td>
                    <td><Badge tone="brand">{ad.kind}</Badge></td>
                    <td className="text-right font-medium">{usd2(ad.bidCents)}</td>
                    <td className="text-[var(--muted)]">{ad.placement}</td>
                    <td className="text-right">{num(clicks)}</td>
                    <td className="text-right text-[var(--brand)]">{usd(spendCents)}</td>
                    <td className="text-right text-[var(--muted)]">{usd(ad.balanceCents)}</td>
                    <td>
                      <AdActiveToggle
                        ad={{
                          id: ad.id,
                          kind: ad.kind,
                          headline: ad.headline,
                          body: ad.body,
                          assetUrl: ad.assetUrl,
                          targetUrl: ad.targetUrl,
                          bidCents: ad.bidCents,
                          placement: ad.placement,
                          active: ad.active,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </Section>

      {rows.length > 0 && (
        <Section title="Upload a New Ad" desc="Text ads go live instantly; banner & display upload an image.">
          <AdUploadForm />
        </Section>
      )}
    </>
  );
}
