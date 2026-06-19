import { Card, Stat, Section, Badge } from "@/components/ui";
import DepositForm from "@/components/portal/DepositForm";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { waterfall, getSettings } from "@/lib/logic";
import { usd } from "@/lib/format";

const KIND_TONE: Record<string, "default" | "up" | "down" | "gold" | "brand"> = {
  deposit: "up",
  topup: "up",
  payout: "gold",
  charge: "down",
  fee: "down",
  sweep: "brand",
};

export default async function InvestorPortal() {
  const session = await getSession();
  const settings = await getSettings();

  // Load this user's investor row; fall back to the seeded demo so the page is
  // always populated.
  let investor = session
    ? await db.investor.findFirst({ where: { userId: session.uid }, include: { user: true } })
    : null;
  const usingFallback = !investor;
  if (!investor) {
    investor = await db.investor.findFirst({ include: { user: true }, orderBy: { depositedCents: "desc" } });
  }

  const deposited = investor?.depositedCents ?? 0;
  const deployed = investor?.deployedCents ?? 0;
  const profit = investor?.profitCents ?? 0;
  const roi = deployed > 0 ? (profit / deployed) * 100 : 0;

  const wf = waterfall({
    depositCents: deposited,
    grossProfitCents: profit,
    mgmtFeePct: settings.mgmtFeePct,
    profitSharePct: settings.profitSharePct,
    futureProofingPct: settings.futureProofingPct,
    aiFeePct: settings.aiFeePct,
  });

  // Live statement from this user's transactions.
  const transactions =
    session && !usingFallback
      ? await db.transaction.findMany({ where: { userId: session.uid }, orderBy: { createdAt: "desc" }, take: 40 })
      : [];

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Investor Portal</h1>
          <p className="text-sm text-[var(--muted)]">
            {investor?.user?.name ? `${investor.user.name} · ` : ""}VIEW-ONLY except deposits.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a href="/investor/pitch" className="btn btn-brand text-sm !py-1.5">📊 View the pitch deck</a>
          <Badge tone={investor?.accredited ? "up" : "down"}>
            {investor?.accredited ? "Accredited" : "Verification pending"}
          </Badge>
        </div>
      </div>

      {usingFallback && (
        <Card className="!p-3 mb-6 border-[var(--gold)]/40 !border">
          <p className="text-xs text-[var(--gold)]">
            You have no investor account yet — showing the demo investor for illustration. Make a deposit below to open
            your own position.
          </p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="My Deposit" value={usd(deposited)} sub="total contributed" />
        <Stat label="Deployed" value={usd(deployed)} sub={`${(100 - settings.mgmtFeePct).toFixed(0)}% into the pool`} tone="up" />
        <Stat label="My Profit" value={usd(profit)} sub={`your ${settings.profitSharePct}% share basis`} tone="gold" />
        <Stat label="ROI" value={`${roi.toFixed(1)}%`} sub="on deployed capital" tone="up" />
      </div>

      <Section title="Profit Waterfall" desc="How each dollar flows from deposit to your payout.">
        <Card>
          <div className="grid gap-3 sm:grid-cols-5 text-sm">
            {(
              [
                ["Deposit", usd(deposited), "default"],
                [`−${settings.mgmtFeePct}% Mgmt fee`, `−${usd(wf.mgmtFee)}`, "down"],
                ["Deployed", usd(wf.deployed), "up"],
                ["Profit generated", usd(profit), "gold"],
                [`Your ${settings.profitSharePct}% share`, usd(wf.investorShare), "up"],
              ] as [string, string, string][]
            ).map(([label, val, tone]) => (
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
            An additional <span className="font-semibold text-[var(--text)]">{settings.futureProofingPct}% ({usd(wf.futureProofing)})</span> of profit
            is retained for future-proofing the pool (reserves &amp; infrastructure).
          </p>
        </Card>
      </Section>

      <Section title="Deposit Funds" desc="The only write action in this portal.">
        <DepositForm mgmtFeePct={settings.mgmtFeePct} />
      </Section>

      <Section title="Statement" desc="Your money movements — deposits, fees, payouts.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Kind</th>
                <th>Note</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="text-[var(--muted)]">{t.createdAt.toISOString().slice(0, 10)}</td>
                  <td><Badge tone={KIND_TONE[t.kind] ?? "default"}>{t.kind}</Badge></td>
                  <td className="text-[var(--muted)] text-sm max-w-[280px] truncate">{t.note || "—"}</td>
                  <td className={`text-right font-medium ${t.kind === "fee" || t.kind === "charge" ? "text-[var(--danger)]" : "text-[var(--brand)]"}`}>
                    {t.kind === "fee" || t.kind === "charge" ? "−" : "+"}{usd(t.amountCents)}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-sm text-[var(--muted)]">
                    {usingFallback ? "Open a position with a deposit to start your statement." : "No transactions yet — make your first deposit above."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">
          Accredited-investor validation is required before any capital is funded or deployed. Portal is VIEW-ONLY except
          deposits. ACH via Stripe wired next.
        </p>
      </Section>
    </>
  );
}
