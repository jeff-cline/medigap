import { Card, Stat, Badge, Section } from "@/components/ui";
import { db } from "@/lib/db";
import { pnl, getSettings } from "@/lib/logic";
import { usd } from "@/lib/format";

export default async function AccountingPage() {
  const [p, settings, ledger] = await Promise.all([
    pnl(),
    getSettings(),
    db.ledgerEntry.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
  ]);

  const target = settings.arbitrageTarget;

  // Spend by channel comes straight from pnl().byChannel; revenue by category
  // we aggregate across the whole ledger.
  const spendChannels = Object.entries(p.byChannel)
    .filter(([, v]) => v.spend > 0)
    .map(([ch, v]) => [ch, v.spend] as [string, number])
    .sort((a, b) => b[1] - a[1]);

  const allEntries = await db.ledgerEntry.findMany({ where: { type: "revenue" } });
  const revByCategory = new Map<string, number>();
  for (const e of allEntries) {
    const k = e.category || "other";
    revByCategory.set(k, (revByCategory.get(k) ?? 0) + e.amountCents);
  }
  const revCategories = [...revByCategory.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Accounting</h1>
        <p className="text-sm text-[var(--muted)]">Every dollar in and out — a live P&amp;L to the cent. Realized vs unrealized is tracked separately.</p>
      </div>

      <div className={`card mb-6 p-3 text-sm border-l-4 ${p.showUnrealized ? "border-l-[var(--gold)]" : "border-l-[var(--brand)]"}`}>
        {p.showUnrealized ? (
          <span><b className="text-[var(--gold)]">Unrealized ON:</b> house/default-call revenue ({usd(p.revUnrealized)}) is <b>included</b> in totals below. Toggle in <a href="/dashboard/settings" className="text-[var(--brand)]">Settings</a> to recompute realized-only.</span>
        ) : (
          <span><b className="text-[var(--brand)]">Realized-only:</b> {usd(p.revUnrealized)} of unrealized house revenue is <b>excluded</b> from totals (still shown below, flagged).</span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Realized Revenue" value={usd(p.revRealized)} sub="collected / billable" tone="up" />
        <Stat label="Unrealized (House)" value={usd(p.revUnrealized)} sub={p.showUnrealized ? "included in total" : "excluded"} tone="gold" />
        <Stat label="Spend" value={usd(p.spend)} sub="media + ops" tone="down" />
        <Stat label={`Net Profit ${p.showUnrealized ? "(incl. unrealized)" : "(realized)"}`} value={usd(p.profit)} sub={`${p.roi.toFixed(2)}x vs ${target.toFixed(1)}x target`} tone={p.profit >= 0 ? "up" : "down"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Section title="Spend by Channel" desc="Where media dollars go.">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {spendChannels.length === 0 && <p className="text-sm text-[var(--muted)]">No spend recorded.</p>}
            {spendChannels.map(([ch, amt]) => (
              <Card key={ch} className="!p-4">
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{ch}</div>
                <div className="mt-1 text-xl font-bold text-[var(--danger)]">−{usd(amt)}</div>
                <div className="text-xs text-[var(--muted)] mt-1">
                  {p.spend > 0 ? `${((amt / p.spend) * 100).toFixed(0)}% of spend` : "—"}
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Revenue by Category" desc="What earns.">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {revCategories.length === 0 && <p className="text-sm text-[var(--muted)]">No revenue recorded.</p>}
            {revCategories.map(([cat, amt]) => (
              <Card key={cat} className="!p-4">
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{cat}</div>
                <div className="mt-1 text-xl font-bold text-[var(--brand)]">+{usd(amt)}</div>
                <div className="text-xs text-[var(--muted)] mt-1">
                  {p.revenue > 0 ? `${((amt / p.revenue) * 100).toFixed(0)}% of revenue` : "—"}
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </div>

      <Section title="General Ledger" desc="Most recent 40 entries — every movement, signed and categorized.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Channel</th>
                <th>Note</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((l) => (
                <tr key={l.id}>
                  <td className="text-[var(--muted)]">{l.createdAt.toISOString().slice(0, 10)}</td>
                  <td>{l.type === "revenue" ? <Badge tone="up">revenue</Badge> : <Badge tone="down">spend</Badge>}</td>
                  <td>{l.category}{!l.realized && l.type === "revenue" && <span className="ml-1 text-[10px] font-bold text-[var(--gold)]">UNREALIZED</span>}</td>
                  <td className="text-[var(--muted)]">{l.channel || "—"}</td>
                  <td className="text-[var(--muted)] text-sm max-w-[260px] truncate">{l.note || "—"}</td>
                  <td className={`text-right font-medium ${l.type !== "revenue" ? "text-[var(--danger)]" : l.realized ? "text-[var(--brand)]" : "text-[var(--gold)]"}`}>
                    {l.type === "revenue" ? "+" : "−"}{usd(l.amountCents)}
                  </td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-sm text-[var(--muted)]">No ledger entries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-[var(--muted)] mt-2">
          Wired next: double-entry reconciliation + Stripe payout sync via Integrations.
        </p>
      </Section>
    </>
  );
}
