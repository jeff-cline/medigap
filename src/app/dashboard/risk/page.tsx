import { Card, Stat, Badge, Section, AIButton } from "@/components/ui";
import CrudForm, { ToggleActive } from "@/components/CrudForm";
import { db } from "@/lib/db";
import { usd2, num } from "@/lib/format";

export default async function RiskPage() {
  const products = await db.riskProduct.findMany({ orderBy: { premiumCents: "desc" } });

  const active = products.filter((p) => p.active);
  const activeProducts = active.length;
  const avgPremiumCents = products.length
    ? Math.round(products.reduce((s, p) => s + p.premiumCents, 0) / products.length)
    : 0;
  const avgSweepDays = products.length
    ? Math.round(products.reduce((s, p) => s + p.sweepDays, 0) / products.length)
    : 0;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Autonomous Risk — Carrier Mode</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          We become the carrier of record: enroll the customer into a real application via API, collect the premium
          through Stripe, hold the funds for <span className="text-[var(--gold)]">N days</span>, then sweep the net to
          the underlying carrier. Reinsurance-style float in between. Add, pause, or retire products live.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Stat label="Active Products" value={num(activeProducts)} sub={`${num(products.length)} total`} tone="up" />
        <Stat label="Avg Premium" value={usd2(avgPremiumCents)} sub="monthly per policy" tone="gold" />
        <Stat label="Avg Sweep Days" value={`${num(avgSweepDays)}d`} sub="hold window" tone="down" />
      </div>

      <Section
        title="Risk Products"
        desc="Each product binds a real policy; premium is collected, held, then swept to the carrier."
        action={<AIButton label="Model exposure" />}
      >
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-right">Monthly Premium</th>
                <th className="text-right">Sweep Window</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.name}</td>
                  <td className="text-right text-[var(--brand)]">{usd2(p.premiumCents)}</td>
                  <td className="text-right text-[var(--muted)]">{p.sweepDays} days</td>
                  <td>{p.active ? <Badge tone="up">live</Badge> : <Badge tone="down">paused</Badge>}</td>
                  <td className="text-right">
                    <ToggleActive endpoint="/api/risk" id={p.id} active={p.active} />
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-[var(--muted)] py-8">
                    No risk products yet — add one below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section title="Money Flow" desc="Premium moves through three stages — we hold the float in between.">
        <Card glow>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--panel2)] p-4">
              <Badge tone="up">1 · Collected</Badge>
              <p className="text-xs text-[var(--muted)] mt-2">Premium charged to the customer via Stripe at bind.</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--panel2)] p-4">
              <Badge tone="gold">2 · Held (float)</Badge>
              <p className="text-xs text-[var(--muted)] mt-2">
                Funds sit in the hold window (avg {num(avgSweepDays)} days) before sweep.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--panel2)] p-4">
              <Badge tone="brand">3 · Swept to carrier</Badge>
              <p className="text-xs text-[var(--muted)] mt-2">Net premium swept to the carrier of record via Stripe Connect.</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
            Stripe → ledger → Stripe Connect ACH. Sweep runs nightly per RiskProduct.sweepDays.
          </div>
        </Card>
      </Section>

      <Section title="Add a risk product" desc="Define the monthly premium and sweep window.">
        <Card glow>
          <CrudForm
            endpoint="/api/risk"
            submitLabel="Add product"
            successNote="Risk product added."
            fields={[
              { name: "name", label: "Product name", placeholder: "Accident Guard (A&H)", required: true },
              { name: "premiumCents", label: "Monthly premium (USD)", type: "number", placeholder: "97" },
              { name: "sweepDays", label: "Sweep days", type: "number", placeholder: "3" },
            ]}
          />
          <p className="text-xs text-[var(--muted)] mt-3">Premium is entered in dollars and stored as cents.</p>
        </Card>
      </Section>
    </>
  );
}
