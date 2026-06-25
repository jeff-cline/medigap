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
