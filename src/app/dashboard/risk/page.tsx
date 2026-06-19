import { Card, Stat, Badge, Section, AIButton } from "@/components/ui";
import { usd, usd2, num } from "@/lib/format";

type SampleProduct = {
  name: string;
  premiumCents: number;
  sweepDays: number;
  bound: number;
  active: boolean;
};

export default function RiskPage() {
  // RiskProduct table EMPTY — render realistic sample.
  const products: SampleProduct[] = [
    { name: "Accident Guard (A&H)", premiumCents: 9700, sweepDays: 3, bound: 184, active: true },
    { name: "Hospital Indemnity", premiumCents: 12500, sweepDays: 5, bound: 96, active: true },
    { name: "Critical Illness Lite", premiumCents: 8400, sweepDays: 3, bound: 142, active: true },
    { name: "Final Expense (whole)", premiumCents: 4000, sweepDays: 7, bound: 61, active: false },
  ];

  const activeProducts = products.filter((p) => p.active).length;
  const policiesBound = products.reduce((s, p) => s + p.bound, 0);
  const premiumCollectedCents = products.reduce((s, p) => s + p.premiumCents * p.bound, 0);
  // Pending sweep = premium collected but still inside the hold window (sample ~ a slice of MRR).
  const pendingSweepCents = Math.round(premiumCollectedCents * 0.18);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Autonomous Risk — Carrier Mode</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          We become the carrier of record: enroll the customer into a real application via API, collect the
          premium through Stripe, hold the funds for <span className="text-[var(--gold)]">N days</span>, then sweep
          the net to the underlying carrier. Reinsurance-style float in between.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Stat label="Active Risk Products" value={num(activeProducts)} sub="bindable today" tone="up" />
        <Stat label="Policies Bound" value={num(policiesBound)} sub="lifetime" />
        <Stat label="Premium Collected" value={usd(premiumCollectedCents)} sub="MTD via Stripe" tone="gold" />
        <Stat label="Pending Sweep" value={usd(pendingSweepCents)} sub="in hold window" tone="down" />
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
                <th className="text-right">Policies Bound</th>
                <th className="text-right">Premium Collected</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i}>
                  <td className="font-medium">{p.name}</td>
                  <td className="text-right">{usd2(p.premiumCents)}</td>
                  <td className="text-right text-[var(--muted)]">{p.sweepDays} days</td>
                  <td className="text-right">{num(p.bound)}</td>
                  <td className="text-right text-[var(--brand)]">{usd(p.premiumCents * p.bound)}</td>
                  <td>{p.active ? <Badge tone="up">live</Badge> : <Badge tone="down">paused</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: RiskProduct table → carrier enrollment API &amp; Stripe premium collection.</p>
      </Section>

      <Section title="Money Flow" desc="Premium moves through three stages — we hold the float in between.">
        <Card glow>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--panel2)] p-4">
              <Badge tone="up">1 · Collected</Badge>
              <div className="mt-2 text-2xl font-bold text-[var(--brand)]">{usd(premiumCollectedCents)}</div>
              <p className="text-xs text-[var(--muted)] mt-1">Charged to customer via Stripe at bind.</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--panel2)] p-4">
              <Badge tone="gold">2 · Held (float)</Badge>
              <div className="mt-2 text-2xl font-bold text-[var(--gold)]">{usd(pendingSweepCents)}</div>
              <p className="text-xs text-[var(--muted)] mt-1">In the {products[0].sweepDays}–7 day hold window before sweep.</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--panel2)] p-4">
              <Badge tone="brand">3 · Swept to carrier</Badge>
              <div className="mt-2 text-2xl font-bold text-[var(--brand2)]">{usd(premiumCollectedCents - pendingSweepCents)}</div>
              <p className="text-xs text-[var(--muted)] mt-1">Net premium ACH&apos;d to the carrier of record.</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
            <span className="live-dot" /> Stripe → ledger → carrier ACH. Sweep runs nightly per RiskProduct.sweepDays.
          </div>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">Wired next: Stripe Connect ACH sweep + carrier enrollment API.</p>
      </Section>
    </>
  );
}
