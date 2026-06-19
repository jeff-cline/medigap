import { Card, Stat, Section, Badge } from "@/components/ui";
import DepositForm from "@/components/portal/DepositForm";
import { db } from "@/lib/db";
import { usd } from "@/lib/format";

export default async function InvestorPortal() {
  // Demo: pull the seeded investor. In prod you'd match by session uid.
  const investor = await db.investor.findFirst({ include: { user: true } });

  const deposited = investor?.depositedCents ?? 25000000;
  const deployed = investor?.deployedCents ?? Math.round(deposited * 0.98);
  const profit = investor?.profitCents ?? 4120000;
  const roi = deployed > 0 ? (profit / deployed) * 100 : 0;

  // Profit waterfall (sample math derived from the live figures).
  const mgmtFee = Math.round(deposited * 0.02);
  const yourShare = Math.round(profit * 0.5);
  const futureProof = Math.round(profit * 0.05);

  // Statement (sample line-by-line ledger).
  const statement = [
    { date: "2026-06-01", deployed: 24500000, revenue: 1850000, expenses: 410000, share: 720000 },
    { date: "2026-05-01", deployed: 24500000, revenue: 1620000, expenses: 380000, share: 620000 },
    { date: "2026-04-01", deployed: 24500000, revenue: 1490000, expenses: 360000, share: 565000 },
  ];

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Investor Portal</h1>
          <p className="text-sm text-[var(--muted)]">
            {investor?.user?.name ? `${investor.user.name} · ` : ""}View-only except deposits.
          </p>
        </div>
        <Badge tone={investor?.accredited ? "up" : "down"}>
          {investor?.accredited ? "Accredited" : "Verification pending"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="My Deposit" value={usd(deposited)} sub="total contributed" />
        <Stat label="Deployed" value={usd(deployed)} sub="98% into the pool" tone="up" />
        <Stat label="My Profit" value={usd(profit)} sub="your 50% share basis" tone="gold" />
        <Stat label="ROI" value={`${roi.toFixed(1)}%`} sub="on deployed capital" tone="up" />
      </div>

      <Section title="Profit Waterfall" desc="How each dollar flows from deposit to your payout.">
        <Card>
          <div className="grid gap-3 sm:grid-cols-5 text-sm">
            {[
              ["Deposit", usd(deposited), "default"],
              ["−2% Mgmt fee", `−${usd(mgmtFee)}`, "down"],
              ["Deployed", usd(deployed), "up"],
              ["Profit generated", usd(profit), "gold"],
              ["Your 50% share", usd(yourShare), "up"],
            ].map(([label, val, tone]) => (
              <div key={label} className="rounded-lg bg-[var(--panel2)] border border-[var(--border)] p-3">
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
                <div
                  className={`mt-1 text-lg font-bold ${
                    tone === "down" ? "text-[var(--danger)]" : tone === "gold" ? "text-[var(--gold)]" : tone === "up" ? "text-[var(--brand)]" : "text-[var(--text)]"
                  }`}
                >
                  {val}
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-[var(--muted)] mt-3">
            An additional <span className="font-semibold text-[var(--text)]">5% ({usd(futureProof)})</span> of profit is
            retained for future-proofing the pool (reserves & infrastructure).
          </p>
          <p className="text-xs text-[var(--muted)] mt-2">Wired next: live waterfall computed from LedgerEntry + per-investor attribution.</p>
        </Card>
      </Section>

      <Section title="Deposit Funds" desc="The only write action in this portal.">
        <DepositForm />
      </Section>

      <Section title="Statement" desc="Capital deployed, revenue attributed, expenses, and your 50% share.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th className="text-right">Capital deployed</th>
                <th className="text-right">Revenue attributed</th>
                <th className="text-right">Expenses</th>
                <th className="text-right">Your 50%</th>
              </tr>
            </thead>
            <tbody>
              {statement.map((r) => (
                <tr key={r.date}>
                  <td className="text-[var(--muted)]">{r.date}</td>
                  <td className="text-right">{usd(r.deployed)}</td>
                  <td className="text-right text-[var(--brand)]">{usd(r.revenue)}</td>
                  <td className="text-right text-[var(--danger)]">−{usd(r.expenses)}</td>
                  <td className="text-right font-medium text-[var(--gold)]">{usd(r.share)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">
          Portal is VIEW-ONLY except deposits. Wired next: real statement from LedgerEntry + ACH deposits via Stripe.
        </p>
      </Section>
    </>
  );
}
