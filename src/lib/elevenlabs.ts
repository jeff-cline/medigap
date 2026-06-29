import { db } from "@/lib/db";

// ElevenLabs voice-clone + TTS. Config (apiKey + voiceId) lives in the `elevenlabs` integration.
export async function elevenCfg() {
  const row = await db.integration.findUnique({ where: { key: "elevenlabs" } });
  let c: Record<string, string> = {};
  try { c = row ? JSON.parse(row.config) : {}; } catch {}
  return { apiKey: c.apiKey || "", voiceId: c.voiceId || "", model: c.model || "eleven_multilingual_v2" };
}

export type TtsResult = { audioBase64: string; duration: number; speed: number };

// One TTS render with character-level timestamps so we know the exact duration.
export async function tts(text: string, opts: { apiKey: string; voiceId: string; model: string; speed?: number }): Promise<TtsResult> {
  const speed = Math.max(0.7, Math.min(1.2, opts.speed ?? 1.0));
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${opts.voiceId}/with-timestamps`, {
    method: "POST",
    headers: { "xi-api-key": opts.apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text, model_id: opts.model,
      voice_settings: { stability: 0.5, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true, speed },
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  const ends: number[] = d.alignment?.character_end_times_seconds || d.normalized_alignment?.character_end_times_seconds || [];
  const duration = ends.length ? ends[ends.length - 1] : 0;
  return { audioBase64: d.audio_base64, duration, speed };
}

// Render the text to fit a target number of seconds: render once, measure, adjust the speed, re-render.
export async function fitToTime(text: string, targetSec: number, cfg: { apiKey: string; voiceId: string; model: string }) {
  const first = await tts(text, cfg);
  if (!targetSec || Math.abs(first.duration - targetSec) <= 0.6) return { ...first, fit: true as const, target: targetSec };
  const ratio = first.duration / targetSec; // >1 → need to speak faster
  const speed = Math.max(0.7, Math.min(1.2, ratio));
  const second = await tts(text, { ...cfg, speed });
  const off = second.duration - targetSec;
  const fit = Math.abs(off) <= 0.8;
  const words = text.trim().split(/\s+/).length;
  const wordsToAdjust = Math.max(1, Math.round(Math.abs(off) / (second.duration / Math.max(1, words))));
  return {
    ...second, fit, target: targetSec,
    suggestion: fit ? undefined : off > 0 ? `Still ~${off.toFixed(1)}s long at max speed — trim ~${wordsToAdjust} words.` : `~${(-off).toFixed(1)}s short at min speed — add ~${wordsToAdjust} words.`,
  };
}
