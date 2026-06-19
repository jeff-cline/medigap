"use client";
import { useCallback, useEffect, useState } from "react";

export type Slide = {
  kicker: string;
  title: string;
  body: string;
  bullets?: string[];
  stats?: { label: string; value: string }[];
};

export default function PitchDeck({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const n = slides.length;

  const go = useCallback(
    (d: number) => setI((cur) => Math.min(n - 1, Math.max(0, cur + d))),
    [n]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const s = slides[i];

  return (
    <div className="select-none">
      <div className="card relative overflow-hidden p-8 md:p-12 min-h-[440px] flex flex-col">
        {/* ambient brand wash */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full brand-gradient opacity-20 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full brand-gradient opacity-10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--brand)] font-semibold">{s.kicker}</span>
          <span className="text-xs text-[var(--muted)]">{i + 1} / {n}</span>
        </div>

        <div className="relative mt-6 flex-1">
          <h2 className="text-3xl md:text-5xl font-extrabold leading-[1.05] text-gradient max-w-4xl">{s.title}</h2>
          <p className="mt-5 text-base md:text-lg text-[var(--muted)] max-w-3xl leading-relaxed">{s.body}</p>

          {s.bullets && (
            <ul className="mt-6 grid gap-2 sm:grid-cols-2 max-w-3xl">
              {s.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-[var(--text)]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full brand-gradient" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {s.stats && (
            <div className="mt-8 grid gap-4 sm:grid-cols-3 max-w-3xl">
              {s.stats.map((st) => (
                <div key={st.label} className="rounded-xl bg-[var(--panel2)] border border-[var(--border)] p-4">
                  <div className="text-2xl md:text-3xl font-extrabold text-gradient">{st.value}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-[var(--muted)]">{st.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* controls */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={i === 0}
          className="btn btn-ghost text-sm disabled:opacity-40"
        >
          ← Prev
        </button>

        <div className="flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-2 rounded-full transition-all ${idx === i ? "w-6 brand-gradient" : "w-2 bg-[var(--border)]"}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          disabled={i === n - 1}
          className="btn btn-brand text-sm disabled:opacity-40"
        >
          Next →
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-[var(--muted)]">Use ← / → arrow keys to navigate.</p>
    </div>
  );
}
