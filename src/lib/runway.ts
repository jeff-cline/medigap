import { db } from "./db";

// RunwayML Gen API — image + video generation. docs.dev.runwayml.com
const BASE = "https://api.dev.runwayml.com/v1";
const VERSION = "2024-11-06";

export async function runwayKey(): Promise<string | null> {
  const row = await db.integration.findUnique({ where: { key: "runway" } });
  try { const c = row ? JSON.parse(row.config) : {}; return c.apiKey || null; } catch { return null; }
}

async function rw(path: string, init: RequestInit) {
  const key = await runwayKey();
  if (!key) return { ok: false, status: 0, data: null as unknown, error: "RunwayML not connected" };
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${key}`, "X-Runway-Version": VERSION, "Content-Type": "application/json", ...(init.headers || {}) },
      signal: AbortSignal.timeout(20000),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data, error: res.ok ? "" : (data as { error?: string })?.error || `HTTP ${res.status}` };
  } catch (e) { return { ok: false, status: 0, data: null, error: e instanceof Error ? e.message : "network error" }; }
}

// The three social/broadcast packages every campaign renders. Ratios are valid for
// BOTH gen4_image (still) and gen4_turbo (motion) so each platform gets a native crop.
export const SOCIAL_FORMATS: { key: string; label: string; ratio: string; note: string }[] = [
  { key: "facebook", label: "Facebook — 1:1 feed", ratio: "960:960", note: "Square feed / in-stream ad" },
  { key: "instagram", label: "Instagram — 9:16 reel/story", ratio: "720:1280", note: "Vertical Reels & Stories" },
  { key: "tv", label: "TV / Digital — 16:9 (vibe.co + Google)", ratio: "1280:720", note: "Connected-TV & YouTube/Google video" },
];

// Vertical social ratio by default (IG/FB reels). Full Runway quality.
export async function createImageTask(promptText: string, ratio = "720:1280") {
  return rw("/text_to_image", { method: "POST", body: JSON.stringify({ promptText: promptText.slice(0, 900), model: "gen4_image", ratio }) });
}
// Full-length (10s) gen4_turbo motion — maximize what Runway delivers per render.
export async function createVideoTask(promptImage: string, promptText: string, ratio = "720:1280", duration = 10) {
  return rw("/image_to_video", { method: "POST", body: JSON.stringify({ promptImage, promptText: promptText.slice(0, 900), model: "gen4_turbo", ratio, duration }) });
}
export async function getTask(id: string) {
  return rw(`/tasks/${id}`, { method: "GET" });
}

// Convenience: poll a task briefly; returns output URLs if it finishes fast, else the id to poll.
export async function pollTask(id: string, tries = 4, delayMs = 4000): Promise<{ done: boolean; status: string; urls: string[]; id: string }> {
  for (let i = 0; i < tries; i++) {
    const r = await getTask(id);
    const d = r.data as { status?: string; output?: string[] } | null;
    const status = d?.status || "RUNNING";
    if (status === "SUCCEEDED") return { done: true, status, urls: d?.output || [], id };
    if (status === "FAILED") return { done: true, status, urls: [], id };
    if (i < tries - 1) await new Promise((res) => setTimeout(res, delayMs));
  }
  return { done: false, status: "RUNNING", urls: [], id };
}
