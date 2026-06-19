import { Card, Stat, Badge, Section, AIButton } from "@/components/ui";
import { usd, usd2, num, pct } from "@/lib/format";

type SampleOffer = {
  name: string;
  trigger: string;
  vendor: string;
  payoutCents: number;
  conversions: number;
  triggers: number;
};

export default function UpsellsPage() {
  // UpsellOffer table EMPTY — render realistic sample.
  const offers: SampleOffer[] = [
    { name: "Mortgage Protection $97/mo", trigger: "Homeowner, not converting on Medigap", vendor: "ShieldLife", payoutCents: 7500, conversions: 38, triggers: 220 },
    { name: "Final Expense $40/mo", trigger: "Age 65+, no beneficiary plan", vendor: "Legacy Life", payoutCents: 6800, conversions: 51, triggers: 410 },
    { name: "Dental + Vision Bundle", trigger: "Declined supplement on cost", vendor: "SmileWell", payoutCents: 3200, conversions: 96, triggers: 540 },
    { name: "Auto Warranty Extension", trigger: "Mentions older vehicle", vendor: "DriveGuard", payoutCents: 5400, conversions: 22, triggers: 305 },
    { name: "Identity Theft Protection", trigger: "Concerned about scams", vendor: "GuardID", payoutCents: 2900, conversions: 64, triggers: 388 },
  ];

  const activeOffers = offers.length;
  const totalTriggers = offers.reduce((s, o) => s + o.triggers, 0);
  const totalConversions = offers.reduce((s, o) => s + o.conversions, 0);
  const triggerRate = (totalConversions / totalTriggers) * 100;
  const avgPayoutCents = Math.round(offers.reduce((s, o) => s + o.payoutCents, 0) / offers.length);
  const revenueCents = offers.reduce((s, o) => s + o.payoutCents * o.conversions, 0);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Live Upsells</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          Drop-in offers that re-monetize a call that won&apos;t convert on Medigap otherwise — e.g.
          &ldquo;mortgage protection $97/mo.&rdquo; We charge a transfer fee to hand the qualified caller to the upsell vendor.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Active Offers" value={num(activeOffers)} sub="in rotation" tone="up" />
        <Stat label="Trigger → Convert" value={pct(triggerRate)} sub={`${num(totalConversions)} / ${num(totalTriggers)}`} tone="gold" />
        <Stat label="Avg Transfer Payout" value={usd2(avgPayoutCents)} sub="per converted upsell" />
        <Stat label="Upsell Revenue" value={usd(revenueCents)} sub="this month" tone="up" />
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
                <th className="text-right">Triggers</th>
                <th className="text-right">Conversions</th>
                <th className="text-right">Rate</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o, i) => (
                <tr key={i}>
                  <td className="font-medium">{o.name}</td>
                  <td className="text-[var(--muted)] text-sm">{o.trigger}</td>
                  <td>{o.vendor}</td>
                  <td className="text-right text-[var(--brand)]">{usd2(o.payoutCents)}</td>
                  <td className="text-right text-[var(--muted)]">{num(o.triggers)}</td>
                  <td className="text-right">{num(o.conversions)}</td>
                  <td className="text-right"><Badge tone="up">{pct((o.conversions / o.triggers) * 100)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: UpsellOffer table → no-convert detector &amp; vendor transfer billing.</p>
      </Section>
    </>
  );
}
