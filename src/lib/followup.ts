import { db } from "@/lib/db";
import { sendSms, normalizePhone } from "@/lib/sms";
import { fmtPhone } from "@/lib/format";

// Auto follow-up texts for missed / unbilled U65 callers. Scheduled for 10:00 CST the next
// business day, sent by the cron tick, and surfaced on the Follow-Up dashboard.

// The number the caller originally dialed (decoded from U65Call.source).
export function calledNumberFromSource(source: string): string {
  if (source === "direct_220") return "+13462203471";
  const m = /^direct_(\d{10})$/.exec(source || "");
  if (m) return "+1" + m[1];
  return "+18006334427"; // AI / main 1-800-MEDIGAP line
}

// 10:00 CST (UTC-6) on the NEXT business day after nowMs.
export function computeFollowupDueMs(nowMs: number): number {
  const wall = new Date(nowMs - 6 * 3600_000); // UTC fields now read as CST wall-clock
  let d = new Date(Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate() + 1, 10, 0, 0));
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d = new Date(d.getTime() + 86400_000); // skip Sat/Sun
  return d.getTime() + 6 * 3600_000; // CST wall-clock back to real UTC
}

export function followupBody(calledDisplay: string): string {
  return `1-800-MEDIGAP: Sorry we missed you — please call ${calledDisplay}, M–F 9–6. We appreciate the opportunity to serve you.`;
}

// Schedule a follow-up for a missed caller. Idempotent: skips if one is already scheduled for
// that number, or the lead has opted out. Returns true if a new one was created.
export async function scheduleFollowup(opts: { leadId?: string | null; callId?: string | null; toNumber: string; source: string; callerName?: string; state?: string }): Promise<boolean> {
  const to = normalizePhone(opts.toNumber) || "";
  if ((to.replace(/\D/g, "").length) < 11) return false;
  if (opts.leadId) {
    const lead = await db.lead.findUnique({ where: { id: opts.leadId }, select: { smsOptOut: true } }).catch(() => null);
    if (lead?.smsOptOut) return false;
  }
  const existing = await db.followupText.findFirst({ where: { toNumber: to, status: "scheduled" } }).catch(() => null);
  if (existing) return false;
  const called = calledNumberFromSource(opts.source);
  await db.followupText.create({
    data: {
      leadId: opts.leadId || null, callId: opts.callId || null, toNumber: to, calledNumber: called,
      callerName: opts.callerName || "", state: opts.state || "",
      body: followupBody(fmtPhone(called)), sendAt: new Date(computeFollowupDueMs(Date.now())),
    },
  }).catch(() => {});
  return true;
}

// Send every due follow-up (called by the cron tick). Never throws.
export async function sendDueFollowups(): Promise<{ sent: number; failed: number; skipped: number }> {
  const due = await db.followupText.findMany({ where: { status: "scheduled", sendAt: { lte: new Date() } }, take: 200, orderBy: { sendAt: "asc" } }).catch(() => []);
  let sent = 0, failed = 0, skipped = 0;
  for (const f of due) {
    if (f.leadId) {
      const lead = await db.lead.findUnique({ where: { id: f.leadId }, select: { smsOptOut: true } }).catch(() => null);
      if (lead?.smsOptOut) { await db.followupText.update({ where: { id: f.id }, data: { status: "skipped", sentAt: new Date() } }).catch(() => {}); skipped++; continue; }
    }
    const res = await sendSms({ to: f.toNumber, body: f.body, leadId: f.leadId || undefined, batch: "u65-followup" }).catch(() => ({ ok: false, sid: "" as string | undefined }));
    if (res.ok) { await db.followupText.update({ where: { id: f.id }, data: { status: "sent", sentAt: new Date(), smsId: res.sid || "" } }).catch(() => {}); sent++; }
    else { await db.followupText.update({ where: { id: f.id }, data: { status: "failed", sentAt: new Date() } }).catch(() => {}); failed++; }
  }
  return { sent, failed, skipped };
}
