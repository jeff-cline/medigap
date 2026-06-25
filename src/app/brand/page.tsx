import { Card, Stat, Section } from "@/components/ui";
import OfferManager, { type OfferRow } from "@/components/OfferManager";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { num } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BrandPortal() {
  const session = await getSession();
  if (!session) return <Card><p className="text-sm text-[var(--muted)]">Sign in to your Brand Studio.</p></Card>;

  const me = await db.user.findUnique({ where: { id: session.uid }, select: { name: true } });
  const offers = await db.offer.findMany({ where: { ownerId: session.uid }, orderBy: { createdAt: "desc" } });
  const rows: OfferRow[] = offers.map((o) => ({ id: o.id, name: o.name, description: o.description, url: o.url, payoutCents: o.payoutCents, category: o.category, scope: o.scope, active: o.active }));
  const live = offers.filter((o) => o.active).length;
  const network = offers.filter((o) => o.scope === "network").length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome{me?.name ? `, ${me.name.split(" ")[0]}` : ""} 🏷️</h1>
        <p className="text-sm text-[var(--muted)] max-w-2xl">Your Brand Studio on the R0cketShip Core. Create offers, put them in front of vetted micro-influencers, and track every lead to revenue.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Stat label="Your offers" value={num(offers.length)} sub={`${live} live`} tone="up" />
        <Stat label="On the network" value={num(network)} sub="promotable by creators" tone="gold" />
        <Stat label="Status" value={live > 0 ? "Active" : "Draft"} sub="ready for creators" tone={live > 0 ? "up" : "default"} />
      </div>
      <Section title="Your offers" desc="Create and manage what creators promote. Ask your Doublewide manager to publish an offer network-wide.">
        <OfferManager offers={rows} />
      </Section>
    </>
  );
}
