import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getVoiceDripConfig, saveVoiceDripConfig, scheduleVoiceDrips } from "@/lib/voicedrip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  fromNumber: z.string().optional(),
  schedule: z.enum(["immediate", "next_business_day", "plus_days"]).optional(),
  sendTimeCst: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
  offsetDays: z.number().int().min(1).max(30).optional(),
  perTick: z.number().int().min(1).max(100).optional(),
  windowStartCst: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
  windowEndCst: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
  days: z.string().optional(),
  speechEndThreshold: z.number().int().min(500).max(5000).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  const cfg = await getVoiceDripConfig();
  const [dropsSent, spend, scheduled, dueNow, recent] = await Promise.all([
    db.voiceDrop.count({ where: { direction: "outbound" } }),
    db.voiceDrop.aggregate({ _sum: { priceCents: true } }),
    db.campaignRecipient.count({ where: { dropDueAt: { not: null }, droppedAt: null } }),
    db.campaignRecipient.count({ where: { dropDueAt: { lte: new Date() }, droppedAt: null, calledBackAt: null } }),
    db.voiceDrop.findMany({ where: { direction: "outbound" }, orderBy: { createdAt: "desc" }, take: 25 }),
  ]);
  return NextResponse.json({
    ok: true, cfg,
    stats: { dropsSent, spendCents: spend._sum.priceCents || 0, scheduled, dueNow },
    recent,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid input." }, { status: 400 });
  const wasEnabled = (await getVoiceDripConfig()).enabled;
  const cfg = await saveVoiceDripConfig(parsed.data);
  // Turning it on (or already on) schedules drops for every emailed recipient — incl. the >24h backlog.
  let scheduled = 0;
  if (cfg.enabled) scheduled = (await scheduleVoiceDrips()).scheduled;
  return NextResponse.json({ ok: true, cfg, scheduled, justEnabled: cfg.enabled && !wasEnabled });
}
