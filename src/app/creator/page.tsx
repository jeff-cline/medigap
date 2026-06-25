import { Card, Stat, Section, Badge } from "@/components/ui";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { num, usd, cst } from "@/lib/format";
import CopyLink from "@/components/portal/CopyLink";

export const dynamic = "force-dynamic";

const ACTIVATION_FEE_CENTS = 500, REV_SHARE_PCT = 0.01;

export default async function CreatorPortal() {
  const session = await getSession();
  if (!session) return <Card><p className="text-sm text-[var(--muted)]">Sign in to your Creator Studio.</p></Card>;

  const me = await db.user.findUnique({ where: { id: session.uid }, select: { name: true, email: true, refCode: true, payoutMode: true } });
  const refCode = me?.refCode || "";
  const link = `https://doublewide.ai/c/${refCode}`;

  const leads = refCode
    ? await db.lead.findMany({ where: { creatorRef: refCode }, orderBy: { createdAt: "desc" }, take: 200, select: { id: true, name: true, status: true, valueCents: true, createdAt: true } })
    : [];
  const activated = leads.filter((l) => l.valueCents > 0 || l.status === "sold").length;
  const revenue = leads.reduce((s, l) => s + l.valueCents, 0);
  const activationPayout = activated * ACTIVATION_FEE_CENTS;
  const revSharePayout = Math.round(revenue * REV_SHARE_PCT);
  const payout = me?.payoutMode === "revshare" ? revSharePayout : activationPayout;

  // Network offers the creator can promote (with their tracked link → the offer URL).
  const networkOffers = refCode ? await db.offer.findMany({ where: { scope: "network", active: true }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, name: true, description: true, url: true, payoutCents: true, category: true } }) : [];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome{me?.name ? `, ${me.name.split(" ")[0]}` : ""} 👋</h1>
        <p className="text-sm text-[var(--muted)] max-w-2xl">Your Creator Studio on the R0cketShip Core. Share your link, drive leads, get paid on every customer — for as long as they spend.</p>
      </div>

      {!refCode ? (
        <Card><p className="text-sm text-[var(--muted)]">Your creator code is being set up — check back shortly or contact your Doublewide manager.</p></Card>
      ) : (
        <>
          <Section title="Your tracked link" desc="Put this in your bio, posts and stories. Every lead it drives is credited to you.">
            <Card glow>
              <CopyLink url={link} />
              <p className="text-xs text-[var(--muted)] mt-3">Tip: add a destination — <code className="text-[var(--brand2)]">{link}?to=https://your-offer.com</code> — and we still track the lead back to you.</p>
            </Card>
          </Section>

          <div className="grid gap-4 md:grid-cols-4 my-8">
            <Stat label="Leads driven" value={num(leads.length)} sub="into the network" tone="up" />
            <Stat label="Activated" value={num(activated)} sub="now spending" tone="gold" />
            <Stat label="Revenue driven" value={usd(revenue)} sub="from your leads" tone="up" />
            <Stat label="Your earnings" value={usd(payout)} sub={me?.payoutMode === "revshare" ? "1% revenue share" : "$5 / activation"} tone="gold" />
          </div>

          <Section title="Offers to promote" desc="Drop your tracked link to any of these in a post — leads are credited to you.">
            <div className="grid gap-3 sm:grid-cols-2">
              {networkOffers.map((o) => (
                <Card key={o.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold">{o.name}</div>
                    {o.payoutCents > 0 && <span className="text-xs text-[var(--gold)] whitespace-nowrap">${(o.payoutCents / 100).toFixed(0)} / activation</span>}
                  </div>
                  {o.category && <div className="text-[11px] uppercase tracking-wide text-[var(--muted)] mt-0.5">{o.category}</div>}
                  {o.description && <p className="text-sm text-[var(--muted)] mt-1">{o.description}</p>}
                  <div className="mt-2"><CopyLink url={`${link}${o.url ? `?to=${encodeURIComponent(o.url)}` : ""}`} /></div>
                </Card>
              ))}
              {networkOffers.length === 0 && <Card><p className="text-sm text-[var(--muted)]">No network offers yet — your manager will publish offers here for you to promote.</p></Card>}
            </div>
          </Section>

          <Section title="Your leads" desc="Everyone you've sent into the network.">
            <Card className="!p-0 overflow-hidden">
              <table>
                <thead><tr><th>Name</th><th>Status</th><th className="text-right">Value</th><th>When</th></tr></thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id}>
                      <td className="font-medium">{l.name || "New lead"}</td>
                      <td><Badge tone={l.status === "sold" ? "up" : "default"}>{l.status === "sold" ? "activated" : l.status}</Badge></td>
                      <td className="text-right">{l.valueCents > 0 ? usd(l.valueCents) : "—"}</td>
                      <td className="text-[var(--muted)] text-xs">{cst(l.createdAt)}</td>
                    </tr>
                  ))}
                  {leads.length === 0 && <tr><td colSpan={4} className="text-center text-[var(--muted)] py-8">No leads yet — share your link to get started.</td></tr>}
                </tbody>
              </table>
            </Card>
          </Section>
        </>
      )}
    </>
  );
}
