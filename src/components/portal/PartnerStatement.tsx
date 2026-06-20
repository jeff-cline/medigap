import { Card } from "@/components/ui";
import { usd2 } from "@/lib/format";
import type { Statement } from "@/lib/accounting";

// Read-only itemized statement shown in the partner portal.
export default function PartnerStatement({ statement }: { statement: Statement }) {
  const s = statement;
  const owedToPartner = s.netCents >= 0;
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold">{s.periodLabel} statement</div>
          <div className="text-xs text-[var(--muted)]">Pays on <span className="text-[var(--text)] font-medium">{s.payDate}</span></div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{owedToPartner ? "Net payout to you" : "Net you owe"}</div>
          <div className={`text-xl font-bold ${owedToPartner ? "text-[var(--brand)]" : "text-[var(--danger)]"}`}>{usd2(Math.abs(s.netCents))}</div>
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
          <tr className="border-t border-[var(--border)]">
            <td className="font-semibold">Net {owedToPartner ? "payable to you" : "due"}</td>
            <td className={`text-right font-bold ${owedToPartner ? "text-[var(--brand)]" : "text-[var(--danger)]"}`}>{usd2(Math.abs(s.netCents))}</td>
          </tr>
        </tbody>
      </table>
      <div className="px-4 py-2 text-[11px] text-[var(--muted)]">
        Rev-share is earned on overflow leads we sell from your site. Seat fees and pay-per-call charges are deducted. Final figure settles on the 21st.
      </div>
    </Card>
  );
}
