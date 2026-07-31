import { sendSms, getTwilioCfg } from "@/lib/sms";

// Send an SMS from the 1-800-MEDIGAP main number (so replies thread into the unified inbox).
// Never throws into the call flow.
export async function sendStaticSms({
  to,
  body,
  leadId,
}: {
  to: string;
  body: string;
  leadId?: string | null;
}): Promise<{ ok: boolean }> {
  try {
    const base = await getTwilioCfg();
    const cfg = { ...base, messagingSid: "", tollFree: base.tollFree || "+18006334427" };
    const r = await sendSms({ to, body, leadId: leadId ?? undefined, cfg });
    return { ok: !!r?.ok };
  } catch {
    return { ok: false };
  }
}
