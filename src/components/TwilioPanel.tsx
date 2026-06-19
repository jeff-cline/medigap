import { db } from "@/lib/db";
import { Card, Badge } from "@/components/ui";

// Live Twilio account view — pulls balance, numbers + their webhooks, and recent call logs
// straight from Twilio using the saved credentials ("logs in" each render).
const OUR_VOICE = "https://medigap.plus/api/calls/inbound";

async function tw(path: string, sid: string, token: string) {
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}${path}`, {
    headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64") },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  return r.ok ? r.json() : null;
}

export default async function TwilioPanel() {
  const row = await db.integration.findUnique({ where: { key: "twilio" } });
  let cfg: Record<string, string> = {};
  try { cfg = row ? JSON.parse(row.config) : {}; } catch {}
  if (!cfg.accountSid || !cfg.authToken) {
    return <Card><div className="text-sm text-[var(--muted)]">Connect Twilio on the Integrations page to see your live phone data here.</div></Card>;
  }
  const sid = cfg.accountSid, token = cfg.authToken;
  const [bal, nums, calls] = await Promise.all([
    tw("/Balance.json", sid, token),
    tw("/IncomingPhoneNumbers.json?PageSize=50", sid, token),
    tw("/Calls.json?PageSize=10", sid, token),
  ]);
  const numbers = nums?.incoming_phone_numbers ?? [];
  const ours = numbers.filter((n: { voice_url?: string }) => (n.voice_url || "").includes("medigap.plus"));
  const recentCalls = calls?.calls ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Twilio Balance</div>
        <div className="mt-1 text-3xl font-bold text-[var(--brand)]">{bal ? `$${parseFloat(bal.balance).toFixed(2)}` : "—"}</div>
        <div className="text-xs text-[var(--muted)] mt-1">{numbers.length} numbers · {ours.length} routed to medigap.plus</div>
        <a href="https://www.twilio.com/en-us/voice/pricing" target="_blank" rel="noopener" className="text-xs text-[var(--brand2)] mt-2 inline-block">Voice pricing ↗</a>
      </Card>

      <Card className="lg:col-span-2 !p-0 overflow-hidden">
        <div className="px-4 pt-3 text-xs uppercase tracking-wide text-[var(--muted)]">Numbers &amp; Webhooks</div>
        <table className="mt-2">
          <thead><tr><th>Number</th><th>Name</th><th>Voice routes to</th></tr></thead>
          <tbody>
            {numbers.slice(0, 6).map((n: { sid: string; phone_number: string; friendly_name: string; voice_url?: string }) => {
              const mine = (n.voice_url || "").includes("medigap.plus");
              return (
                <tr key={n.sid}>
                  <td className="font-medium">{n.phone_number}</td>
                  <td className="text-[var(--muted)]">{n.friendly_name}</td>
                  <td>{mine ? <Badge tone="up">medigap.plus</Badge> : <span className="text-xs text-[var(--muted)]">{(n.voice_url || "—").replace(/^https?:\/\//, "").slice(0, 32)}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card className="lg:col-span-3 !p-0 overflow-hidden">
        <div className="px-4 pt-3 text-xs uppercase tracking-wide text-[var(--muted)]">Recent Twilio Calls (raw, all numbers)</div>
        <table className="mt-2">
          <thead><tr><th>Started</th><th>From</th><th>To</th><th>Status</th><th className="text-right">Sec</th><th className="text-right">Price</th></tr></thead>
          <tbody>
            {recentCalls.length === 0 && <tr><td colSpan={6} className="text-center text-[var(--muted)] py-4">No calls in Twilio yet.</td></tr>}
            {recentCalls.map((c: { sid: string; start_time: string; from: string; to: string; status: string; duration: string; price: string | null }) => (
              <tr key={c.sid}>
                <td className="text-[var(--muted)] text-xs">{c.start_time?.slice(5, 22)}</td>
                <td>{c.from}</td>
                <td>{c.to}</td>
                <td><Badge tone={c.status === "completed" ? "up" : c.status === "no-answer" || c.status === "failed" ? "down" : "default"}>{c.status}</Badge></td>
                <td className="text-right">{c.duration}</td>
                <td className="text-right text-[var(--muted)]">{c.price ? `$${Math.abs(parseFloat(c.price)).toFixed(3)}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
