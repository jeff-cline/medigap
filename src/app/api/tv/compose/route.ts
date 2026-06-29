import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildCompose, parseScreen } from "@/lib/tv-screens";

const pexec = promisify(exec);
export const maxDuration = 300;

function gate(s: Awaited<ReturnType<typeof getSession>>) {
  return !!s && (s.role === "god" || s.role === "marketing" || !!s.impersonatorUid);
}

// Composite a spot's 4 screen assignments (+ lower third + QR) onto its fixed lip-synced base.
// Fast (no Runway/lip-sync) — this is what runs when you assign screens and hit Render.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!gate(s)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const spot = await db.tvSpot.findUnique({ where: { id: String(b.id) } });
  if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 });
  const baseUrl = spot.baseUrl || "/uploads/tv/talking-base.mp4";

  const root = process.cwd();
  const baseLocal = path.join(root, "public", baseUrl.replace(/^\//, ""));
  const qrLocal = path.join(root, "public", "uploads", "tv", "g", "qr.png");
  const gDir = path.join(root, "public", "uploads", "tv", "g");
  const outName = `${spot.id}-final.mp4`;
  const outLocal = path.join(root, "public", "uploads", "tv", outName);

  const screens = [spot.screen1, spot.screen2, spot.screen3, spot.screen4].map(parseScreen);

  try {
    await mkdir(gDir, { recursive: true });
    await db.tvSpot.update({ where: { id: spot.id }, data: { renderStatus: "rendering", lastError: "" } });

    const applauseLocal = path.join(root, "public", "uploads", "tv", "applause.mp3");
    const { inputs, filter, texts, audioFilter, mapAudio } = buildCompose({ baseLocal, qrLocal, screens, gDir, spotId: spot.id, applauseLocal });
    await Promise.all(texts.map((t) => writeFile(t.file, t.content)));

    const inArgs = inputs.map((i) => (i.loop ? `-stream_loop -1 -i "${i.path}"` : `-i "${i.path}"`)).join(" ");
    const fc = audioFilter ? `${filter};${audioFilter}` : filter;
    const cmd = `ffmpeg -y -nostdin -loglevel error ${inArgs} -filter_complex "${fc}" -map "[v]" -map "${mapAudio}" -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -t 27 "${outLocal}"`;
    await pexec(cmd, { maxBuffer: 1 << 26 });

    const videoUrl = `/uploads/tv/${outName}?v=${Date.now()}`;
    await db.tvSpot.update({ where: { id: spot.id }, data: { renderStatus: "done", videoUrl } });
    return NextResponse.json({ ok: true, videoUrl });
  } catch (e) {
    await db.tvSpot.update({ where: { id: spot.id }, data: { renderStatus: "failed", lastError: String(e).slice(0, 400) } }).catch(() => {});
    return NextResponse.json({ error: String(e).slice(0, 400) }, { status: 200 });
  }
}
