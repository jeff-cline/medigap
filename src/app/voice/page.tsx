import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { elevenCfg } from "@/lib/elevenlabs";
import VoiceStudio from "@/components/VoiceStudio";

export const dynamic = "force-dynamic";

const DEFAULT_SCRIPT = `Hello friends — Wink Martindale here for 1-800-MEDIGAP.

You know, it's fun to take chances when you're on a game show... but for real-life decisions, you need to call the 1-800-MEDIGAP voice answer engine.

America's trusted toll-free voice answer engine — helping answer confusing questions and connecting you to trusted, qualified experts.

1-800-MEDIGAP helps people just like you save time and money.

Give 1-800-MEDIGAP a call today... and tell them Wink sent you.`;

export default async function VoicePage() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!(s.role === "god" || s.role === "marketing" || s.impersonatorUid)) redirect("/dashboard");
  const cfg = await elevenCfg();

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">🎙️ Voiceover Engine</h1>
        <p className="text-sm text-[var(--muted)] mt-1 max-w-2xl">Type a script, set the seconds it must fit, and generate a voiceover in your cloned voice. Download the audio for Runway, or call the API in an automation pipeline.</p>
        <VoiceStudio hasKey={!!cfg.apiKey} hasVoice={!!cfg.voiceId} defaultScript={DEFAULT_SCRIPT} />
      </div>
    </div>
  );
}
