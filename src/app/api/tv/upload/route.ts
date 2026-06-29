import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";
import { randomCode } from "@/lib/qr";

function gate(s: Awaited<ReturnType<typeof getSession>>) {
  return !!s && (s.role === "god" || s.role === "marketing" || !!s.impersonatorUid);
}

const EXT: Record<string, string> = {
  "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm",
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/wav": "wav",
};

// Upload a video / poster / voiceover file → saved under public/tv, returns its public URL.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!gate(s)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file." }, { status: 400 });
  if (file.size > 200 * 1024 * 1024) return NextResponse.json({ error: "File too large (200MB max)." }, { status: 400 });

  const ext = EXT[file.type] || (file.name.split(".").pop() || "bin").toLowerCase();
  const name = `${randomCode()}.${ext}`;
  // public/uploads/* is excluded from the deploy --delete sweep, so uploads survive redeploys.
  const dir = path.join(process.cwd(), "public", "uploads", "tv");
  try {
    await mkdir(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buf);
    return NextResponse.json({ ok: true, url: `/uploads/tv/${name}` });
  } catch (e) {
    return NextResponse.json({ error: String(e).slice(0, 300) }, { status: 200 });
  }
}
