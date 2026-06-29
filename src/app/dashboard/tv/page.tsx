import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { elevenCfg } from "@/lib/elevenlabs";
import { syncCfg } from "@/lib/syncso";
import { runwayKey } from "@/lib/runway";
import TvStudio from "@/components/TvStudio";

export const dynamic = "force-dynamic";

const DEFAULT_SCRIPT = `Hi — Wink Martindale here. For real-life Medicare decisions, call 1-800-MEDIGAP, America's trusted toll-free number. We help you save time and money. Call 1-800-MEDIGAP... and tell them Wink sent you.`;

export default async function TvDashboard() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!(s.role === "god" || s.role === "marketing" || s.impersonatorUid)) redirect("/dashboard");

  const [spots, ev, sy, rwKey] = await Promise.all([
    db.tvSpot.findMany({ orderBy: [{ createdAt: "desc" }] }),
    elevenCfg(),
    syncCfg(),
    runwayKey(),
  ]);

  const isGod = s.role === "god" || !!s.impersonatorUid;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">🎬 TV Commercial Studio</h1>
      <p className="text-sm text-[var(--muted)] mt-1 max-w-3xl">
        Make as many spots as you want. Type a script + a look prompt, upload a face clip, tighten the framing, and render —
        cloned voice → optional background restyle → lip-sync. Review, then <b>Go Live</b> to publish to{" "}
        <a href="https://1-800-medigap.com/tv" target="_blank" className="text-[var(--brand)]">1-800-MEDIGAP.com/tv</a>.
      </p>
      <TvStudio
        isGod={isGod}
        hasVoice={!!ev.voiceId}
        hasKey={!!ev.apiKey}
        hasSync={!!sy.apiKey}
        hasRunway={!!rwKey}
        defaultScript={DEFAULT_SCRIPT}
        spots={spots.map((x) => ({
          id: x.id, title: x.title, subtitle: x.subtitle, script: x.script, seconds: x.seconds,
          sourceUrl: x.sourceUrl, videoUrl: x.videoUrl, voiceUrl: x.voiceUrl, posterUrl: x.posterUrl,
          clipStart: x.clipStart, clipDuration: x.clipDuration,
          cropEnabled: x.cropEnabled, cropX: x.cropX, cropY: x.cropY, cropW: x.cropW, cropH: x.cropH,
          lookPrompt: x.lookPrompt, status: x.status, featured: x.featured,
          renderStatus: x.renderStatus, renderStage: x.renderStage, lastError: x.lastError,
          costCents: x.costCents, costJson: x.costJson,
          baseUrl: x.baseUrl, screen1: x.screen1, screen2: x.screen2, screen3: x.screen3, screen4: x.screen4,
        }))}
      />
    </div>
  );
}
