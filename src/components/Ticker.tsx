"use client";
// Real-time money ticker for the footer — spent vs brought in.
export default function Ticker({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="border-t border-[var(--border)] bg-[var(--panel)] overflow-hidden">
      <div className="ticker-track py-2 text-sm">
        {row.map((t, i) => (
          <span key={i} className="mx-6 inline-flex items-center gap-2 text-[var(--muted)]">
            <span className="live-dot text-[var(--brand)]">●</span>{t}
          </span>
        ))}
      </div>
    </div>
  );
}
