import { Card, Stat, Badge, Section, AIButton } from "@/components/ui";
import { getMoneySnapshot, getSetting } from "@/lib/queries";
import { db } from "@/lib/db";
import { usd, pct } from "@/lib/format";

export default async function InvestorsPage() {
  const m = await getMoneySnapshot();
  const [investors, mgmtFeePct, profitSharePct, futureProofingPct, investorPct] = await Promise.all([
    db.investor.findMany({ include: { user: true }, orderBy: { depositedCents: "desc" } }),
    getSetting("mgmtFeePct", "2"),
    getSetting("profitSharePct", "50"),
    getSetting("futureProofingPct", "5"),
    getSetting("investorPct", "100"),
  ]);

  const mgmtFee = parseFloat(mgmtFeePct);
  const profitShare = parseFloat(profitSharePct);
  const futureProofing = parseFloat(futureProofingPct);
  const openAllocation = parseFloat(investorPct);

  const totalDeposited = investors.reduce((s, i) => s + i.depositedCents, 0);
  const totalDeployed = investors.reduce((s, i) => s + i.deployedCents, 0);
  const totalProfit = investors.reduce((s, i) => s + i.profitCents, 0);

  // Profit waterfall sample math on a $10,000 deposit.
  const wfDeposit = 1_000_000; // cents
  const wfMgmt = Math.round(wfDeposit * (mgmtFee / 100));
  const wfDeployed = wfDeposit - wfMgmt;
  const wfGross = Math.round(wfDeployed * 0.9); // ~3x arbitrage net of media → illustrative gross profit
  const wfExpenses = Math.round(wfGross * 0.2);
  const wfAfterExp = wfGross - wfExpenses;
  const wfFutureProof = Math.round(wfAfterExp * (futureProofing / 100));
  const wfDistributable = wfAfterExp - wfFutureProof;
  const wfInvestor = Math.round(wfDistributable * (profitShare / 100));

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Investors</h1>
          <p className="text-sm text-[var(--muted)] max-w-3xl">
            Accredited investors deposit capital. We take a {mgmtFee}% management fee off the top, then deploy
            their capital as the <span className="text-[var(--text)]">next money spent in line</span> on media.
            Investors earn {profitShare}% of profit (less expenses); a {futureProofing}% future-proofing bucket is
            reserved to keep the engine ahead of the market.
          </p>
        </div>
        <AIButton label="Forecast returns" />
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Total Deposited" value={usd(totalDeposited)} sub={`${investors.length} investor${investors.length === 1 ? "" : "s"}`} tone="gold" />
        <Stat label="Capital Deployed" value={usd(totalDeployed)} sub="live as next-in-line media spend" tone="up" />
        <Stat label="Investor Profit Paid" value={usd(totalProfit)} sub={`${profitShare}% profit share`} tone="up" />
        <Stat label="Open Allocation" value={pct(openAllocation)} sub="capacity available to fund" tone="default" />
      </div>

      <Section
        title="Cap Table"
        desc="Every funded investor, accreditation status, and realized ROI."
        action={<span className="text-xs text-[var(--muted)]">Network profit pool: {usd(m.profit)}</span>}
      >
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Investor</th>
                <th>Status</th>
                <th className="text-right">Deposited</th>
                <th className="text-right">Deployed</th>
                <th className="text-right">Profit</th>
                <th className="text-right">ROI</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((i) => {
                const roi = i.depositedCents > 0 ? (i.profitCents / i.depositedCents) * 100 : 0;
                return (
                  <tr key={i.id}>
                    <td>
                      <div className="font-medium">{i.user.name || "—"}</div>
                      <div className="text-xs text-[var(--muted)]">{i.user.email}</div>
                    </td>
                    <td>{i.accredited ? <Badge tone="up">accredited</Badge> : <Badge tone="down">unverified</Badge>}</td>
                    <td className="text-right font-medium">{usd(i.depositedCents)}</td>
                    <td className="text-right">{usd(i.deployedCents)}</td>
                    <td className="text-right text-[var(--brand)]">{usd(i.profitCents)}</td>
                    <td className="text-right text-[var(--gold)] font-medium">{pct(roi)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">
          Accredited-investor validation is required before any capital is funded or deployed. Wired next: KYC /
          accreditation verification + signed subscription docs via Integrations.
        </p>
      </Section>

      <Section title="Profit Waterfall" desc="How a $10,000 deposit flows through the model (illustrative).">
        <Card>
          <div className="space-y-0 divide-y divide-[var(--border)]">
            {[
              ["Investor deposit", usd(wfDeposit), "default", "Capital committed"],
              [`Management fee (−${mgmtFee}%)`, `−${usd(wfMgmt)}`, "down", "Off the top"],
              ["Capital deployed", usd(wfDeployed), "up", "Next money spent in line on media"],
              ["Gross profit", `+${usd(wfGross)}`, "up", "Arbitrage return on deployed capital"],
              ["Operating expenses (−20%)", `−${usd(wfExpenses)}`, "down", "Platform + media ops"],
              [`Future-proofing bucket (−${futureProofing}%)`, `−${usd(wfFutureProof)}`, "down", "Reinvest to stay ahead"],
              ["Distributable profit", usd(wfDistributable), "default", "Pool split with platform"],
              [`Investor share (${profitShare}%)`, `+${usd(wfInvestor)}`, "gold", "Paid to investor"],
            ].map(([label, amt, tone, sub]) => (
              <div key={label as string} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-[var(--muted)]">{sub}</div>
                </div>
                <div
                  className={`text-lg font-bold ${
                    tone === "down"
                      ? "text-[var(--danger)]"
                      : tone === "up"
                      ? "text-[var(--brand)]"
                      : tone === "gold"
                      ? "text-[var(--gold)]"
                      : "text-[var(--text)]"
                  }`}
                >
                  {amt}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">
          Wired next: per-investor live waterfall computed from actual deployed-capital attribution in the ledger.
        </p>
      </Section>
    </>
  );
}
