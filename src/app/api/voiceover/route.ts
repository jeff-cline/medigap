import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { elevenCfg, fitToTime } from "@/lib/elevenlabs";

function gate(s: Awaited<ReturnType<typeof getSession>>) {
  return !!s && (s.role === "god" || s.role === "marketing" || !!s.impersonatorUid);
}

// Generate a voiceover in the cloned voice, fit to a target number of seconds.
// Returns mp3 (base64) + the actual duration. This is the API a tool/Runway pipeline can call.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!gate(s)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const text = String(b.text || "").trim();
  const seconds = Math.max(0, Math.min(120, Number(b.seconds) || 0));
  if (!text) return NextResponse.json({ error: "Enter the script text." }, { status: 400 });

  const cfg = await elevenCfg();
  if (!cfg.apiKey) return NextResponse.json({ error: "Add your ElevenLabs API key on the Integrations page." }, { status: 200 });
  if (!cfg.voiceId) return NextResponse.json({ error: "Clone the voice first (no voice_id set) — upload the sample on /voice." }, { status: 200 });

  try {
    const r = await fitToTime(text, seconds, cfg);
    return NextResponse.json({ ok: true, audioBase64: r.audioBase64, duration: Math.round(r.duration * 100) / 100, speed: r.speed, fit: r.fit, target: seconds, suggestion: (r as { suggestion?: string }).suggestion });
  } catch (e) {
    return NextResponse.json({ error: String(e).slice(0, 300) }, { status: 200 });
  }
}
