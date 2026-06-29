import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { elevenCfg } from "@/lib/elevenlabs";

function gate(s: Awaited<ReturnType<typeof getSession>>) {
  return !!s && (s.role === "god" || s.role === "marketing" || !!s.impersonatorUid);
}

// Clone a voice from an uploaded audio sample → ElevenLabs voice_id, saved to the integration.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!gate(s)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const cfg = await elevenCfg();
  if (!cfg.apiKey) return NextResponse.json({ error: "Add your ElevenLabs API key on Integrations first." }, { status: 200 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  const name = String(form?.get("name") || "1-800-MEDIGAP Voice");
  if (!file) return NextResponse.json({ error: "Upload an audio sample (.m4a/.mp3/.wav)." }, { status: 400 });

  try {
    const fd = new FormData();
    fd.append("name", name);
    fd.append("files", file, file.name || "voice-sample");
    fd.append("description", "1-800-MEDIGAP TV/voiceover spokesperson voice");
    const r = await fetch("https://api.elevenlabs.io/v1/voices/add", { method: "POST", headers: { "xi-api-key": cfg.apiKey }, body: fd });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.voice_id) return NextResponse.json({ error: `Clone failed: ${d.detail?.message || JSON.stringify(d).slice(0, 200)}` }, { status: 200 });

    // persist the voice_id into the integration config
    const row = await db.integration.findUnique({ where: { key: "elevenlabs" } });
    let conf: Record<string, string> = {}; try { conf = row ? JSON.parse(row.config) : {}; } catch {}
    conf.voiceId = d.voice_id;
    await db.integration.upsert({ where: { key: "elevenlabs" }, update: { config: JSON.stringify(conf), connected: true, status: "verified" }, create: { key: "elevenlabs", label: "ElevenLabs Voice", config: JSON.stringify(conf), connected: true, status: "verified" } });
    return NextResponse.json({ ok: true, voiceId: d.voice_id });
  } catch (e) {
    return NextResponse.json({ error: String(e).slice(0, 300) }, { status: 200 });
  }
}
