import { Card, Stat, Badge, Section } from "@/components/ui";
import { usd, usd2, num, pct } from "@/lib/format";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdvertisersPage() {
  const [advertisers, ads] = await Promise.all([
    db.user.findMany({ where: { role: "advertiser" } }),
    db.ad.findMany({ include: { events: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const advertiserById = new Map(advertisers.map((u) => [u.id, u]));

  // Per-ad real event stats.
  const adRows = ads.map((a) => {
    const clicks = a.events.filter((e) => e.kind === "click").length;
    const impressions = a.events.filter((e) => e.kind === "impression").length;
    const spendCents = a.events
      .filter((e) => e.kind === "click")
      .reduce((s, e) => s + e.costCents, 0);
    // RPM proxy: revenue earned per 1,000 views.
    const rpmCents = impressions > 0 ? (clicks / impressions) * a.bidCents * 1000 : 0;
    return { ad: a, clicks, impressions, spendCents, rpmCents };
  });

  // KPIs
  const activeAdvertisers = advertisers.length;
  const totalClicks = adRows.reduce((s, r) => s + r.clicks, 0);
  const avgCpcCents = ads.length
    ? Math.round(ads.reduce((s, a) => s + a.bidCents, 0) / ads.length)
    : 0;
  const revenueCents = adRows.reduce((s, r) => s + r.spendCents, 0);

  // Group by advertiser.
  const grouped = new Map<
    string,
    { name: string; ads: number; balanceCents: number; clicks: number; spendCents: number }
  >();
  for (const r of adRows) {
    const u = advertiserById.get(r.ad.advertiserId);
    const key = r.ad.advertiserId;
    const cur =
      grouped.get(key) ??
      { name: u?.name || u?.email || "Unknown", ads: 0, balanceCents: 0, clicks: 0, spendCents: 0 };
    cur.ads += 1;
    cur.balanceCents += r.ad.balanceCents;
    cur.clicks += r.clicks;
    cur.spendCents += r.spendCents;
    grouped.set(key, cur);
  }
  const advRows = [...grouped.values()].sort((a, b) => b.spendCents - a.spendCents);

  // Auto-optimization: which ad earns most per 1,000 views (RPM), regardless of raw CPC.
  const ranked = [...adRows].filter((r) => r.impressions > 0).sort((a, b) => b.rpmCents - a.rpmCents);
  const best = ranked[0];
  const worst = ranked.length > 1 ? ranked[ranked.length - 1] : undefined;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Advertisers — CPC</h1>
        <p className="text-sm text-[var(--muted)]">
          Prepaid cost-per-click ads across the network. The engine auto-optimizes for revenue-per-1,000-views, not raw bid.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Active Advertisers" value={num(activeAdvertisers)} sub="role = advertiser" tone="up" />
        <Stat label="Total Clicks" value={num(totalClicks)} sub="all AdEvents" />
        <Stat label="Avg CPC" value={usd2(avgCpcCents)} sub="mean bid" tone="gold" />
        <Stat label="Revenue from Clicks" value={usd(revenueCents)} sub="billed click costs" />
      </div>

      <Section title="By Advertiser" desc="Each advertiser's ads, prepaid balance, and click performance.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Advertiser</th>
                <th className="text-right"># Ads</th>
                <th className="text-right">Balance</th>
                <th className="text-right">Clicks</th>
                <th className="text-right">Spend</th>
              </tr>
            </thead>
            <tbody>
              {advRows.map((r, i) => (
                <tr key={i}>
                  <td className="font-medium">{r.name}</td>
                  <td className="text-right">{num(r.ads)}</td>
                  <td className="text-right text-[var(--muted)]">{usd(r.balanceCents)}</td>
                  <td className="text-right">{num(r.clicks)}</td>
                  <td className="text-right text-[var(--brand)]">{usd(r.spendCents)}</td>
                </tr>
              ))}
              {advRows.length === 0 && (
                <tr><td colSpan={5} className="text-[var(--muted)]">No advertisers with ads yet.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section title="All Ads" desc="Every live ad with real click counts and spend drawn from AdEvent.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Headline</th>
                <th>Kind</th>
                <th className="text-right">CPC</th>
                <th>Placement</th>
                <th className="text-right">Balance</th>
                <th className="text-right">Clicks</th>
                <th className="text-right">Spend</th>
              </tr>
            </thead>
            <tbody>
              {adRows.map((r) => (
                <tr key={r.ad.id}>
                  <td className="font-medium">{r.ad.headline}</td>
                  <td><Badge tone="default">{r.ad.kind}</Badge></td>
                  <td className="text-right">{usd2(r.ad.bidCents)}</td>
                  <td className="text-[var(--muted)]">{r.ad.placement}</td>
                  <td className="text-right text-[var(--muted)]">{usd(r.ad.balanceCents)}</td>
                  <td className="text-right">{num(r.clicks)}</td>
                  <td className="text-right text-[var(--brand)]">{usd(r.spendCents)}</td>
                </tr>
              ))}
              {adRows.length === 0 && (
                <tr><td colSpan={7} className="text-[var(--muted)]">No ads yet.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section
        title="Auto-optimization"
        desc="The engine maximizes revenue-per-1,000-views (RPM = CTR × CPC × 1,000), not the highest CPC."
      >
        {best ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Card glow>
              <div className="flex items-center justify-between">
                <span className="font-semibold truncate">{best.ad.headline}</span>
                <Badge tone="gold">★ served</Badge>
              </div>
              <p className="text-sm text-[var(--muted)] mt-2">Top earner per 1,000 views</p>
              <div className="mt-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-[var(--muted)]">CTR</span><span>{pct(best.impressions ? (best.clicks / best.impressions) * 100 : 0)}</span></div>
                <div className="flex justify-between"><span className="text-[var(--muted)]">CPC</span><span>{usd2(best.ad.bidCents)}</span></div>
                <div className="flex justify-between border-t border-[var(--border)] pt-1 mt-1">
                  <span className="text-[var(--muted)]">RPM (per 1k views)</span>
                  <span className="font-bold text-[var(--brand)]">{usd2(Math.round(best.rpmCents))}</span>
                </div>
              </div>
            </Card>

            {worst && (
              <Card glow>
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate">{worst.ad.headline}</span>
                  <Badge tone="default">held</Badge>
                </div>
                <p className="text-sm text-[var(--muted)] mt-2">Lowest RPM of the set</p>
                <div className="mt-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-[var(--muted)]">CTR</span><span>{pct(worst.impressions ? (worst.clicks / worst.impressions) * 100 : 0)}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--muted)]">CPC</span><span>{usd2(worst.ad.bidCents)}</span></div>
                  <div className="flex justify-between border-t border-[var(--border)] pt-1 mt-1">
                    <span className="text-[var(--muted)]">RPM (per 1k views)</span>
                    <span className="font-bold text-[var(--brand)]">{usd2(Math.round(worst.rpmCents))}</span>
                  </div>
                </div>
              </Card>
            )}

            <Card>
              <span className="font-semibold">Why this wins</span>
              <p className="text-sm text-[var(--muted)] mt-2">
                The platform ranks ads by <span className="text-[var(--text)] font-medium">revenue per 1,000 views</span>,
                so a modest CPC with a strong click-through rate beats a high CPC nobody clicks.
                {worst && worst.rpmCents > 0 && (
                  <> Serving <span className="text-[var(--gold)] font-medium">{best.ad.headline}</span> over{" "}
                  {worst.ad.headline} lifts RPM by{" "}
                  <span className="text-[var(--brand)] font-medium">
                    {pct(((best.rpmCents - worst.rpmCents) / worst.rpmCents) * 100)}
                  </span>.</>
                )}
              </p>
            </Card>
          </div>
        ) : (
          <Card>
            <p className="text-sm text-[var(--muted)]">
              No ads with impressions yet — RPM ranking appears once ads start serving.
            </p>
          </Card>
        )}
      </Section>
    </>
  );
}
