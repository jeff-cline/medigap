import Link from "next/link";
import { Card, Stat, Section, Badge } from "@/components/ui";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { num, usd, cst } from "@/lib/format";
import AddCreator from "@/components/AddCreator";
import OfferManager, { type OfferRow } from "@/components/OfferManager";
import CreatorConnections from "@/components/CreatorConnections";

export const dynamic = "force-dynamic";

const ACTIVATION_FEE_CENTS = 500;  // $5 per activated (revenue-generating) customer
const REV_SHARE_PCT = 0.01;        // 1% of revenue

export default async function SocialCreatorsPage() {
  const session = await getSession();
  const isGod = session?.role === "god" || !!session?.impersonatorUid;

  // Every lead attributed to a creator (Doublewide / social).
  const leads = await db.lead.findMany({
    where: { creatorRef: { not: "" } },
    orderBy: { createdAt: "desc" },
    take: 1000,
    select: { id: true, name: true, creatorRef: true, source: true, status: true, valueCents: true, createdAt: true },
  });

  // Group by creator ref.
  const byCreator = new Map<string, { ref: string; leads: number; activated: number; revenueCents: number }>();
  for (const l of leads) {
    const g = byCreator.get(l.creatorRef) || { ref: l.creatorRef, leads: 0, activated: 0, revenueCents: 0 };
    g.leads++;
    if (l.valueCents > 0 || l.status === "sold") g.activated++;
    g.revenueCents += l.valueCents;
    byCreator.set(l.creatorRef, g);
  }
  const creators = [...byCreator.values()].map((c) => ({
    ...c,
    activationPayout: c.activated * ACTIVATION_FEE_CENTS,
    revSharePayout: Math.round(c.revenueCents * REV_SHARE_PCT),
  })).sort((a, b) => b.leads - a.leads);

  const offers = isGod ? await db.offer.findMany({ orderBy: { createdAt: "desc" } }) : [];
  const offerRows: OfferRow[] = offers.map((o) => ({ id: o.id, name: o.name, description: o.description, url: o.url, payoutCents: o.payoutCents, category: o.category, scope: o.scope, active: o.active }));

  // Creator USER accounts + their per-creator Facebook connection (god drill-in + impersonate).
  const creatorUsers = isGod ? await db.user.findMany({ where: { role: "creator" }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, refCode: true } }) : [];
  const conns = isGod && creatorUsers.length ? await db.socialConnection.findMany({ where: { userId: { in: creatorUsers.map((u) => u.id) }, platform: "facebook" } }) : [];
  const connByUser = new Map(conns.map((c) => [c.userId, c]));
  const connectionRows = creatorUsers.map((u) => {
    const c = connByUser.get(u.id);
    let pages = 0; try { pages = JSON.parse(c?.pages || "[]").length; } catch {}
    return { id: u.id, name: u.name, email: u.email, refCode: u.refCode || "", connected: !!(c && c.accountName), accountName: c?.accountName || "", pages, lastError: c?.lastError || "" };
  });

  const totalLeads = leads.length;
  const totalActivated = creators.reduce((s, c) => s + c.activated, 0);
  const totalRevenue = creators.reduce((s, c) => s + c.revenueCents, 0);
  const totalPayout = creators.reduce((s, c) => s + Math.max(c.activationPayout, c.revSharePayout), 0);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Doublewide — Social & Creators</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          Every lead a creator drives into the Core, attributed by their tracked link
          (<code className="text-[var(--brand2)]">/c/&lt;code&gt;</code>) or <code className="text-[var(--brand2)]">?ref=</code>. Model payouts as a
          <b className="text-[var(--text)]"> ${(ACTIVATION_FEE_CENTS / 100).toFixed(0)} activation fee</b> per revenue-generating customer or a
          <b className="text-[var(--text)]"> {Math.round(REV_SHARE_PCT * 100)}% revenue share</b>. Social-account dashboards (impressions / engagement / trending) light up once Facebook, Instagram &amp; X are connected on{" "}
          <Link href="/dashboard/integrations" className="text-[var(--brand)]">Integrations</Link>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Attributed Leads" value={num(totalLeads)} sub={`${creators.length} creators`} tone="up" />
        <Stat label="Activated" value={num(totalActivated)} sub="revenue-generating" tone="gold" />
        <Stat label="Revenue Driven" value={usd(totalRevenue)} sub="from creator leads" tone="up" />
        <Stat label="Modeled Payout" value={usd(totalPayout)} sub="best of activation / rev-share" tone="gold" />
      </div>

      {isGod && (
        <Section title="Creator accounts & Facebook connections" desc="Drill into any creator. They click “Connect Facebook” in their own studio — or use “Impersonate to connect” to do it for them. Connected pages & insights flow into the Core.">
          <CreatorConnections rows={connectionRows} />
        </Section>
      )}

      {isGod && (
        <Section title="Offers" desc="Brand offers in the network. Publish one network-wide (JV backfill) so every creator can promote it." action={<AddCreator role="brand" />}>
          <OfferManager offers={offerRows} canNetwork />
        </Section>
      )}

      <Section title="Creators" desc="Ranked by leads driven. Payout shows whichever model pays the creator more." action={isGod ? <AddCreator /> : undefined}>
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr><th>Creator code</th><th>Source</th><th className="text-right">Leads</th><th className="text-right">Activated</th><th className="text-right">Revenue</th><th className="text-right">$5 / activation</th><th className="text-right">1% rev-share</th><th className="text-right">Payout</th></tr>
            </thead>
            <tbody>
              {creators.map((c) => (
                <tr key={c.ref}>
                  <td className="font-medium font-mono text-sm">{c.ref}</td>
                  <td className="text-[var(--muted)] text-xs">tracked link <code className="text-[var(--brand2)]">/c/{c.ref}</code></td>
                  <td className="text-right">{num(c.leads)}</td>
                  <td className="text-right">{num(c.activated)}</td>
                  <td className="text-right">{usd(c.revenueCents)}</td>
                  <td className="text-right text-[var(--muted)]">{usd(c.activationPayout)}</td>
                  <td className="text-right text-[var(--muted)]">{usd(c.revSharePayout)}</td>
                  <td className="text-right font-semibold text-[var(--gold)]">{usd(Math.max(c.activationPayout, c.revSharePayout))}</td>
                </tr>
              ))}
              {creators.length === 0 && (
                <tr><td colSpan={8} className="text-center text-[var(--muted)] py-8">
                  No creator-attributed leads yet. Share a tracked link — <code className="text-[var(--brand2)]">https://doublewide.ai/c/&lt;creator-code&gt;</code> — and every lead that follows is credited here.
                </td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section title="Recent attributed leads" desc="Newest creator-driven leads — click into the CRM.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead><tr><th>Name</th><th>Creator</th><th>Source</th><th>Status</th><th className="text-right">Value</th><th>Created</th></tr></thead>
            <tbody>
              {leads.slice(0, 50).map((l) => (
                <tr key={l.id}>
                  <td className="font-medium"><Link href={`/dashboard/leads/${l.id}`} className="text-[var(--brand)] hover:underline">{l.name || "Unnamed"}</Link></td>
                  <td className="font-mono text-xs">{l.creatorRef}</td>
                  <td className="text-[var(--muted)] text-xs">{l.source}</td>
                  <td><Badge tone={l.status === "sold" ? "up" : "default"}>{l.status}</Badge></td>
                  <td className="text-right">{l.valueCents > 0 ? usd(l.valueCents) : "—"}</td>
                  <td className="text-[var(--muted)] text-xs">{cst(l.createdAt)}</td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan={6} className="text-center text-[var(--muted)] py-6">None yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      </Section>
    </>
  );
}
