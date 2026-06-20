import Link from "next/link";
import { Card, Stat, Badge, Section } from "@/components/ui";
import PhoneLink from "@/components/PhoneLink";
import AppendButton from "@/components/AppendButton";
import { db } from "@/lib/db";
import { num, cst, mmss, usd2 } from "@/lib/format";

export const dynamic = "force-dynamic";

// Pull Twilio's actual per-call cost for our missed calls (by CallSid).
async function twilioPrices(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const row = await db.integration.findUnique({ where: { key: "twilio" } });
  let c: Record<string, string> = {};
  try { c = row ? JSON.parse(row.config) : {}; } catch {}
  if (!c.accountSid || !c.authToken) return map;
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${c.accountSid}/Calls.json?PageSize=200`, {
      headers: { Authorization: "Basic " + Buffer.from(`${c.accountSid}:${c.authToken}`).toString("base64") },
      cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (r.ok) { const d = await r.json(); for (const call of d.calls || []) if (call.price) map.set(call.sid, Math.abs(parseFloat(call.price))); }
  } catch {}
  return map;
}

export default async function MissedCallsPage() {
  const calls = await db.call.findMany({
    where: { OR: [{ status: { in: ["missed", "no-answer", "busy", "failed"] } }, { durationSec: { lt: 20 } }] },
    orderBy: { createdAt: "desc" }, take: 100, include: { lead: true },
  });
  const prices = await twilioPrices();

  const total = calls.length;
  const twilioCost = calls.reduce((s, c) => s + (prices.get(c.providerSid) || 0), 0);
  const noLeadInfo = calls.filter((c) => !c.lead?.name || c.lead.name === "Inbound caller").length;

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Missed Calls</h1>
          <p className="text-sm text-[var(--muted)] max-w-3xl">Calls that hit Twilio but didn&apos;t connect to a buyer (no-answer, busy, dropped, or too short). Append the number to recover the lead, then reach out from the Communications portal.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Missed Calls" value={num(total)} sub="last 100" tone="down" />
        <Stat label="Twilio Cost (these)" value={`$${twilioCost.toFixed(2)}`} sub="what they cost you" tone="gold" />
        <Stat label="Need Enrichment" value={num(noLeadInfo)} sub="no name yet → append" tone="default" />
        <Stat label="Recoverable" value={num(total - noLeadInfo)} sub="have contact data" tone="up" />
      </div>

      <Section title="Missed Inbound" desc="Click a number to drill into the caller; Append to enrich via PredictiveData.">
        <Card className="!p-0 overflow-hidden">
          <table>
            <thead><tr><th>Time (CT)</th><th>Number</th><th>Zip / State</th><th>Status</th><th className="text-right">Sec</th><th className="text-right">Twilio $</th><th>Caller</th><th className="text-right">Enrich</th></tr></thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.id}>
                  <td className="text-[var(--muted)] text-sm whitespace-nowrap">{cst(c.createdAt)}</td>
                  <td><PhoneLink phone={c.fromNumber} /></td>
                  <td className="text-[var(--muted)]">{[c.zip, c.state].filter(Boolean).join(" · ") || "—"}</td>
                  <td><Badge tone={["missed", "no-answer", "busy", "failed"].includes(c.status) ? "down" : "default"}>{c.status}</Badge></td>
                  <td className="text-right">{mmss(c.durationSec)}</td>
                  <td className="text-right text-[var(--muted)]">{prices.get(c.providerSid) ? `$${prices.get(c.providerSid)!.toFixed(3)}` : "—"}</td>
                  <td className="text-sm">{c.lead ? <Link href={`/dashboard/leads/${c.lead.id}`} className="text-[var(--brand)] hover:underline">{c.lead.name || "Unknown"}</Link> : "—"}</td>
                  <td className="text-right">{c.lead ? <AppendButton leadId={c.lead.id} /> : "—"}</td>
                </tr>
              ))}
              {calls.length === 0 && <tr><td colSpan={8} className="text-center text-[var(--muted)] py-8">No missed calls. 🎉</td></tr>}
            </tbody>
          </table>
        </Card>
      </Section>
      <p className="text-xs text-[var(--muted)]">Reach these callers in bulk from <Link href="/dashboard/sms" className="text-[var(--brand)]">SMS Outreach</Link> (a full Communications portal with email + segments is coming next).</p>
    </>
  );
}
