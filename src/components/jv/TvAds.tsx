"use client";
import { useEffect, useRef, useState } from "react";

// The three national-TV spots. When a spot finishes playing, a "Check Availability"
// CTA pops up over it and links to the Express-Interest form (#interest).
const VIDEOS = ["31h208kx4L0", "WHnSjoZJbGo", "fKOV8ybqdTE"];

type YTPlayer = { playVideo: () => void };
type YTNamespace = {
  Player: new (el: string | HTMLElement, opts: Record<string, unknown>) => YTPlayer;
  PlayerState: { ENDED: number };
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function TvAds() {
  const [ended, setEnded] = useState<Record<number, boolean>>({});
  const players = useRef<(YTPlayer | null)[]>([]);

  useEffect(() => {
    let cancelled = false;

    function init() {
      if (cancelled || !window.YT?.Player) return;
      VIDEOS.forEach((id, i) => {
        if (players.current[i]) return;
        players.current[i] = new window.YT!.Player(`tvad-${i}`, {
          videoId: id,
          width: "100%",
          height: "100%",
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onStateChange: (e: { data: number }) => {
              if (e.data === window.YT!.PlayerState.ENDED) setEnded((s) => ({ ...s, [i]: true }));
            },
          },
        });
      });
    }

    if (window.YT?.Player) {
      init();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); init(); };
      if (!document.getElementById("yt-iframe-api")) {
        const s = document.createElement("script");
        s.id = "yt-iframe-api";
        s.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(s);
      }
    }
    return () => { cancelled = true; };
  }, []);

  function replay(i: number) {
    setEnded((s) => ({ ...s, [i]: false }));
    players.current[i]?.playVideo();
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">
          <span className="live-dot text-[var(--brand)]">●</span> On air nationwide
        </div>
        <h2 className="mt-4 text-2xl md:text-3xl font-extrabold uppercase tracking-wide">National TV Advertising</h2>
        <p className="text-[var(--muted)] mt-2">These spots are running on national TV. Watch, then check availability in your market.</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {VIDEOS.map((id, i) => (
          <div key={id} className="relative card !p-0 overflow-hidden">
            <div className="relative aspect-video bg-black">
              <div id={`tvad-${i}`} className="absolute inset-0 h-full w-full" />
              {ended[i] && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/85 text-center p-4">
                  <div className="text-white font-bold text-lg">Want this in your market?</div>
                  <a href="#interest" onClick={() => setEnded((s) => ({ ...s, [i]: false }))} className="btn btn-brand">Check Availability →</a>
                  <button onClick={() => replay(i)} className="text-xs text-white/70 hover:text-white underline">Watch again</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
