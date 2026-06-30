import { redirect } from "next/navigation";
import "../doublewide/doublewide.css";
import { getSession } from "@/lib/auth";
import { socialTrends } from "@/lib/social";
import DwLogo from "@/components/doublewide/DwLogo";
import { num } from "@/lib/format";

export const dynamic = "force-dynamic";

const platformIcon = (p: string) => (p === "instagram" ? "📸" : p === "x" ? "𝕏" : "📘");

// Inline SVG sparkline of a follower series.
function Spark({ data, w = 150, h = 34 }: { data: number[]; w?: number; h?: number }) {
  if (!data || data.length < 2) return <span className="text-[10px] text-[var(--dw-muted)]">—</span>;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 3 - ((v - min) / range) * (h - 6)}`).join(" ");
  const upTrend = data[data.length - 1] >= data[0];
  const stroke = upTrend ? "#3f9d77" : "#d9534f";
  return (
    <svg width={w} height={h} className="inline-block align-middle">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Delta({ n }: { n: number }) {
  if (!n) return <span className="text-[var(--dw-muted)] text-sm">±0</span>;
  const up = n > 0;
  return <span className="text-sm font-bold" style={{ color: up ? "#3f9d77" : "#d9534f" }}>{up ? "▲" : "▼"} {num(Math.abs(n))}</span>;
}

export default async function GrowthPage() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.mustChangePassword) redirect("/change-password");
  if (!["growth", "god", "marketing"].includes(s.role)) redirect("/login");

  const t = await socialTrends();
  const pct = (now: number, d: number) => (now - d > 0 ? ((d / (now - d)) * 100).toFixed(1) : "0.0");

  return (
    <div className="dw-root">
      {/* header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-[var(--dw-border)]">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <DwLogo />
            <span className="dw-chip">🚀 Powered by R0cketShip</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--dw-muted)]">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--dw-green)] animate-pulse" /> Live · {s.email}
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-8">
        <span className="dw-chip">DoubleWide.ai · Creator Growth Network</span>
        <h1 className="mt-5 text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
          Growth, <span className="dw-grad">live.</span> <span className="dw-float inline-block">🚀</span>
        </h1>
        <p className="mt-4 text-lg text-[var(--dw-muted)] max-w-2xl">
          Every creator. Every platform. Every follower — tracked in real time on the R0cketShip Core. This is the
          DoubleWide network compounding, day by day.
        </p>
        <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--dw-muted)]">Total audience</div>
            <div className="text-5xl font-bold dw-grad">{num(t.totals.followers)}</div>
          </div>
          <div className="pb-1">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--dw-muted)]">This week</div>
            <div className="text-2xl font-bold" style={{ color: "#3f9d77" }}>▲ {num(t.totals.dWeek)}</div>
          </div>
          <div className="pb-1">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--dw-muted)]">This month</div>
            <div className="text-2xl font-bold" style={{ color: "#3f9d77" }}>▲ {num(t.totals.dMonth)}</div>
          </div>
        </div>
      </section>

      {/* stat cards */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            ["Accounts", num(t.pages.length), "in the network"],
            ["Followers", num(t.totals.followers), "total reach"],
            ["+ 24 hours", num(t.totals.dDay), `${pct(t.totals.followers, t.totals.dDay)}% day`],
            ["+ 30 days", num(t.totals.dMonth), `${pct(t.totals.followers, t.totals.dMonth)}% month`],
          ].map(([label, val, sub]) => (
            <div key={label} className="dw-card p-5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--dw-muted)]">{label}</div>
              <div className="text-3xl font-bold mt-1">{val}</div>
              <div className="text-xs text-[var(--dw-muted)] mt-1">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* growth table */}
      <section className="mx-auto max-w-6xl px-6 mt-10">
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-2xl font-bold">The network <span className="dw-gold">by day · week · month</span></h2>
          {t.sample && <span className="dw-chip">👀 Preview · sample data</span>}
        </div>
        <div className="dw-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.14em] text-[var(--dw-muted)] border-b border-[var(--dw-border)]">
                <th className="text-left p-4">Creator / Page</th>
                <th className="text-right p-4">Followers</th>
                <th className="text-right p-4">24h</th>
                <th className="text-right p-4">7 days</th>
                <th className="text-right p-4">30 days</th>
                <th className="text-right p-4 pr-5">30-day trend</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--dw-border)]" style={{ background: "var(--dw-bg2)" }}>
                <td className="p-4 font-bold">★ Whole network</td>
                <td className="p-4 text-right tabular-nums font-bold">{num(t.totals.followers)}</td>
                <td className="p-4 text-right"><Delta n={t.totals.dDay} /></td>
                <td className="p-4 text-right"><Delta n={t.totals.dWeek} /></td>
                <td className="p-4 text-right"><Delta n={t.totals.dMonth} /></td>
                <td className="p-4" />
              </tr>
              {t.pages.map((p) => (
                <tr key={p.pageId} className="border-b border-[var(--dw-border)] last:border-0 hover:bg-[var(--dw-bg2)]">
                  <td className="p-4 font-semibold">{platformIcon(p.platform)} {p.pageName || p.pageId}</td>
                  <td className="p-4 text-right tabular-nums">{num(p.followers)}</td>
                  <td className="p-4 text-right"><Delta n={p.dDay} /></td>
                  <td className="p-4 text-right"><Delta n={p.dWeek} /></td>
                  <td className="p-4 text-right"><Delta n={p.dMonth} /></td>
                  <td className="p-4 text-right pr-5"><Spark data={p.series} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {t.sample && <p className="text-xs text-[var(--dw-muted)] mt-3">This is sample data so you can see the experience. Real account numbers populate automatically once the Doublewide pages are connected — the dashboard refreshes itself every day.</p>}
      </section>

      {/* why this is exciting */}
      <section className="mx-auto max-w-6xl px-6 mt-14">
        <h2 className="text-2xl font-bold mb-1">Why this is so exciting</h2>
        <p className="text-[var(--dw-muted)] mb-6">DoubleWide.ai sits on the R0cketShip Core — so audience growth, leads, and revenue all live in one place.</p>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["📈", "One network, compounding", "Every creator's growth rolls up into a single audience number that climbs every single day — you watch the whole network compound in real time."],
            ["🎯", "Followers → leads → revenue", "This isn't vanity reach. On the Core, every follower can become a tracked lead and an attributed dollar — you see exactly which creator drove which customer."],
            ["🚀", "Built on R0cketShip", "DoubleWide is one business on the R0cketShip Core — the same engine that powers lead routing, monetization, and growth across the whole platform."],
          ].map(([icon, title, body]) => (
            <div key={title} className="dw-soft p-6">
              <div className="text-2xl">{icon}</div>
              <div className="text-lg font-bold mt-3">{title}</div>
              <p className="text-sm text-[var(--dw-muted)] mt-2 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer className="mx-auto max-w-6xl px-6 mt-16 mb-10 pt-8 border-t border-[var(--dw-border)] flex flex-wrap items-center justify-between gap-4">
        <DwLogo size="sm" />
        <span className="dw-chip">🚀 Powered by R0cketShip</span>
        <span className="text-xs text-[var(--dw-muted)]">© 2026 Doublewide.ai · A R0cketShip company · View-only report</span>
      </footer>
    </div>
  );
}
