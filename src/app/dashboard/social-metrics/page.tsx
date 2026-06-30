import { db } from "@/lib/db";
import { Card, Stat, Section, Badge } from "@/components/ui";
import { num, cst } from "@/lib/format";
import { fbConfig, socialReport, socialTrends } from "@/lib/social";
import SocialMetricsControls from "@/components/SocialMetricsControls";

export const dynamic = "force-dynamic";

function Delta({ n }: { n: number }) {
  if (!n) return <span className="text-[var(--muted)] text-xs">±0</span>;
  const up = n > 0;
  return <span className={`text-xs font-medium ${up ? "text-[var(--brand)]" : "text-red-400"}`}>{up ? "▲" : "▼"} {num(Math.abs(n))}</span>;
}

// Inline SVG sparkline of a follower series.
function Sparkline({ data, w = 120, h = 26 }: { data: number[]; w?: number; h?: number }) {
  if (!data || data.length < 2) return <span className="text-[10px] text-[var(--muted)]">—</span>;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const up = data[data.length - 1] >= data[0];
  return (
    <svg width={w} height={h} className="inline-block align-middle">
      <polyline points={pts} fill="none" stroke={up ? "var(--brand)" : "#f87171"} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const platformIcon = (p: string) => (p === "instagram" ? "📸" : p === "x" ? "𝕏" : "📘");

export default async function SocialMetricsPage() {
  const [cfg, report, trends, conns] = await Promise.all([
    fbConfig(),
    socialReport(),
    socialTrends(),
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

      {trends.sample && (
        <Card className="mb-6 border-l-4 border-[var(--gold)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm"><b className="text-[var(--gold)]">👀 Preview — sample data.</b> This is what the live dashboard looks like with ~30 days of history. Connect the Doublewide business to replace it with your real numbers (the daily auto-pull keeps it fresh).</p>
            <form action="/api/social/pull" method="post"><input type="hidden" name="clearSample" value="1" /><button className="btn btn-ghost text-xs">Clear preview data</button></form>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Pages" value={num(report.totals.pages)} sub="in the portfolio" tone="default" />
        <Stat label="Total followers" value={num(report.totals.followers)} sub="across all pages" tone="up" />
        <Stat label="Impressions" value={num(report.totals.impressions)} sub="last pull (day)" tone="gold" />
        <Stat label="Engagement" value={num(report.totals.engagement)} sub="post engagements" tone="up" />
      </div>

      {/* DAY / WEEK / MONTH growth tracking */}
      <Section title="Growth — day · week · month" desc="Follower change over each window, per account, with a 30-day trend line. Built from the stored snapshots; the daily auto-pull keeps it current.">
        {trends.pages.length === 0 ? (
          <Card><p className="text-sm text-[var(--muted)]">No history yet — once accounts are connected, the daily auto-pull builds this automatically.</p></Card>
        ) : (
          <Card className="!p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="text-left p-3">Account</th>
                  <th className="text-right p-3">Followers</th>
                  <th className="text-right p-3">24 hours</th>
                  <th className="text-right p-3">7 days</th>
                  <th className="text-right p-3">30 days</th>
                  <th className="text-right p-3 pr-4">Trend</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border)] bg-[var(--panel2)] font-semibold">
                  <td className="p-3">★ All accounts</td>
                  <td className="p-3 text-right tabular-nums">{num(trends.totals.followers)}</td>
                  <td className="p-3 text-right"><Delta n={trends.totals.dDay} /></td>
                  <td className="p-3 text-right"><Delta n={trends.totals.dWeek} /></td>
                  <td className="p-3 text-right"><Delta n={trends.totals.dMonth} /></td>
                  <td className="p-3" />
                </tr>
                {trends.pages.map((p) => (
                  <tr key={p.pageId} className="border-b border-[var(--border)] last:border-0">
                    <td className="p-3 font-medium">{platformIcon(p.platform)} {p.pageName || p.pageId}</td>
                    <td className="p-3 text-right tabular-nums">{num(p.followers)}</td>
                    <td className="p-3 text-right"><Delta n={p.dDay} /></td>
                    <td className="p-3 text-right"><Delta n={p.dWeek} /></td>
                    <td className="p-3 text-right"><Delta n={p.dMonth} /></td>
                    <td className="p-3 text-right pr-4"><Sparkline data={p.series} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </Section>

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

      <p className="text-[11px] text-[var(--muted)] mt-4">✅ Auto-pull is armed: a daily job snapshots every connected account on its own, so the day/week/month trends above build automatically — no manual pulling needed. You can still hit <b>Pull metrics now</b> for an instant snapshot anytime.</p>
    </>
  );
}
