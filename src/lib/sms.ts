import { db } from "./db";

export type TwilioCfg = { accountSid?: string; authToken?: string; tollFree?: string; messagingSid?: string };

export async function getTwilioCfg(): Promise<TwilioCfg> {
  const row = await db.integration.findUnique({ where: { key: "twilio" } });
  try { return row ? JSON.parse(row.config) : {}; } catch { return {}; }
}

const OPTOUT = " Reply STOP to opt out.";
export function withCompliance(body: string) {
  return /\bstop\b/i.test(body) ? body : body + OPTOUT;
}

// Normalize to E.164-ish (US default). Returns null if it can't.
export function normalizePhone(raw: string): string | null {
  const d = (raw || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d.length >= 11 ? d : null;
  const digits = d.replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return null;
}

type SendArgs = { to: string; body: string; leadId?: string; batch?: string; cfg?: TwilioCfg };

// Sends one SMS via Twilio and logs it. Never throws — always returns a result + logs.
export async function sendSms({ to, body, leadId, batch = "", cfg }: SendArgs) {
  const c = cfg ?? (await getTwilioCfg());
  const e164 = normalizePhone(to);
  const finalBody = withCompliance(body);

  const log = (status: string, twilioSid = "", error = "") =>
    db.smsMessage.create({ data: { to: e164 || to, body: finalBody, status, twilioSid, error, leadId, batch, fromLabel: c.messagingSid || c.tollFree || "" } });

  if (!e164) { await log("failed", "", "Invalid phone number"); return { ok: false, error: "Invalid phone number" }; }
  if (!c.accountSid || !c.authToken) { await log("skipped", "", "Twilio not connected"); return { ok: false, error: "Twilio not connected" }; }
  if (!c.messagingSid && !c.tollFree) { await log("skipped", "", "No sender (Messaging Service SID or Toll-Free) set"); return { ok: false, error: "No sender configured" }; }

  const form = new URLSearchParams({ To: e164, Body: finalBody });
  if (c.messagingSid) form.set("MessagingServiceSid", c.messagingSid);
  else form.set("From", normalizePhone(c.tollFree!) || c.tollFree!);

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${c.accountSid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(`${c.accountSid}:${c.authToken}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(12000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { await log("failed", "", data?.message || `Twilio HTTP ${res.status}`); return { ok: false, error: data?.message || `HTTP ${res.status}` }; }
    await log(data.status || "sent", data.sid || "");
    return { ok: true, sid: data.sid, status: data.status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "network error";
    await log("failed", "", msg);
    return { ok: false, error: msg };
  }
}
