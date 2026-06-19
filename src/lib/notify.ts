import { db } from "./db";
import { sendSms } from "./sms";

const LOGIN_URL = "https://medigap.plus/login";

// Notify a partner/agent that a lead was routed to them: SMS now (Twilio), email when a
// sender is connected. Body intentionally minimal (name + login link) — full data is behind login.
export async function notifyPartnerNewLead(agentId: string, leadName: string) {
  const agent = await db.user.findUnique({ where: { id: agentId } });
  if (!agent) return;
  const text = `Medigap.plus: you have a new lead — ${leadName}. Log in to see all the details: ${LOGIN_URL}`;

  if (agent.phone) {
    await sendSms({ to: agent.phone, body: text, batch: "lead-alert" }).catch(() => {});
  }
  if (agent.email) {
    await sendPartnerEmail(agent.email, "You have a new lead on Medigap.plus", text).catch(() => {});
  }
}

// Best-effort transactional email. Uses a connected sender (Klaviyo) if available; otherwise
// records the intent and returns false (so we never block the routing flow).
export async function sendPartnerEmail(to: string, subject: string, body: string): Promise<boolean> {
  const row = await db.integration.findUnique({ where: { key: "klaviyo" } }).catch(() => null);
  let cfg: Record<string, string> = {};
  try { cfg = row ? JSON.parse(row.config) : {}; } catch {}
  if (!cfg.privateKey) return false; // no sender connected yet
  try {
    // Klaviyo "Send to a profile" style transactional via events; requires a flow on their side.
    const res = await fetch("https://a.klaviyo.com/api/events/", {
      method: "POST",
      headers: { Authorization: `Klaviyo-API-Key ${cfg.privateKey}`, revision: "2024-10-15", "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ data: { type: "event", attributes: { metric: { data: { type: "metric", attributes: { name: "New Lead Assigned" } } }, properties: { subject, body }, profile: { data: { type: "profile", attributes: { email: to } } } } } }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch { return false; }
}
