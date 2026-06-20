import { Card, Stat, Section, Badge } from "@/components/ui";
import PayButton from "@/components/PayButton";
import { allPartnerStatements } from "@/lib/accounting";
import { db } from "@/lib/db";
import { usd2, num } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const statements = await allPartnerStatements();

  // Which of these statements have already been paid this cycle (a payout txn dated on/after the pay period end).
  const paidByUser = new Map<string, boolean>();
  for (const s of statements) {
    const existing = await db.transaction.findFirst({
      where: { userId: s.userId, kind: "payout", createdAt: { gte: s.periodEnd } },
    });
    paidByUser.set(s.userId, !!existing);
  }

  const totalPayable = statements.reduce((t, s) => t + (s.netCents > 0 ? s.netCents : 0), 0);
  const totalOwedToUs = statements.reduce((t, s) => t + (s.netCents < 0 ? -s.netCents : 0), 0);
  const payDate = statements[0]?.payDate || "the 21st";
  const period = statements[0]?.periodLabel || "last month";

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Partner Payouts</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          Statements for <b>{period}</b>, settling on <b>{payDate}</b>. Each partner&apos;s rev-share earned, less their
          monthly seat fees and pay-per-call charges, nets to what we pay them (or what they owe). Every figure is
          itemized and mirrored in the partner&apos;s own portal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Stat label="Total Payable" value={usd2(totalPayable)} sub={`to partners on ${payDate}`} tone="gold" />
        <Stat label="Owed Back To Us" value={usd2(totalOwedToUs)} sub="fees exceed earnings" tone="down" />
        <Stat label="Partners With Activity" value={num(statements.length)} sub={period} tone="up" />
      </div>

      <Section title={`${period} statements`} desc="Net payable settles on the 21st. Mark paid once funds are sent.">
        {statements.length ? (
          <div className="space-y-4">
            {statements.map((s) => {
              const owed = s.netCents >= 0;
              const paid = paidByUser.get(s.userId);
              return (
                <Card key={s.userId} className="!p-0 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs text-[var(--muted)]">{s.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{owed ? "Net payout" : "Owes us"}</div>
                        <div className={`text-lg font-bold ${owed ? "text-[var(--brand)]" : "text-[var(--danger)]"}`}>{usd2(Math.abs(s.netCents))}</div>
                      </div>
                      {paid ? <Badge tone="up">paid</Badge> : owed && s.netCents > 0 ? <PayButton userId={s.userId} amountCents={s.netCents} label={`Pay ${usd2(s.netCents)}`} period={s.periodLabel} /> : <Badge tone="default">nothing to pay</Badge>}
                    </div>
                  </div>
                  <table>
                    <tbody>
                      {s.lines.map((l, i) => (
                        <tr key={i}>
                          <td className="text-sm">{l.label}</td>
                          <td className={`text-right font-medium ${l.kind === "credit" ? "text-[var(--brand)]" : "text-[var(--danger)]"}`}>
                            {l.kind === "credit" ? "+" : "−"}{usd2(l.amountCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card><p className="text-sm text-[var(--muted)]">No partner activity for {period} yet.</p></Card>
        )}
      </Section>
    </>
  );
}
