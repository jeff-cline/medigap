import { Card, Stat, Badge, Section, AIButton } from "@/components/ui";
import CrudForm, { ToggleActive } from "@/components/CrudForm";
import { db } from "@/lib/db";
import { usd2, num } from "@/lib/format";

export default async function UpsellsPage() {
  const offers = await db.upsellOffer.findMany({ orderBy: { payoutCents: "desc" } });

  const active = offers.filter((o) => o.active);
  const activeOffers = active.length;
  const avgPayoutCents = offers.length ? Math.round(offers.reduce((s, o) => s + o.payoutCents, 0) / offers.length) : 0;
  const vendors = new Set(offers.map((o) => o.vendor).filter(Boolean)).size;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Live Upsells</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          Drop-in offers that re-monetize a call that won&apos;t convert on Medigap otherwise — e.g.
          &ldquo;mortgage protection $97/mo.&rdquo; Each offer fires on a no-convert trigger; a successful transfer pays
          a vendor fee. Add, pause, or retire offers live.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Stat label="Active Offers" value={num(activeOffers)} sub={`${num(offers.length)} total`} tone="up" />
        <Stat label="Avg Payout" value={usd2(avgPayoutCents)} sub="per converted upsell" tone="gold" />
        <Stat label="Vendors" value={num(vendors)} sub="distinct partners" />
      </div>

      <Section
        title="Upsell Offers"
        desc="Each offer fires on a no-convert signal; a successful transfer pays a vendor fee."
        action={<AIButton label="Tune triggers" />}
      >
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Offer</th>
                <th>Trigger</th>
                <th>Vendor</th>
                <th className="text-right">Payout</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => (
                <tr key={o.id}>
                  <td className="font-medium">{o.name}</td>
                  <td className="text-[var(--muted)] text-sm">{o.trigger || "—"}</td>
                  <td>{o.vendor || "—"}</td>
                  <td className="text-right text-[var(--brand)]">{usd2(o.payoutCents)}</td>
                  <td>{o.active ? <Badge tone="up">active</Badge> : <Badge tone="down">paused</Badge>}</td>
                  <td className="text-right">
                    <ToggleActive endpoint="/api/upsells" id={o.id} active={o.active} />
                  </td>
                </tr>
              ))}
              {offers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-[var(--muted)] py-8">
                    No upsell offers yet — add one below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section title="Add an upsell offer" desc="Define the trigger, vendor, and transfer payout.">
        <Card glow>
          <CrudForm
            endpoint="/api/upsells"
            submitLabel="Add offer"
            successNote="Upsell offer added."
            fields={[
              { name: "name", label: "Offer name", placeholder: "Mortgage Protection $97/mo", required: true },
              { name: "trigger", label: "Trigger", placeholder: "Homeowner, not converting on Medigap" },
              { name: "vendor", label: "Vendor", placeholder: "ShieldLife" },
              { name: "payoutCents", label: "Payout (USD)", type: "number", placeholder: "75" },
            ]}
          />
          <p className="text-xs text-[var(--muted)] mt-3">Payout is entered in dollars and stored as cents.</p>
        </Card>
      </Section>
    </>
  );
}
