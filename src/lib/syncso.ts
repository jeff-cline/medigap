import { db } from "@/lib/db";

// Sync.so lip-sync client (api.sync.so/v2). Auth via x-api-key. Re-syncs an existing real face
// in a video to a new audio track — the core of the TV-commercial pipeline.
export type SyncCfg = { apiKey: string; model: string; maxSeconds: number; costPerSec?: number };

export async function syncCfg(): Promise<SyncCfg> {
  const row = await db.integration.findUnique({ where: { key: "syncso" } });
  let c: Record<string, unknown> = {};
  try { c = row ? JSON.parse(row.config) : {}; } catch {}
  return {
    apiKey: String(c.apiKey || ""),
    model: String(c.model || "lipsync-2"),
    maxSeconds: Number(c.maxSeconds || 20),
    costPerSec: c.costPerSec !== undefined ? Number(c.costPerSec) : undefined,
  };
}

const BASE = "https://api.sync.so/v2";

// Start a lip-sync job → returns the job id.
export async function startLipsync(
  videoUrl: string,
  audioUrl: string,
  cfg: { apiKey: string; model?: string; syncMode?: string }
): Promise<string> {
  const r = await fetch(`${BASE}/generate`, {
    method: "POST",
    headers: { "x-api-key": cfg.apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      model: cfg.model || "lipsync-2",
      input: [
        { type: "video", url: videoUrl },
        { type: "audio", url: audioUrl },
      ],
      options: { sync_mode: cfg.syncMode || "cut_off" },
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.id) throw new Error(`Sync.so start failed: ${d.message || d.errorCode || JSON.stringify(d).slice(0, 200)}`);
  return d.id as string;
}

export type SyncJob = { status: string; outputUrl: string | null; raw: Record<string, unknown> };

export async function getLipsyncJob(id: string, apiKey: string): Promise<SyncJob> {
  const r = await fetch(`${BASE}/generate/${id}`, { headers: { "x-api-key": apiKey } });
  const d = await r.json().catch(() => ({}));
  return { status: String(d.status || d.state || "UNKNOWN"), outputUrl: d.outputUrl || d.output_url || d.output || null, raw: d };
}

export const isDone = (s: string) => /COMPLETED|completed|done|success/i.test(s);
export const isFailed = (s: string) => /FAILED|error|rejected|canceled|cancelled/i.test(s);
