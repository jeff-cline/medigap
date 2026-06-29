import { db } from "@/lib/db";
import { Card, Stat, Section, Badge } from "@/components/ui";
import { num, cst } from "@/lib/format";
import { fbConfig, socialReport } from "@/lib/social";
import SocialMetricsControls from "@/components/SocialMetricsControls";

export const dynamic = "force-dynamic";

function Delta({ n }: { n: number }) {
  if (!n) return <span className="text-[var(--muted)] text-xs">±0</span>;
  const up = n > 0;
  return <span className={`text-xs font-medium ${up ? "text-[var(--brand)]" : "text-red-400"}`}>{up ? "▲" : "▼"} {num(Math.abs(n))}</span>;
}

export default async function SocialMetricsPage() {
  const [cfg, report, conns] = await Promise.all([
    fbConfig(),
    socialReport(),
    db.socialConnection.count({ where: { platform: "facebook" } }),
  ]);
  const connected = conns > 0;
  const ready = !!cfg.appId && !!cfg.appSecret;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">📊 Social Metrics</h1>
          <p className="text-sm text-[var(--muted)] max-w-3xl">
            Every Facebook/Instagram page in the Doublewide portfolio — followers, impressions and engagement,
            with change since the last pull. Snapshots are stored over time so you can measure growth.
          </p>
        </div>
        <SocialMetricsControls connected={connected} />
      </div>

      {/* setup status — what's wired and what's left */}
      <Card className="mb-6">
        <div className="grid gap-2 sm:grid-cols-3 text-sm">
          <div className="flex items-center gap-2"><Badge tone={cfg.appId ? "up" : "down"}>{cfg.appId ? "set" : "missing"}</Badge> App ID {cfg.appId && <code className="text-[var(--brand2)] text-xs">{cfg.appId}</code>}</div>
          <div className="flex items-center gap-2"><Badge tone={cfg.businessId ? "up" : "down"}>{cfg.businessId ? "set" : "missing"}</Badge> Business ID {cfg.businessId && <code className="text-[var(--brand2)] text-xs">{cfg.businessId}</code>}</div>
          <div className="flex items-center gap-2"><Badge tone={cfg.appSecret ? "up" : "down"}>{cfg.appSecret ? "set" : "needed"}</Badge> App Secret</div>
        </div>
        {!ready && <p className="text-xs text-[var(--muted)] mt-3">Add the <b>App Secret</b> on <a href="/dashboard/integrations" className="text-[var(--brand)]">Integrations</a> → &ldquo;Facebook / Meta — Social Accounts (Doublewide)&rdquo;, then click <b>Connect the Doublewide business</b> above. The whole portfolio&apos;s pages then populate below.</p>}
        {ready && !connected && <p className="text-xs text-[var(--muted)] mt-3">Credentials saved. Click <b>Connect the Doublewide business</b> above and approve on Facebook to pull the portfolio.</p>}
      </Card>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Pages" value={num(report.totals.pages)} sub="in the portfolio" tone="default" />
        <Stat label="Total followers" value={num(report.totals.followers)} sub="across all pages" tone="up" />
        <Stat label="Impressions" value={num(report.totals.impressions)} sub="last pull (day)" tone="gold" />
        <Stat label="Engagement" value={num(report.totals.engagement)} sub="post engagements" tone="up" />
      </div>

      <Section title="Pages" desc={report.lastCaptured ? `Last pull ${cst(report.lastCaptured)} · ▲/▼ = change vs the previous pull` : "No snapshots yet — connect and pull to populate."}>
        {report.pages.length === 0 ? (
          <Card><p className="text-sm text-[var(--muted)]">No page data yet. Once connected, hit <b>Pull metrics now</b> — each page&apos;s followers, impressions and engagement land here, and every pull stores a snapshot so you can track change.</p></Card>
        ) : (
          <Card className="!p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="text-left p-3">Page</th>
                  <th className="text-right p-3">Followers</th>
                  <th className="text-right p-3">Δ</th>
                  <th className="text-right p-3">Impressions</th>
                  <th className="text-right p-3">Δ</th>
                  <th className="text-right p-3">Engagement</th>
                  <th className="text-right p-3">Δ</th>
                </tr>
              </thead>
              <tbody>
                {report.pages.map((p) => (
                  <tr key={p.pageId} className="border-b border-[var(--border)] last:border-0">
                    <td className="p-3 font-medium">📘 {p.pageName || p.pageId}</td>
                    <td className="p-3 text-right tabular-nums">{num(p.followers)}</td>
                    <td className="p-3 text-right"><Delta n={p.dFollowers} /></td>
                    <td className="p-3 text-right tabular-nums">{num(p.impressions)}</td>
                    <td className="p-3 text-right"><Delta n={p.dImpressions} /></td>
                    <td className="p-3 text-right tabular-nums">{num(p.engagement)}</td>
                    <td className="p-3 text-right"><Delta n={p.dEngagement} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </Section>

      <p className="text-[11px] text-[var(--muted)] mt-4">Tip: pull on a schedule (e.g. daily) to build a clean growth trend — each pull is a stored snapshot, so the Δ columns and future charts compare any two points in time.</p>
    </>
  );
}
