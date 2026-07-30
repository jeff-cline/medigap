import { NextRequest, NextResponse } from "next/server";
import { tickCampaigns } from "@/lib/fire-engine";
import { scheduleVoiceDrips, tickVoiceDrips, reconcileVoiceDropCosts } from "@/lib/voicedrip";
import { sendDueFollowups } from "@/lib/followup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron-triggered drip tick. Protected by the FIRE_CRON_KEY (header or ?key=).
async function run(req: NextRequest) {
  const key = req.headers.get("x-fire-key") || new URL(req.url).searchParams.get("key") || "";
  if (!process.env.FIRE_CRON_KEY || key !== process.env.FIRE_CRON_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await tickCampaigns();
  // VoiceDrip rides the same cron: schedule new drops off sent emails, fire due ones, reconcile cost.
  const vdScheduled = await scheduleVoiceDrips().catch(() => ({ scheduled: 0 }));
  const vdTick = await tickVoiceDrips().catch(() => ({ ok: false, placed: 0 }));
  const vdCost = await reconcileVoiceDropCosts().catch(() => ({ reconciled: 0 }));
  // U65 missed-call follow-up texts ride the same cron: send any that are due (10:00 CST next biz day).
  const followups = await sendDueFollowups().catch(() => ({ sent: 0, failed: 0, skipped: 0 }));
  return NextResponse.json({ ...result, voicedrip: { ...vdScheduled, ...vdTick, ...vdCost }, followups });
}

export const GET = run;
export const POST = run;
