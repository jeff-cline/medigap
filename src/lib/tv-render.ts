import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Helpers shared by the TV-commercial render pipeline (voice → clip prep → look → lip-sync).
// ffmpeg runs on the prod server (installed). Media is served by nginx from public/uploads/tv.
const pexec = promisify(exec);

// Canonical public base the external APIs (Sync.so / Runway) FETCH inputs from.
export const PUBLIC_BASE = process.env.TV_PUBLIC_BASE || "https://medigap.plus";

export function uploadsDir(): string {
  return path.join(process.cwd(), "public", "uploads", "tv");
}
export function publicUrl(file: string): string {
  return `${PUBLIC_BASE}/uploads/tv/${file}`;
}
// Map a stored "/uploads/tv/x.mp4" (or absolute) URL to its local file path.
export function localPathFromUrl(url: string): string {
  const p = url.replace(/^https?:\/\/[^/]+/, "");
  return path.join(process.cwd(), "public", p.replace(/^\//, ""));
}

export async function ensureDir() {
  await mkdir(uploadsDir(), { recursive: true });
}

export async function ffprobeDuration(localFile: string): Promise<number> {
  try {
    const { stdout } = await pexec(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${localFile}"`);
    return parseFloat(stdout.trim()) || 0;
  } catch { return 0; }
}

// Trim [start, duration] + optional crop (percent of w/h) → re-encoded mp4 with NO audio
// (the lip-sync supplies the new audio). Returns the actual clip duration.
export async function prepClip(opts: {
  sourceLocal: string; outLocal: string; start: number; duration: number;
  crop?: { x: number; y: number; w: number; h: number };
}): Promise<number> {
  const vf: string[] = [];
  if (opts.crop && (opts.crop.w < 100 || opts.crop.h < 100 || opts.crop.x > 0 || opts.crop.y > 0)) {
    const { x, y, w, h } = opts.crop;
    vf.push(`crop=iw*${w / 100}:ih*${h / 100}:iw*${x / 100}:ih*${y / 100}`);
  }
  const vfArg = vf.length ? `-vf "${vf.join(",")}"` : "";
  const ss = opts.start > 0 ? `-ss ${opts.start}` : "";
  const t = opts.duration > 0 ? `-t ${opts.duration}` : "";
  await pexec(`ffmpeg -y -loglevel error ${ss} -i "${opts.sourceLocal}" ${t} ${vfArg} -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -an "${opts.outLocal}"`, { maxBuffer: 1 << 24 });
  return ffprobeDuration(opts.outLocal);
}

export async function writeBase64(b64: string, outLocal: string) {
  await writeFile(outLocal, Buffer.from(b64, "base64"));
}

export async function downloadTo(url: string, outLocal: string, headers: Record<string, string> = {}) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`download failed ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(outLocal, buf);
}
