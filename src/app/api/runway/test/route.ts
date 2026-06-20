import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createImageTask, createVideoTask, pollTask, runwayKey } from "@/lib/runway";

// God tool: prompt → high-quality vertical social image, then kick off the video. Returns the
// image fast and a video task id to poll (video gen runs ~1-3 min).
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== "god") return NextResponse.json({ error: "God only" }, { status: 403 });
  if (!(await runwayKey())) return NextResponse.json({ ok: false, error: "Connect RunwayML on Integrations first." }, { status: 200 });
  const { prompt } = await req.json().catch(() => ({}));
  if (!prompt) return NextResponse.json({ error: "Enter a prompt." }, { status: 400 });

  const img = await createImageTask(`${prompt}. Vertical 9:16, high quality, social-media ready, clean type space.`);
  const imgId = (img.data as { id?: string })?.id;
  if (!img.ok || !imgId) return NextResponse.json({ ok: false, error: img.error || "Image generation failed." }, { status: 200 });
  const imgResult = await pollTask(imgId, 5, 4000);
  const imageUrl = imgResult.urls[0] || "";
  if (!imageUrl) return NextResponse.json({ ok: true, imageTask: imgId, status: imgResult.status, message: "Image still rendering — poll the task." });

  const vid = await createVideoTask(imageUrl, prompt);
  const vidId = (vid.data as { id?: string })?.id || "";
  return NextResponse.json({ ok: true, imageUrl, videoTask: vidId, status: vid.ok ? "RUNNING" : "FAILED", error: vid.ok ? "" : vid.error });
}
