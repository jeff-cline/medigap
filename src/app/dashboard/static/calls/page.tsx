import { redirect } from "next/navigation";
import { getSession, isGod } from "@/lib/auth";
import { staticCallReport, durationBand } from "@/lib/static/report";
import { usd2 } from "@/lib/format";
import { Card, Section } from "@/components/ui";

export const dynamic = "force-dynamic";
const DUR: Record<string, string> = { red: "text-[var(--danger)]", yellow: "text-[var(--gold)]", green: "text-[color:#3fb950]" };

export default async function StaticCallsPage() {
  const session = await getSession();
  if (!isGod(session)) redirect("/dashboard");
  const rows = await staticCallReport();
  return (
    <div className="space-y-6">
      <Section title="Static — Call Reports" action={<a className="text-sm text-[var(--gold)]" href="/dashboard/static">← Money Words</a>}>
        <Card>
          <div className="text-xs text-[var(--muted)] mb-3">Static-engine calls, newest first. Duration: <span className="text-[var(--danger)]">0–30s</span> · <span className="text-[var(--gold)]">31–90s</span> · <span className="text-[color:#3fb950]">91s+</span>.</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[var(--muted)] text-xs uppercase">
                <th className="py-1 pr-3">Time</th><th className="pr-3">Money Word</th><th className="pr-3">State</th><th className="pr-3">To #</th><th className="pr-3">From #</th><th className="pr-3">Landed</th><th className="pr-3">Duration</th><th className="pr-3">Paid</th><th className="pr-3">Cost</th>
              </tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={9} className="py-3 text-[var(--muted)]">No Static calls yet.</td></tr>}
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--border)]">
                    <td className="py-1 pr-3 whitespace-nowrap">{r.createdAt.toLocaleString()}</td>
                    <td className="pr-3">{r.moneyWord || "—"}</td>
                    <td className="pr-3">{r.state || "—"}</td>
                    <td className="pr-3 font-mono">{r.toNumber}</td>
                    <td className="pr-3 font-mono">{r.fromNumber}</td>
                    <td className="pr-3 font-mono">{r.forwardedTo || (r.disposition === "static-nobuyer" ? "no buyer" : "—")}</td>
                    <td className={`pr-3 font-semibold ${DUR[durationBand(r.durationSec)]}`}>{r.durationSec}s</td>
                    <td className="pr-3">{usd2(r.priceCents)}</td>
                    <td className="pr-3 text-[var(--muted)]">{usd2(r.costCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>
    </div>
  );
}
