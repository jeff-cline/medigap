// R)cketShip wordmark — rocket glyph + "R)cketShip" with the signature orange ")".
export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";
  const ico = size === "lg" ? 34 : size === "sm" ? 18 : 24;
  return (
    <span className="inline-flex items-center gap-2 font-bold tracking-tight whitespace-nowrap">
      <svg width={ico} height={ico} viewBox="0 0 32 32" fill="none" aria-hidden>
        <defs>
          <linearGradient id="rs-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#dfe7f5" /><stop offset="100%" stopColor="#aab6cf" />
          </linearGradient>
        </defs>
        {/* exhaust */}
        <path d="M11 21 L16 30 L21 21 Z" fill="#ff7a18" opacity="0.9" />
        <path d="M13 21 L16 27 L19 21 Z" fill="#ffd24a" />
        {/* body */}
        <path d="M16 2 C22 6 24 13 23 21 L9 21 C8 13 10 6 16 2 Z" fill="url(#rs-body)" />
        {/* window */}
        <circle cx="16" cy="12" r="3" fill="#0a0e18" stroke="#38e1ff" strokeWidth="1.4" />
        {/* fins */}
        <path d="M9 21 L5 25 L9 25 Z" fill="#ff7a18" />
        <path d="M23 21 L27 25 L23 25 Z" fill="#ff7a18" />
      </svg>
      <span className={text}>
        R<span style={{ color: "#ff7a18" }}>)</span>cketShip
      </span>
    </span>
  );
}
