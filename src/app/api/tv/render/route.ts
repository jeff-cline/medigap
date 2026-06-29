import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { elevenCfg, fitToTime } from "@/lib/elevenlabs";
import { syncCfg, startLipsync } from "@/lib/syncso";
import { runwayKey, createLookTask } from "@/lib/runway";
import { ensureDir, uploadsDir, publicUrl, localPathFromUrl, prepClip, ffprobeDuration, writeBase64 } from "@/lib/tv-render";
import path from "path";

export const maxDuration = 120;

function gate(s: Awaited<ReturnType<typeof getSession>>) {
  return !!s && (s.role === "god" || s.role === "marketing" || !!s.impersonatorUid);
}

// Start producing a spot: ElevenLabs voice → ffmpeg trim/crop → (optional Runway look) → kick the
// Sync.so lip-sync. Returns immediately; the client polls /api/tv/render/status to advance + finish.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!gate(s)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const spot = await db.tvSpot.findUnique({ where: { id: String(b.id) } });
  if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 });
  if (!spot.script.trim()) return NextResponse.json({ error: "Add a script first." }, { status: 400 });
  if (!spot.sourceUrl) return NextResponse.json({ error: "Upload a source face clip first." }, { status: 400 });

  const ev = await elevenCfg();
  if (!ev.apiKey || !ev.voiceId) return NextResponse.json({ error: "ElevenLabs voice not set up (clone on /voice)." }, { status: 400 });
  const sy = await syncCfg();
  if (!sy.apiKey) return NextResponse.json({ error: "Add your Sync.so key on Integrations." }, { status: 400 });

  try {
    await ensureDir();
    await db.tvSpot.update({ where: { id: spot.id }, data: { renderStatus: "rendering", renderStage: "voice", lastError: "", videoUrl: "" } });

    // 1) Voice — fit to the target seconds
    const vo = await fitToTime(spot.script, spot.seconds, ev);
    const voFile = `${spot.id}-vo.mp3`;
    await writeBase64(vo.audioBase64, path.join(uploadsDir(), voFile));

    // 2) Clip prep — trim + optional crop, capped at the Sync.so plan max
    const srcLocal = localPathFromUrl(spot.sourceUrl);
    const srcDur = await ffprobeDuration(srcLocal);
    const want = spot.clipDuration > 0 ? spot.clipDuration : Math.max(0, srcDur - spot.clipStart);
    const dur = Math.min(want || sy.maxSeconds, sy.maxSeconds);
    const clipFile = `${spot.id}-clip.mp4`;
    const clipDur = await prepClip({
      sourceLocal: srcLocal,
      outLocal: path.join(uploadsDir(), clipFile),
      start: spot.clipStart,
      duration: dur,
      crop: spot.cropEnabled ? { x: spot.cropX, y: spot.cropY, w: spot.cropW, h: spot.cropH } : undefined,
    });

    const costJson = JSON.stringify({ chars: spot.script.length, lipsyncSec: Math.round(clipDur * 10) / 10, lookSec: 0 });

    // 3) Branch: look (Runway, async) if a prompt + key exist, else straight to lip-sync (Sync.so)
    const rwKey = spot.lookPrompt.trim() ? await runwayKey() : null;
    if (spot.lookPrompt.trim() && rwKey) {
      const task = await createLookTask(publicUrl(clipFile), spot.lookPrompt);
      const taskId = (task.data as { id?: string } | null)?.id;
      if (task.ok && taskId) {
        await db.tvSpot.update({ where: { id: spot.id }, data: { voiceUrl: `/uploads/tv/${voFile}`, renderStage: "look", runwayJobId: taskId, costJson } });
        return NextResponse.json({ ok: true, stage: "look" });
      }
      // look couldn't start → fall through to lip-sync on the plain clip
    }

    const jobId = await startLipsync(publicUrl(clipFile), publicUrl(voFile), { apiKey: sy.apiKey, model: sy.model });
    await db.tvSpot.update({ where: { id: spot.id }, data: { voiceUrl: `/uploads/tv/${voFile}`, renderStage: "lipsync", syncJobId: jobId, costJson } });
    return NextResponse.json({ ok: true, stage: "lipsync" });
  } catch (e) {
    await db.tvSpot.update({ where: { id: spot.id }, data: { renderStatus: "failed", lastError: String(e).slice(0, 400) } }).catch(() => {});
    return NextResponse.json({ error: String(e).slice(0, 400) }, { status: 200 });
  }
}
