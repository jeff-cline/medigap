import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Card, Stat, Section, Badge } from "@/components/ui";
import { num } from "@/lib/format";
import { rakReport } from "@/lib/medigapp";
import { rakCfg } from "@/lib/rakuten";
import RakAdmin from "@/components/RakAdmin";

export const dynamic = "force-dynamic";
const usd = (c: number) => "$" + (c / 100).toFixed(2);
const pct = (n: number) => (n * 100).toFixed(1) + "%";

export default async function MedigappDashboard() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!(s.role === "god" || s.role === "marketing" || s.impersonatorUid)) redirect("/dashboard");

  const [rep, cfg] = await Promise.all([rakReport(), rakCfg()]);
  const ready = !!cfg.clientId && !!cfg.clientSecret;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">📱 Medig.app</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">Keyword offer landers on <b>medig.app</b> — toll-free 1-800-MEDIGAP top &amp; bottom, Rakuten offers in the middle. Every click and commission is tracked so you can see which pages and offers monetize best.</p>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2"><Badge tone={cfg.clientId ? "up" : "down"}>{cfg.clientId ? "set" : "missing"}</Badge> Rakuten Client ID/Secret</div>
          <div className="flex items-center gap-2"><Badge tone={cfg.sid ? "up" : "down"}>{cfg.sid ? "set" : "needed"}</Badge> Account SID (scope)</div>
          <div className="flex items-center gap-2"><Badge tone="default">A record → 137.220.56.129</Badge> medig.app DNS</div>
        </div>
        {!cfg.sid && <p className="text-xs text-[var(--muted)] mt-3">Add your Rakuten <b>Account SID</b> on <a href="/dashboard/integrations" className="text-[var(--brand)]">Integrations</a> → &ldquo;Rakuten Advertising&rdquo; so offers &amp; commissions scope to your account, then <b>Pull offers</b> below.</p>}
      </Card>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Clicks in (views)" value={num(rep.totals.views)} sub="lander page views" tone="up" />
        <Stat label="Clicks out" value={num(rep.totals.outs)} sub={`CTR ${pct(rep.totals.ctr)}`} tone="default" />
        <Stat label="Revenue" value={usd(rep.totals.revenueCents)} sub={`${num(rep.totals.events)} commissions`} tone="gold" />
        <Stat label="EPC" value={usd(rep.totals.epcCents)} sub="earnings per click-out" tone="up" />
      </div>

      <Section title="Best pages" desc="Which keyword landers monetize best — by revenue, then EPC.">
        {rep.topPages.length === 0 ? <Card><p className="text-sm text-[var(--muted)]">No page data yet — create a keyword page below and send traffic.</p></Card> : (
          <Card className="!p-0 overflow-hidden"><table className="w-full text-sm">
            <thead><tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]"><th className="text-left p-3">Page</th><th className="text-right p-3">Views</th><th className="text-right p-3">Clicks out</th><th className="text-right p-3">CTR</th><th className="text-right p-3">Revenue</th><th className="text-right p-3">EPC</th></tr></thead>
            <tbody>{rep.topPages.map((p) => (<tr key={p.slug} className="border-b border-[var(--border)] last:border-0"><td className="p-3"><a href={`https://medig.app/${p.slug}`} target="_blank" className="text-[var(--brand)] font-medium">/{p.slug}</a></td><td className="p-3 text-right tabular-nums">{num(p.views)}</td><td className="p-3 text-right tabular-nums">{num(p.outs)}</td><td className="p-3 text-right">{pct(p.ctr)}</td><td className="p-3 text-right font-medium text-[var(--brand2)]">{usd(p.revCents)}</td><td className="p-3 text-right">{usd(p.epcCents)}</td></tr>))}</tbody>
          </table></Card>
        )}
      </Section>

      <Section title="Best offers" desc="Which Rakuten offers convert — by revenue.">
        {rep.topOffers.length === 0 ? <Card><p className="text-sm text-[var(--muted)]">No offer performance yet.</p></Card> : (
          <Card className="!p-0 overflow-hidden"><table className="w-full text-sm">
            <thead><tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]"><th className="text-left p-3">Offer</th><th className="text-right p-3">Clicks out</th><th className="text-right p-3">Revenue</th><th className="text-right p-3">EPC</th></tr></thead>
            <tbody>{rep.topOffers.map((o) => (<tr key={o.id} className="border-b border-[var(--border)] last:border-0"><td className="p-3 font-medium">{o.name}</td><td className="p-3 text-right tabular-nums">{num(o.outs)}</td><td className="p-3 text-right font-medium text-[var(--brand2)]">{usd(o.revCents)}</td><td className="p-3 text-right">{usd(o.epcCents)}</td></tr>))}</tbody>
          </table></Card>
        )}
      </Section>

      <RakAdmin
        ready={ready}
        pages={rep.pages.map((p) => ({ id: p.id, slug: p.slug, moneyWord: p.moneyWord, title: p.title, active: p.active, views: p.views }))}
        offers={rep.offers.map((o) => ({ id: o.id, advertiser: o.advertiser, title: o.title, approved: o.approved, category: o.category }))}
      />
    </>
  );
}
