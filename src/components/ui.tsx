import React from "react";

export function Card({ children, className = "", glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return <div className={`card ${glow ? "glow" : ""} p-5 ${className}`}>{children}</div>;
}

export function Stat({ label, value, sub, tone = "default" }: { label: string; value: string; sub?: string; tone?: "default" | "up" | "down" | "gold" }) {
  const toneColor = tone === "up" ? "text-[var(--brand)]" : tone === "down" ? "text-[var(--danger)]" : tone === "gold" ? "text-[var(--gold)]" : "text-[var(--text)]";
  return (
    <div className="card p-5">
      <div className="text-[var(--muted)] text-xs uppercase tracking-wide">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${toneColor}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-[var(--muted)]">{sub}</div>}
    </div>
  );
}

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "up" | "down" | "gold" | "brand" }) {
  const map: Record<string, string> = {
    default: "bg-[var(--panel2)] text-[var(--muted)] border-[var(--border)]",
    up: "bg-[var(--brand)]/10 text-[var(--brand)] border-[var(--brand)]/30",
    down: "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30",
    gold: "bg-[var(--gold)]/10 text-[var(--gold)] border-[var(--gold)]/30",
    brand: "bg-[var(--brand2)]/10 text-[var(--brand2)] border-[var(--brand2)]/30",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}>{children}</span>;
}

export function Section({ title, desc, action, children }: { title: string; desc?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {desc && <p className="text-sm text-[var(--muted)]">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="text-[var(--gold)]" title={`${n} stars`}>
      {"★".repeat(Math.round(n))}<span className="text-[var(--border)]">{"★".repeat(5 - Math.round(n))}</span>
    </span>
  );
}

export function AIButton({ label = "Ask AI" }: { label?: string }) {
  return (
    <button className="btn btn-ghost text-xs !py-1.5 !px-3" type="button">
      <span className="text-gradient font-bold">✦ {label}</span>
    </button>
  );
}
