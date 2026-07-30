import { Buffer } from "buffer";
import { db } from "@/lib/db";

// VoiceDrip engine: schedules a ringless-style voicemail drop off each emailed recipient,
// places it via Twilio AMD (only ever leaves a voicemail, never talks to a human), and
// reconciles the REAL Twilio cost into the reports. Callbacks route via the number's
// voice webhook -> /api/u65/direct -> U65 SET number + Fire conversion (teal + $75).

const BASE = "https://medigap.plus";

export type VoiceDripConfig = {
  enabled: boolean;
  fromNumber: string;
  schedule: "immediate" | "next_business_day" | "plus_days";
  sendTimeCst: string;   // "HH:MM" CST wall-clock the drop fires at
  offsetDays: number;    // used when schedule = plus_days
  perTick: number;       // pace: max drops placed per 5-min tick
  windowStartCst: string;
  windowEndCst: string;
  days: string;          // csv: mon,tue,...
  speechEndThreshold: number; // Twilio AMD: ms of silence after greeting before we play
};

const DEFAULT_CFG: VoiceDripConfig = {
  enabled: false,
  fromNumber: "+14698139349",
  schedule: "next_business_day",
  sendTimeCst: "11:00",
  offsetDays: 1,
  perTick: 5,
  windowStartCst: "09:00",
  windowEndCst: "17:00",
  days: "mon,tue,wed,thu,fri",
  speechEndThreshold: 500,
};

function safeJson(s: string): Partial<VoiceDripConfig> {
  try { return JSON.parse(s) as Partial<VoiceDripConfig>; } catch { return {}; }
}

export async function getVoiceDripConfig(): Promise<VoiceDripConfig> {
  const row = await db.setting.findUnique({ where: { key: "voicedripConfig" } }).catch(() => null);
  return { ...DEFAULT_CFG, ...(row ? safeJson(row.value) : {}) };
}

export async function saveVoiceDripConfig(patch: Partial<VoiceDripConfig>): Promise<VoiceDripConfig> {
  const next = { ...(await getVoiceDripConfig()), ...patch };
  await db.setting.upsert({
    where: { key: "voicedripConfig" },
    update: { value: JSON.stringify(next) },
    create: { key: "voicedripConfig", value: JSON.stringify(next) },
  }).catch(() => {});
  return next;
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Fixed UTC-6 (CST) to match the rest of the platform clock.
export function inVoiceDripWindow(cfg: VoiceDripConfig, now: number): boolean {
  const shifted = new Date(now - 6 * 3600_000);
  const day = DAY_KEYS[shifted.getUTCDay()];
  if (!(cfg.days || "").split(",").map((d) => d.trim().toLowerCase()).includes(day)) return false;
  const toMin = (s: string) => { const [h, m] = (s || "0:0").split(":").map((x) => parseInt(x, 10) || 0); return h * 60 + m; };
  const minutes = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  return minutes >= toMin(cfg.windowStartCst) && minutes < toMin(cfg.windowEndCst);
}

// When should the drop fire for an email sent at `lastSentMs`? Default: 11:00 CST next business day.
export function computeDropDueMs(lastSentMs: number, cfg: VoiceDripConfig): number {
  if (cfg.schedule === "immediate") return lastSentMs;
  const [h, m] = (cfg.sendTimeCst || "11:00").split(":").map((x) => parseInt(x, 10) || 0);
  const wall = new Date(lastSentMs - 6 * 3600_000); // UTC fields now represent CST wall-clock
  const addDays = cfg.schedule === "plus_days" ? Math.max(1, cfg.offsetDays || 1) : 1;
  let dueWallUtc = Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate() + addDays, h, m, 0);
  if (cfg.schedule === "next_business_day") {
    let d = new Date(dueWallUtc);
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d = new Date(d.getTime() + 86400_000);
    dueWallUtc = d.getTime();
  }
  return dueWallUtc + 6 * 3600_000; // CST wall-clock back to real UTC
}

// Schedule drops for every emailed-but-unscheduled recipient (also picks up the >24h backlog).
export async function scheduleVoiceDrips(): Promise<{ scheduled: number }> {
  const cfg = await getVoiceDripConfig();
  if (!cfg.enabled) return { scheduled: 0 };
  const recips = await db.campaignRecipient.findMany({
    where: { lastSentAt: { not: null }, dropDueAt: null, droppedAt: null, calledBackAt: null },
    take: 2000,
  });
  let n = 0;
  for (const r of recips) {
    const due = computeDropDueMs(r.lastSentAt!.getTime(), cfg);
    await db.campaignRecipient.update({ where: { id: r.id }, data: { dropDueAt: new Date(due) } }).catch(() => {});
    n++;
  }
  return { scheduled: n };
}

