import { db } from "@/lib/db";
import { pickBuyerFor, captureCallback } from "@/lib/static/routing";
import { normalizePhone } from "@/lib/sms";
import { getSettings } from "@/lib/logic";
import { esc } from "@/lib/voice";
import { sendStaticSms } from "@/lib/static/sms";

const BASE = "https://medigap.plus";
const DEFAULT_TY = "Thanks for calling 1-800-MEDIGAP — America's free help line. We're glad to help; reply here anytime and we'll get right back to you.";

// Look up a tracked inbound number (digits-only, matches Call.toNumber).
export async function trackingFor(toNumberDigits: string) {
  if (!toNumberDigits) return null;
  return db.trackingNumber.findUnique({ where: { number: toNumberDigits } }).catch(() => null);
}

export function tvThankYouBody(tn: { thankYouText?: string }): string {
  return (tn.thankYouText || "").trim() || DEFAULT_TY;
}

// Post-call thank-you from the main number (fire-and-forget; replies thread into Unified).
export function sendTvThankYou(tn: { thankYouText?: string }, toConsumer: string, leadId?: string | null): void {
  const num = normalizePhone(toConsumer) || toConsumer;
  if (!num) return;
  void sendStaticSms({ to: num, body: tvThankYouBody(tn), leadId });
}

// Direct mode: skip the AI, dial the chosen money word's buyer (billed via the static backup phase).
export async function directDialTwiml(callId: string, tn: { moneyWordSlug?: string; billableSeconds?: number }, ctx: { state?: string; from?: string; zip?: string }, voice: string): Promise<string> {
  const mw = tn.moneyWordSlug ? await db.staticMoneyWord.findFirst({ where: { slug: tn.moneyWordSlug } }) : null;
  if (!mw) {
    await db.call.update({ where: { id: callId }, data: { disposition: "tv-direct-nomw" } }).catch(() => {});
    return `<Say voice="${voice}">Thank you for calling 1-800-MEDIGAP. We're sorry, we can't connect you right now. Please call back shortly. Goodbye.</Say><Hangup/>`;
  }
  const res = await pickBuyerFor(mw.id, { state: ctx.state || undefined, zip: ctx.zip || undefined }, Date.now());
  if (!res) {
    await captureCallback({ moneyWordId: mw.id, word: mw.word, state: ctx.state || "", zip: ctx.zip || "", phone: ctx.from || "", note: "tv-direct: no buyer" });
    await db.call.update({ where: { id: callId }, data: { disposition: "static-nobuyer", moneyWord: mw.word } }).catch(() => {});
    return `<Say voice="${voice}">Thank you for calling. We'll follow up with you shortly. Goodbye.</Say><Hangup/>`;
  }
  const s = await getSettings();
  const callerId = normalizePhone(ctx.from || "") || s.raw["tollFreeCallerId"] || "+18006334427";
  const dest = normalizePhone(res.number) || res.number;
  const revenueCents = res.payoutCents > 0 ? res.payoutCents : (mw.valueCents || 0);
  const bill = tn.billableSeconds || res.billableSeconds || 120;
  await db.call.update({ where: { id: callId }, data: { forwardedTo: dest, status: "transferring", disposition: "tv-direct", moneyWord: mw.word, priceCents: 0, realized: false } }).catch(() => {});
  const action = esc(`${BASE}/api/voice/static-step?callId=${callId}&phase=backup&buyer=${res.buyerId}&amt=${revenueCents}&bill=${bill}`);
  return `<Dial timeout="25" callerId="${callerId}" record="record-from-answer-dual" action="${action}"><Number>${dest}</Number></Dial>`;
}
