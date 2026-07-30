import { readFile } from "fs/promises";
import path from "path";

// Serves the pre-recorded voicemail WAV to Twilio's <Play>. Twilio can't read .m4a,
// so the source was converted to 8kHz mono PCM WAV and dropped at media/voicedrip-msg1.wav.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const p = path.join(process.cwd(), "media", "voicedrip-msg1.wav");
    const buf = await readFile(p);
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": "audio/wav", "Content-Length": String(buf.length), "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch {
    return new Response("audio not found", { status: 404 });
  }
}