function authHeader(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID || "";
  const tok = process.env.TWILIO_AUTH_TOKEN || "";
  return "Basic " + Buffer.from(`${sid}:${tok}`).toString("base64");
}

// Place one AMD voicemail drop. Logs a VoiceDrop row. Never throws.
async function placeDrop(toE164: string, cfg: VoiceDripConfig, recipientId: string, campaignId: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  if (!sid || !process.env.TWILIO_AUTH_TOKEN) return { ok: false, callSid: "" };
  const body = new URLSearchParams({
    To: toE164,
    From: cfg.fromNumber,
    Url: `${BASE}/api/voicedrip/twiml`,
    Method: "POST",
    MachineDetection: "DetectMessageEnd",
    MachineDetectionTimeout: "30",
    MachineDetectionSpeechEndThreshold: String(cfg.speechEndThreshold || 500),
    StatusCallback: `${BASE}/api/voicedrip/status`,
    StatusCallbackEvent: "completed",
    StatusCallbackMethod: "POST",
  });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);
  if (!res || !res.ok) return { ok: false, callSid: "" };
  const j = await res.json().catch(() => null) as { sid?: string; status?: string } | null;
  const callSid = j?.sid || "";
  if (callSid) {
    await db.voiceDrop.create({
      data: { callSid, toNumber: toE164, fromNumber: cfg.fromNumber, status: j?.status || "queued", direction: "outbound", recipientId, campaignId },
    }).catch(() => {});
  }
  return { ok: !!callSid, callSid };
}

// One drip tick: fire due drops, paced, during the send window. Skips converted + no-phone recipients.
export async function tickVoiceDrips(now = Date.now()): Promise<{ ok: boolean; placed: number; note?: string }> {
  const cfg = await getVoiceDripConfig();
  if (!cfg.enabled) return { ok: true, placed: 0, note: "disabled" };
  if (!process.env.TWILIO_ACCOUNT_SID) return { ok: true, placed: 0, note: "no twilio creds" };
  if (!inVoiceDripWindow(cfg, now)) return { ok: true, placed: 0, note: "out of window" };
  const due = await db.campaignRecipient.findMany({
    where: { dropDueAt: { lte: new Date(now) }, droppedAt: null, calledBackAt: null },
    orderBy: { dropDueAt: "asc" },
    take: Math.max(1, cfg.perTick || 5),
  });
  let placed = 0;
  for (const r of due) {
    const c = await db.emailContact.findUnique({ where: { id: r.contactId }, select: { phones: true } });
    const digits = (c?.phones || "").split(",").map((s) => s.replace(/\D/g, "")).find((s) => s.length >= 10) || "";
    if (digits.length < 10) {
      await db.campaignRecipient.update({ where: { id: r.id }, data: { droppedAt: new Date(now), dropCallSid: "NO_PHONE" } }).catch(() => {});
      continue;
    }
    const res = await placeDrop("+1" + digits.slice(-10), cfg, r.id, r.campaignId);
    await db.campaignRecipient.update({ where: { id: r.id }, data: { droppedAt: new Date(now), dropCallSid: res.callSid || "FAILED" } }).catch(() => {});
    if (res.ok) placed++;
  }
  return { ok: true, placed };
}

// Twilio finalizes call price after the call ends, so re-fetch it a few minutes later for true COGS.
export async function reconcileVoiceDropCosts(now = Date.now()): Promise<{ reconciled: number }> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return { reconciled: 0 };
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const pending = await db.voiceDrop.findMany({
    where: { priceFinal: false, createdAt: { lte: new Date(now - 2 * 60_000) } },
    take: 50,
  });
  let n = 0;
  for (const v of pending) {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls/${v.callSid}.json`, {
      headers: { Authorization: authHeader() }, signal: AbortSignal.timeout(15000),
    }).catch(() => null);
    if (!res || !res.ok) continue;
    const j = await res.json().catch(() => null) as { price?: string | null; status?: string; answered_by?: string; duration?: string } | null;
    if (!j) continue;
    const data: Record<string, unknown> = { status: j.status || undefined, durationSec: parseInt(j.duration || "0", 10) || 0 };
    if (j.answered_by) data.answeredBy = j.answered_by;
    if (j.price !== null && j.price !== undefined && j.price !== "") {
      data.priceCents = Math.round(Math.abs(parseFloat(j.price)) * 100);
      data.priceFinal = true;
      n++;
    }
    await db.voiceDrop.update({ where: { id: v.id }, data }).catch(() => {});
  }
  return { reconciled: n };
}
