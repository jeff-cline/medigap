// Royalty-free, self-contained senior-services illustrations (original SVG — no
// external dependency, no licensing). Colors follow the active brand via CSS vars.

export function SeniorHeroArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 420" className={className} role="img" aria-label="Caring for seniors" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sa-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--brand-2)" stopOpacity="0.10" />
        </linearGradient>
      </defs>
      <rect x="20" y="40" width="480" height="340" rx="28" fill="url(#sa-bg)" />
      {/* sun */}
      <circle cx="430" cy="110" r="36" fill="var(--gold)" opacity="0.85" />
      {/* house */}
      <path d="M70 250 L150 185 L230 250 Z" fill="var(--brand-2)" opacity="0.85" />
      <rect x="92" y="248" width="116" height="92" rx="6" fill="#ffffff" stroke="var(--border)" />
      <rect x="120" y="285" width="26" height="55" rx="3" fill="var(--brand)" opacity="0.8" />
      <rect x="160" y="282" width="30" height="26" rx="3" fill="var(--brand-2)" opacity="0.5" />
      {/* two figures */}
      <g>
        <circle cx="300" cy="210" r="26" fill="#ffd9b3" />
        <path d="M262 340 Q262 270 300 270 Q338 270 338 340 Z" fill="var(--brand)" />
        <path d="M300 196 a26 26 0 0 1 26 22 q-26 6 -52 0 a26 26 0 0 1 26 -22Z" fill="#e6e9ef" />
      </g>
      <g>
        <circle cx="372" cy="225" r="22" fill="#f4c19a" />
        <path d="M340 340 Q340 282 372 282 Q404 282 404 340 Z" fill="var(--brand-2)" />
      </g>
      {/* heart */}
      <path d="M336 150 c-10 -18 -40 -8 -40 14 c0 18 40 36 40 36 c0 0 40 -18 40 -36 c0 -22 -30 -32 -40 -14Z" fill="var(--danger)" opacity="0.9" />
    </svg>
  );
}

export function CareIcon({ kind }: { kind: string }) {
  const common = { width: 28, height: 28, fill: "none", stroke: "var(--brand)", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "shield": return (<svg viewBox="0 0 24 24" {...common}><path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>);
    case "home": return (<svg viewBox="0 0 24 24" {...common}><path d="M3 11l9-7 9 7" /><path d="M5 10v9h14v-9" /><path d="M10 19v-5h4v5" /></svg>);
    case "heart": return (<svg viewBox="0 0 24 24" {...common}><path d="M12 20s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.5-7 10-7 10z" /></svg>);
    case "phone": return (<svg viewBox="0 0 24 24" {...common}><path d="M5 4h4l2 5-3 2a11 11 0 005 5l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" /></svg>);
    default: return (<svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>);
  }
}
