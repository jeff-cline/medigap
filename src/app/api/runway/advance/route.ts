import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTask, createVideoTask } from "@/lib/runway";

// Stateless per-format driver for a video campaign. The client calls this on a loop
// for each format, threading the state back each time:
//   image rendering → (image done) start video → (video done) return the video URL.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !["god", "marketing"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const ratio = String(b.ratio || "720:1280");
  const promptText = String(b.promptText || "");
  const imageTask = String(b.imageTask || "");
  let imageUrl = String(b.imageUrl || "");
  let videoTask = String(b.videoTask || "");

  // Phase 1 — wait for the still image.
  if (!imageUrl) {
    if (!imageTask) return NextResponse.json({ phase: "error", error: "No image task." });
    const r = await getTask(imageTask);
    const d = r.data as { status?: string; output?: string[] } | null;
    if (d?.status === "FAILED") return NextResponse.json({ phase: "error", error: "Image generation failed." });
    if (d?.status === "SUCCEEDED" && d.output?.[0]) imageUrl = d.output[0];
    else return NextResponse.json({ phase: "image", imageUrl: "", videoTask: "", videoUrl: "" });
  }

  // Phase 2 — image is ready; start the (full-length) video if we haven't yet.
  if (imageUrl && !videoTask) {
    const vid = await createVideoTask(imageUrl, promptText, ratio, 10);
    const vidId = (vid.data as { id?: string })?.id || "";
    if (!vidId) return NextResponse.json({ phase: "image-done", imageUrl, videoTask: "", videoUrl: "", error: vid.error || "Could not start video." });
    videoTask = vidId;
    return NextResponse.json({ phase: "video", imageUrl, videoTask, videoUrl: "" });
  }

  // Phase 3 — poll the video.
  const r = await getTask(videoTask);
  const d = r.data as { status?: string; output?: string[] } | null;
  if (d?.status === "FAILED") return NextResponse.json({ phase: "error", imageUrl, videoTask, error: "Video generation failed." });
  if (d?.status === "SUCCEEDED" && d.output?.[0]) return NextResponse.json({ phase: "done", imageUrl, videoTask, videoUrl: d.output[0] });
  return NextResponse.json({ phase: "video", imageUrl, videoTask, videoUrl: "" });
}
