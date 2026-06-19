import { Card, Stat, Badge, Section, AIButton } from "@/components/ui";
import { db } from "@/lib/db";
import { waterfall, pnl, getSettings } from "@/lib/logic";
import { usd, pct } from "@/lib/format";

export default async function InvestorsPage() {
  const [investors, settings, p] = await Promise.all([
    db.investor.findMany({ include: { user: true }, orderBy: { depositedCents: "desc" } }),
    getSettings(),
    pnl(),
  ]);

  const totalDeposited = investors.reduce((s, i) => s + i.depositedCents, 0);
  const totalDeployed = investors.reduce((s, i) => s + i.deployedCents, 0);
  const totalProfit = investors.reduce((s, i) => s + i.profitCents, 0);

  // Representative gross profit for the waterfall: prefer live network profit,
  // fall back to total investor profit so the card is always populated.
  const grossProfitCents = p.profit > 0 ? p.profit : totalProfit;
  const wf = waterfall({
    depositCents: totalDeposited,
    grossProfitCents,
    mgmtFeePct: settings.mgmtFeePct,
    profitSharePct: settings.profitSharePct,
    futureProofingPct: settings.futureProofingPct,
    aiFeePct: settings.aiFeePct,
    expenseCents: p.spend,
  });

  const steps: [string, string, "default" | "up" | "down" | "gold", string][] = [
    ["Investor deposit", usd(totalDeposited), "default", "Total capital committed"],
    [`Management fee (−${settings.mgmtFeePct}%)`, `−${usd(wf.mgmtFee)}`, "down", "Off the top"],
    ["Capital deployed", usd(wf.deployed), "up", "Next money spent in line on media"],
    ["Gross profit", `+${usd(grossProfitCents)}`, "up", p.profit > 0 ? "Live network profit" : "Investor profit basis"],
    ["Operating expenses", `−${usd(wf.expenses)}`, "down", "Media + platform spend"],
    [`AI fee (−${settings.aiFeePct}%)`, `−${usd(wf.aiFee)}`, "down", "Autonomous engine fee"],
    [`Future-proofing (−${settings.futureProofingPct}%)`, `−${usd(wf.futureProofing)}`, "down", "Reinvest to stay ahead"],
    ["Distributable profit", usd(wf.distributable), "default", "Pool split with the house"],
    [`Investor share (${settings.profitSharePct}%)`, `+${usd(wf.investorShare)}`, "gold", "Paid to investors"],
    [`House share (${100 - settings.profitSharePct}%)`, `+${usd(wf.houseShare)}`, "up", "Retained by the platform"],
  ];

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Investors</h1>
          <p className="text-sm text-[var(--muted)] max-w-3xl">
            Accredited investors deposit capital. We take a {settings.mgmtFeePct}% management fee off the top, then deploy
            their capital as the <span className="text-[var(--text)]">next money spent in line</span> on media. Investors
            earn {settings.profitSharePct}% of distributable profit; a {settings.futureProofingPct}% future-proofing bucket
            keeps the engine ahead of the market.
          </p>
        </div>
        <AIButton label="Forecast returns" />
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Total Deposited" value={usd(totalDeposited)} sub={`${investors.length} investor${investors.length === 1 ? "" : "s"}`} tone="gold" />
        <Stat label="Capital Deployed" value={usd(totalDeployed)} sub="live as next-in-line media spend" tone="up" />
        <Stat label="Investor Profit Paid" value={usd(totalProfit)} sub={`${settings.profitSharePct}% profit share`} tone="up" />
        <Stat label="Open Allocation" value={pct(settings.investorPct)} sub="capacity available to fund" tone="default" />
      </div>

      <Section
        title="Cap Table"
        desc="Every funded investor, accreditation status, and realized ROI."
        action={<span className="text-xs text-[var(--muted)]">Network profit pool: {usd(p.profit)}</span>}
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
                const roi = i.deployedCents > 0 ? (i.profitCents / i.deployedCents) * 100 : 0;
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
              {investors.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-sm text-[var(--muted)]">No funded investors yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">
          Accredited-investor validation is required before any capital is funded or deployed. ROI is profit over
          deployed capital. Deployed capital is the <span className="text-[var(--text)]">next money in line</span> on media.
        </p>
      </Section>

      <Section title="Profit Waterfall" desc="How total deposited capital flows through the live model, deposit to payout.">
        <Card>
          <div className="space-y-0 divide-y divide-[var(--border)]">
            {steps.map(([label, amt, tone, sub]) => (
              <div key={label} className="flex items-center justify-between py-3">
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
          Computed via the shared <code className="text-[var(--brand)]">waterfall()</code> model using current settings,
          {p.profit > 0 ? " live network profit," : " realized investor profit,"} and ledger expenses.
        </p>
      </Section>
    </>
  );
}
