import Link from "next/link";

// Word cloud — bigger = triggered more often. Words link to their landing page.
export default function MoneyWordCloud({ words, linkBase = "/money-word-cloud" }: { words: { word: string; triggers: number }[]; linkBase?: string }) {
  if (!words.length) return <p className="text-sm text-[var(--muted)]">No money words yet.</p>;
  const max = Math.max(1, ...words.map((w) => w.triggers));
  // size 0.95rem .. 3.2rem by trigger count (sqrt scale so small ones stay readable)
  const size = (t: number) => 0.95 + Math.sqrt(t / max) * 2.25;
  const tones = ["var(--gold)", "var(--brand)", "var(--brand2)", "var(--text)"];
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 py-6">
      {words.map((w, i) => {
        const rot = ((i * 37) % 11) - 5;
        return (
          <Link key={w.word} href={`${linkBase}/${encodeURIComponent(w.word)}`}
            className="mw-float font-extrabold hover:opacity-80 transition leading-none"
            style={{ fontSize: `${size(w.triggers).toFixed(2)}rem`, color: tones[i % tones.length], ["--rot" as string]: `${rot}deg`, animationDelay: `${(i % 6) * 0.5}s` }}>
            {w.word}
          </Link>
        );
      })}
    </div>
  );
}
