import nodemailer from "nodemailer";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { getZapConfig, type ZapMailbox } from "@/lib/zapmail";
import { pickEmail, mergeFields, normPhone10, type EmailField } from "@/lib/fire";

const BASE = "https://medigap.plus";
const TICK_MIN = 5; // the cron cadence

export async function perMailboxDailyCap(): Promise<number> {
  const row = await db.setting.findUnique({ where: { key: "firePerMailboxDailyCap" } }).catch(() => null);
  const n = parseInt(row?.value || "30", 10);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

// Warm pool = the Zapmail-provisioned mailboxes with usable SMTP creds.
export async function warmMailboxes(): Promise<ZapMailbox[]> {
  const cfg = await getZapConfig();
  return (cfg?.mailboxes || []).filter((m) => m.smtpUser && m.smtpPass && m.smtpHost);
}

function startOfDay(now: number): Date {
  const d = new Date(now); d.setHours(0, 0, 0, 0); return d;
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
// Is `now` inside the campaign's send window? Fixed UTC-6 (CST), matching the platform clock.
export function inSendWindow(camp: { sendStart: string; sendEnd: string; sendDays: string }, now: number): boolean {
  const shifted = new Date(now - 6 * 3600_000);
  const day = DAY_KEYS[shifted.getUTCDay()];
  const days = (camp.sendDays || "").split(",").map((d) => d.trim().toLowerCase());
  if (!days.includes(day)) return false;
  const minutes = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  const toMin = (s: string) => { const [h, m] = (s || "0:0").split(":").map((x) => parseInt(x, 10) || 0); return h * 60 + m; };
  return minutes >= toMin(camp.sendStart) && minutes < toMin(camp.sendEnd);
}

// Enroll every contact of the campaign's list (resolve the send address). Idempotent.
export async function enrollRecipients(campaignId: string): Promise<number> {
  const camp = await db.emailCampaign.findUnique({ where: { id: campaignId } });
  if (!camp) return 0;
  const existing = await db.campaignRecipient.count({ where: { campaignId } });
  if (existing > 0) return existing;
  const contacts = await db.emailContact.findMany({ where: { listId: camp.listId } });
  let n = 0;
  for (let i = 0; i < contacts.length; i += 500) {
    const chunk = contacts.slice(i, i + 500).map((c) => {
      const email = pickEmail(c, camp.emailField as EmailField);
      return { campaignId, contactId: c.id, email, firstName: c.firstName, status: email ? "pending" : "no_email" };
    });
    const r = await db.campaignRecipient.createMany({ data: chunk });
    n += r.count;
  }
  return n;
}

// Cap-aware round-robin: next mailbox under its daily cap, starting from `startIdx`.
function pickMailbox(pool: ZapMailbox[], used: Record<string, number>, cap: number, startIdx: number): { mb: ZapMailbox; idx: number } | null {
  for (let k = 0; k < pool.length; k++) {
    const i = (startIdx + k) % pool.length;
    const mb = pool[i];
    if ((used[mb.smtpUser] || 0) < cap) return { mb, idx: i + 1 };
  }
  return null;
}

// Send one email via a specific mailbox; log to EmailMessage. Never throws.
async function sendVia(mb: ZapMailbox, to: string, subject: string, text: string, html: string, tracking: boolean, campaignId: string, templateName: string) {
  const openToken = tracking && html ? randomBytes(12).toString("hex") : "";
  const finalHtml = openToken ? `${html}<img src="${BASE}/api/track/open?e=${openToken}" width="1" height="1" alt="" style="display:none"/>` : html;
  const transport = nodemailer.createTransport({ host: mb.smtpHost, port: mb.smtpPort, secure: mb.smtpPort === 465, auth: { user: mb.smtpUser, pass: mb.smtpPass } });
  let ok = false, error = "", messageId = "";
  try {
    const info = await transport.sendMail({ from: mb.smtpUser, to, subject, text: text || undefined, html: finalHtml || undefined });
    ok = true; messageId = info?.messageId || "";
  } catch (e) { error = e instanceof Error ? e.message : "send failed"; }
  await db.emailMessage.create({
    data: { to, subject, body: text, status: ok ? "sent" : "failed", error, batch: campaignId, engine: "zapmail", fromEmail: mb.smtpUser, templateName, openToken, messageId },
  }).catch(() => {});
  return { ok };
}

// One drip tick: send due recipients across running campaigns, respecting per-hour pace,
// warm-mailbox rotation, and the per-mailbox daily cap.
export async function tickCampaigns(now = Date.now()) {
  const cap = await perMailboxDailyCap();
  const pool = await warmMailboxes();
  if (!pool.length) return { ok: true, sent: 0, note: "no warm mailboxes", mailboxes: 0 };

  const grouped = await db.emailMessage.groupBy({ by: ["fromEmail"], where: { engine: "zapmail", createdAt: { gte: startOfDay(now) } }, _count: true });
  const used: Record<string, number> = {};
  for (const g of grouped) used[g.fromEmail] = g._count;
  let capacity = pool.reduce((a, mb) => a + Math.max(0, cap - (used[mb.smtpUser] || 0)), 0);

  let rotate = 0;
  let totalSent = 0;
  const campaigns = await db.emailCampaign.findMany({ where: { status: "running" } });
  for (const camp of campaigns) {
    if (capacity <= 0) break;
    if (!inSendWindow(camp, now)) continue; // only send during the campaign's hours/days
    const sentThisHour = await db.emailMessage.count({ where: { batch: camp.id, createdAt: { gte: new Date(now - 3600_000) } } });
    const hourBudget = Math.max(0, camp.perHour - sentThisHour);
    const tickBudget = Math.max(1, Math.ceil((camp.perHour * TICK_MIN) / 60));
    let budget = Math.min(hourBudget, tickBudget, capacity);
    if (budget <= 0) continue;

    const steps = await db.emailSequenceStep.findMany({ where: { campaignId: camp.id }, orderBy: { order: "asc" } });
    if (!steps.length) continue;
    const due = await db.campaignRecipient.findMany({ where: { campaignId: camp.id, status: { in: ["pending", "in_progress"] }, nextDueAt: { lte: new Date(now) } }, orderBy: { nextDueAt: "asc" }, take: budget });

    for (const r of due) {
      if (capacity <= 0 || budget <= 0) break;
      const step = steps[r.stepIndex];
      if (!step) { await db.campaignRecipient.update({ where: { id: r.id }, data: { status: "done" } }).catch(() => {}); continue; }
      const pick = pickMailbox(pool, used, cap, rotate);
      if (!pick) { capacity = 0; break; }
      rotate = pick.idx;
      const c = await db.emailContact.findUnique({ where: { id: r.contactId } });
      const ctx = { firstName: c?.firstName, lastName: c?.lastName, company: c?.company };
      const res = await sendVia(pick.mb, r.email, mergeFields(step.subject, ctx), mergeFields(step.body, ctx), step.mode === "html" ? mergeFields(step.html, ctx) : "", camp.tracking, camp.id, `${camp.name} · Day ${step.dayOffset + 1}`);
      if (res.ok) {
        used[pick.mb.smtpUser] = (used[pick.mb.smtpUser] || 0) + 1; capacity--; budget--; totalSent++;
        const next = steps[r.stepIndex + 1];
        if (next) {
          const dueAt = r.createdAt.getTime() + next.dayOffset * 86400_000;
          await db.campaignRecipient.update({ where: { id: r.id }, data: { stepIndex: r.stepIndex + 1, status: "in_progress", nextDueAt: new Date(dueAt), lastSentAt: new Date(now) } }).catch(() => {});
        } else {
          await db.campaignRecipient.update({ where: { id: r.id }, data: { status: "done", lastSentAt: new Date(now) } }).catch(() => {});
        }
      } else {
        await db.campaignRecipient.update({ where: { id: r.id }, data: { status: "bounced" } }).catch(() => {});
      }
    }
    const left = await db.campaignRecipient.count({ where: { campaignId: camp.id, status: { in: ["pending", "in_progress"] } } });
    if (left === 0) await db.emailCampaign.update({ where: { id: camp.id }, data: { status: "done" } }).catch(() => {});
  }

  await maybeAlertCapacity(now, pool.length, cap);
  return { ok: true, sent: totalSent, capacityLeft: capacity, mailboxes: pool.length };
}

// Once/day: if due queue across running campaigns exceeds daily capacity, email the founder.
async function maybeAlertCapacity(now: number, mailboxes: number, cap: number) {
  const running = await db.emailCampaign.findMany({ where: { status: "running" }, select: { id: true } });
  if (!running.length) return;
  const pending = await db.campaignRecipient.count({ where: { campaignId: { in: running.map((r) => r.id) }, status: { in: ["pending", "in_progress"] }, nextDueAt: { lte: new Date(now) } } });
  const dailyCapacity = mailboxes * cap;
  if (pending <= dailyCapacity) return;
  const today = new Date(now).toISOString().slice(0, 10);
  const flag = await db.setting.findUnique({ where: { key: "fireCapacityAlert" } }).catch(() => null);
  if (flag?.value === today) return;
  await db.setting.upsert({ where: { key: "fireCapacityAlert" }, update: { value: today }, create: { key: "fireCapacityAlert", value: today } }).catch(() => {});
  const msg = `Fire capacity: ${pending} emails are due but your ${mailboxes} warm mailboxes only cover ${dailyCapacity}/day (${cap}/mailbox). Add mailboxes in Zapmail (zapmail.io) to keep pace.`;
  const { sendEmail } = await import("@/lib/email");
  await sendEmail("jeff.cline@me.com", "Fire: add mailboxes (capacity reached)", `<p>${msg}</p>`, "zapmail", { text: msg }).catch(() => {});
}

// ===== Conversion tracking: match an inbound call to an emailed contact (turn them green) =====
// When a call arrives, if its number matches the phone of anyone we emailed, mark that
// recipient calledBackAt + link the callId (so we can open the voice-AI transcript).
export async function matchFireCallback(fromNumber: string, callId: string): Promise<number> {
  const p = normPhone10(fromNumber);
  if (!p) return 0;
  const contacts = await db.emailContact.findMany({ where: { phones: { contains: p } }, select: { id: true } });
  if (!contacts.length) return 0;
  const recips = await db.campaignRecipient.findMany({
    where: { contactId: { in: contacts.map((c) => c.id) }, lastSentAt: { not: null }, calledBackAt: null },
    select: { id: true },
  });
  for (const r of recips) {
    await db.campaignRecipient.update({ where: { id: r.id }, data: { calledBackAt: new Date(), callId } }).catch(() => {});
  }
  return recips.length;
}

export function matchFireCallbackBackground(fromNumber: string, callId: string) {
  matchFireCallback(fromNumber, callId).catch(() => {});
}
