import { db } from "@/lib/db";
import { getTwilioCfg } from "@/lib/sms";
import { Stat, Badge, Section } from "@/components/ui";
import { num } from "@/lib/format";
import SmsComposer from "@/components/SmsComposer";

export const dynamic = "force-dynamic";

export default async function SmsPage() {
  const cfg = await getTwilioCfg();
  const twilioReady = !!(cfg.accountSid && cfg.authToken && (cfg.messagingSid || cfg.tollFree));
  const senderLabel = cfg.messagingSid ? `Messaging Service ${cfg.messagingSid.slice(0, 8)}…` : cfg.tollFree || "";

  const [withPhone, optedOut, outbound, inbound, recent] = await Promise.all([
    db.lead.count({ where: { phone: { not: "" } } }),
    db.lead.count({ where: { smsOptOut: true } }),
    db.smsMessage.count({ where: { direction: "outbound" } }),
    db.smsMessage.count({ where: { direction: "inbound" } }),
    db.smsMessage.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  const tone: Record<string, "up" | "down" | "gold" | "default" | "brand"> = {
    sent: "up", delivered: "up", queued: "gold", failed: "down", skipped: "down", received: "brand",
  };

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">SMS Outreach</h1>
          <p className="text-sm text-[var(--muted)]">Callback reminders, bulk texts to your past numbers, and test batches — all through your Twilio toll-free.</p>
        </div>
        <Badge tone={twilioReady ? "up" : "down"}>{twilioReady ? "Twilio sender ready" : "Twilio not connected"}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Textable Numbers" value={num(withPhone)} sub="leads with a phone" />
        <Stat label="Opted Out" value={num(optedOut)} sub="STOP — auto-excluded" tone={optedOut ? "down" : "default"} />
        <Stat label="Texts Sent" value={num(outbound)} sub="outbound total" tone="up" />
        <Stat label="Replies In" value={num(inbound)} sub="inbound received" tone="gold" />
      </div>

      <Section title="Send" desc="Target an audience, send a small test batch first, then send to all. Opt-outs and missing numbers are skipped automatically.">
        <SmsComposer twilioReady={twilioReady} senderLabel={senderLabel} />
      </Section>

      <Section title="Send Log" desc="Live delivery status from Twilio. Inbound STOP/START is handled automatically.">
        <div className="card !p-0 overflow-hidden">
          <table>
            <thead><tr><th>When</th><th>Dir</th><th>To / From</th><th>Message</th><th>Status</th><th>Batch</th></tr></thead>
            <tbody>
              {recent.length === 0 && <tr><td colSpan={6} className="text-[var(--muted)] text-center py-6">No messages yet. Send a test batch above.</td></tr>}
              {recent.map((m) => (
                <tr key={m.id}>
                  <td className="text-[var(--muted)] whitespace-nowrap">{m.createdAt.toISOString().slice(5, 16).replace("T", " ")}</td>
                  <td>{m.direction === "inbound" ? "↓ in" : "↑ out"}</td>
                  <td className="whitespace-nowrap">{m.to}</td>
                  <td className="max-w-[320px] truncate text-[var(--muted)]">{m.body}</td>
                  <td><Badge tone={tone[m.status] || "default"}>{m.status}</Badge>{m.error && <span className="block text-[10px] text-[var(--danger)]">{m.error}</span>}</td>
                  <td className="text-[var(--muted)] text-xs">{m.batch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <p className="text-xs text-[var(--muted)]">Inbound webhook: point Twilio (Messaging → your number/service → “A message comes in”) to <code className="text-[var(--brand2)]">https://medigap.plus/api/sms/inbound</code> so STOP/START opt-outs are honored automatically.</p>
    </>
  );
}
