"use client";
// Speedometer gauge — velocity / ROI / volume visual for the $1B dashboard.
export default function Gauge({ value, max, label, unit = "", suffix = "" }: { value: number; max: number; label: string; unit?: string; suffix?: string }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const angle = -120 + pct * 240; // -120deg..120deg sweep
  const r = 80, cx = 100, cy = 100;
  const arc = (start: number, end: number) => {
    const p = (deg: number) => [cx + r * Math.cos((deg - 90) * Math.PI / 180), cy + r * Math.sin((deg - 90) * Math.PI / 180)];
    const [x1, y1] = p(start), [x2, y2] = p(end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  return (
    <div className="card p-5 flex flex-col items-center">
      <svg viewBox="0 0 200 140" className="w-full max-w-[220px]">
        <path d={arc(-120, 120)} fill="none" stroke="var(--border)" strokeWidth="14" strokeLinecap="round" />
        <path d={arc(-120, angle)} fill="none" stroke="url(#g)" strokeWidth="14" strokeLinecap="round" />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--brand2)" /><stop offset="100%" stopColor="var(--brand)" />
          </linearGradient>
        </defs>
        <line x1="100" y1="100" x2={100 + 62 * Math.cos((angle - 90) * Math.PI / 180)} y2={100 + 62 * Math.sin((angle - 90) * Math.PI / 180)} stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="100" r="6" fill="var(--gold)" />
      </svg>
      <div className="-mt-3 text-2xl font-bold text-gradient">{unit}{value.toLocaleString()}{suffix}</div>
      <div className="text-xs text-[var(--muted)] uppercase tracking-wide">{label}</div>
    </div>
  );
}
