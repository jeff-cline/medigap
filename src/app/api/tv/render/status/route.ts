import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncCfg, startLipsync, getLipsyncJob, isDone, isFailed } from "@/lib/syncso";
import { getTask } from "@/lib/runway";
import { uploadsDir, publicUrl, downloadTo } from "@/lib/tv-render";
import { estimateCost } from "@/lib/tv-cost";
import path from "path";

function gate(s: Awaited<ReturnType<typeof getSession>>) {
  return !!s && (s.role === "god" || s.role === "marketing" || !!s.impersonatorUid);
}

async function rateOverrides() {
  const [ev, sy, rw] = await Promise.all([
    db.integration.findUnique({ where: { key: "elevenlabs" } }),
    db.integration.findUnique({ where: { key: "syncso" } }),
    db.integration.findUnique({ where: { key: "runway" } }),
  ]);
  const parse = (r: { config: string } | null) => { try { return r ? JSON.parse(r.config) : {}; } catch { return {}; } };
  const e = parse(ev), s = parse(sy), w = parse(rw);
  return {
    voicePer1kChars: e.costPer1kChars !== undefined ? Number(e.costPer1kChars) : undefined,
    lipsyncPerSec: s.costPerSec !== undefined ? Number(s.costPerSec) : undefined,
    lookPerSec: w.costPerSec !== undefined ? Number(w.costPerSec) : undefined,
  };
}

// Advance one transition of a spot's render and report status. The client polls this every few sec.
export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!gate(s)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id") || "";
  const spot = await db.tvSpot.findUnique({ where: { id } });
  if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 });

  if (spot.renderStatus !== "rendering") {
    return NextResponse.json({ ok: true, status: spot.renderStatus, stage: spot.renderStage, videoUrl: spot.videoUrl, costCents: spot.costCents, error: spot.lastError });
  }

  try {
    const sy = await syncCfg();
    let cost: Record<string, number> = {}; try { cost = JSON.parse(spot.costJson || "{}"); } catch {}

    // --- LOOK stage (Runway) ---
    if (spot.renderStage === "look" && spot.runwayJobId) {
      const r = await getTask(spot.runwayJobId);
      const d = r.data as { status?: string; output?: string[] } | null;
      const st = d?.status || "RUNNING";
      if (st === "SUCCEEDED" && d?.output?.[0]) {
        const lookedFile = `${spot.id}-looked.mp4`;
        await downloadTo(d.output[0], path.join(uploadsDir(), lookedFile));
        const jobId = await startLipsync(publicUrl(lookedFile), publicUrl(`${spot.id}-vo.mp3`), { apiKey: sy.apiKey, model: sy.model });
        cost.lookSec = cost.lipsyncSec || 0;
        await db.tvSpot.update({ where: { id }, data: { renderStage: "lipsync", syncJobId: jobId, costJson: JSON.stringify(cost) } });
        return NextResponse.json({ ok: true, status: "rendering", stage: "lipsync" });
      }
      if (st === "FAILED") {
        // fall back: lip-sync the un-looked clip so the render still completes
        const jobId = await startLipsync(publicUrl(`${spot.id}-clip.mp4`), publicUrl(`${spot.id}-vo.mp3`), { apiKey: sy.apiKey, model: sy.model });
        await db.tvSpot.update({ where: { id }, data: { renderStage: "lipsync", syncJobId: jobId, lastError: "Look stage failed — used original footage." } });
        return NextResponse.json({ ok: true, status: "rendering", stage: "lipsync", warn: "look failed, continued" });
      }
      return NextResponse.json({ ok: true, status: "rendering", stage: "look" });
    }

    // --- LIPSYNC stage (Sync.so) ---
    if (spot.renderStage === "lipsync" && spot.syncJobId) {
      const j = await getLipsyncJob(spot.syncJobId, sy.apiKey);
      if (isDone(j.status) && j.outputUrl) {
        const finalFile = `${spot.id}-final.mp4`;
        await downloadTo(j.outputUrl, path.join(uploadsDir(), finalFile));
        const rates = await rateOverrides();
        const c = estimateCost({ chars: cost.chars || 0, lipsyncSec: cost.lipsyncSec || 0, lookSec: cost.lookSec || 0 }, rates);
        await db.tvSpot.update({ where: { id }, data: { renderStatus: "done", renderStage: "", videoUrl: `/uploads/tv/${finalFile}`, costCents: c.total, costJson: JSON.stringify(c) } });
        return NextResponse.json({ ok: true, status: "done", videoUrl: `/uploads/tv/${finalFile}`, costCents: c.total });
      }
      if (isFailed(j.status)) {
        await db.tvSpot.update({ where: { id }, data: { renderStatus: "failed", lastError: `Lip-sync ${j.status}` } });
        return NextResponse.json({ ok: true, status: "failed", error: `Lip-sync ${j.status}` });
      }
      return NextResponse.json({ ok: true, status: "rendering", stage: "lipsync" });
    }

    return NextResponse.json({ ok: true, status: "rendering", stage: spot.renderStage });
  } catch (e) {
    await db.tvSpot.update({ where: { id }, data: { renderStatus: "failed", lastError: String(e).slice(0, 400) } }).catch(() => {});
    return NextResponse.json({ ok: true, status: "failed", error: String(e).slice(0, 400) });
  }
}
