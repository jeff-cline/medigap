// Doublewide media wordmark — two stacked bars (the "double wide") + name.
export default function DwLogo({ size = "md", light = false }: { size?: "sm" | "md" | "lg"; light?: boolean }) {
  const txt = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl";
  const ico = size === "lg" ? 30 : size === "sm" ? 20 : 24;
  const ink = light ? "#fff" : "var(--dw-navy)";
  return (
    <span className="inline-flex items-center gap-2.5 font-bold tracking-tight whitespace-nowrap" style={{ color: ink }}>
      <svg width={ico} height={ico} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect x="3" y="7" width="26" height="8" rx="3" fill="#c69a3e" />
        <rect x="3" y="17" width="26" height="8" rx="3" fill="#3f9d77" />
      </svg>
      <span className={txt}>Double<span className="dw-gold">wide</span></span>
    </span>
  );
}
