import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Card, Stat, Section, Badge } from "@/components/ui";
import { num } from "@/lib/format";
import { adsenseCfg, adsenseReport, adsenseSiteList } from "@/lib/adsense";
import AdsenseToggles from "@/components/AdsenseToggles";

export const dynamic = "force-dynamic";
const usd = (n: number) => "$" + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function AdsenseDashboard() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!(s.role === "god" || s.role === "accounting" || s.impersonatorUid)) redirect("/dashboard");

  const [cfg, sites, byDate, byDomain] = await Promise.all([
    adsenseCfg(),
    adsenseSiteList(),
    adsenseReport("LAST_30_DAYS", "DATE"),
    adsenseReport("LAST_30_DAYS", "DOMAIN_NAME"),
  ]);
  const connected = byDate.ok;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">💰 Google AdSense</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">Earnings across your Core sites (last 30 days), plus per-site on/off. Publisher <b>{cfg.pubId}</b>.</p>
      </div>

      {!connected && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <Badge tone="down">reporting not connected</Badge>
              <span className="ml-2 text-[var(--muted)]">{byDate.error || "Add OAuth Client ID/Secret on Integrations, then Connect."}</span>
            </div>
            <div className="flex gap-2">
              <a href="/dashboard/integrations" className="btn btn-ghost text-sm">Add keys</a>
              <a href="/api/oauth/adsense/start" className="btn btn-brand text-sm">Connect Google →</a>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border)] text-xs text-[var(--muted)]">
            In your Google Cloud OAuth client, add this <b>exact</b> Authorized redirect URI (Credentials → your OAuth client → Authorized redirect URIs):
            <div className="mt-1"><code className="rounded bg-[var(--panel2)] border border-[var(--border)] px-2 py-1 select-all text-[var(--ink)]">https://medigap.plus/api/oauth/adsense/callback</code></div>
            <div className="mt-1">Connect from <b>medigap.plus</b> (not www or another site). No trailing slash, https, and use the same OAuth client whose ID/Secret you saved.</div>
          </div>
        </Card>
      )}

      {connected && (
        <>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Stat label="Earnings (30d)" value={usd(byDate.totals.earnings)} tone="gold" />
            <Stat label="Clicks" value={num(byDate.totals.clicks)} tone="up" />
            <Stat label="Page views" value={num(byDate.totals.pageViews)} />
            <Stat label="Page RPM" value={usd(byDate.totals.rpm)} sub="revenue / 1,000 views" tone="up" />
          </div>

          <Section title="Value by site (30 days)" desc="Which Core site earns the most.">
            {byDomain.rows.length === 0 ? <Card><p className="text-sm text-[var(--muted)]">No per-site data yet.</p></Card> : (
              <Card className="!p-0 overflow-hidden"><table className="w-full text-sm">
                <thead><tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]"><th className="text-left p-3">Domain</th><th className="text-right p-3">Earnings</th><th className="text-right p-3">Clicks</th><th className="text-right p-3">Page views</th><th className="text-right p-3">RPM</th></tr></thead>
                <tbody>{byDomain.rows.map((r) => (<tr key={r.domain} className="border-b border-[var(--border)] last:border-0"><td className="p-3 font-medium">{r.domain}</td><td className="p-3 text-right text-[var(--brand2)] font-medium">{usd(r.earnings)}</td><td className="p-3 text-right tabular-nums">{num(r.clicks)}</td><td className="p-3 text-right tabular-nums">{num(r.pageViews)}</td><td className="p-3 text-right">{usd(r.rpm)}</td></tr>))}</tbody>
              </table></Card>
            )}
          </Section>
        </>
      )}

      <Section title="AdSense by site — publisher ID + on/off" desc="Set each site's AdSense publisher ID (blank = use the default) and toggle the script on or off. Changes take effect immediately.">
        <AdsenseToggles sites={sites} defaultPub={cfg.pubId} />
        <p className="text-xs text-[var(--muted)] mt-3">Green = the AdSense script loads on that host, using its own publisher ID if set (otherwise the default <b>{cfg.pubId}</b>). New white-label sites default to OFF until turned on here.</p>
      </Section>
    </>
  );
}
