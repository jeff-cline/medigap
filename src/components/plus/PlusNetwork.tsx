"use client";

import { useMemo, useState } from "react";
import { useRecaptcha, RecaptchaNotice } from "@/components/Recaptcha";

/* ─────────────────────────────────────────────────────────────────────────
   The Plus Network — interactive accretive-value model.

   Economics, all stated on the page so nothing is hidden:
     · $60 acquires a call, sold at $80 (contracted 1-800-MEDIGAP rate)
     · +18% free sellable repeat calls the brand throws off at $0 CAC
     · Once a customer is inside the stack, moving them across the network
       carries 12% marginal expense → 88% drops to profit (no ad tax)
     · Over 10 years a customer touches N companies; the entry touch is
       already counted in direct revenue, so incremental = N − 1
   ───────────────────────────────────────────────────────────────────────── */

const CPA = 60;
const SALE = 80;
const FREE_REPEAT = 0.18;
const MARGINAL_EXPENSE = 0.12;

/** Gold — Plus Network owned .plus portals. Market sizes $T from the memorandum. */
const PORTALS = [
  { name: "retreats", market: 2.1, sector: "Wellness" },
  { name: "mortgages", market: 1.7, sector: "Mortgage" },
  { name: "socialsecurity", market: 1.4, sector: "Retirement" },
  { name: "cruise", market: 1.3, sector: "Travel" },
  { name: "medigap", market: 1.1, sector: "Medicare" },
  { name: "vehicles", market: 1.0, sector: "Automotive" },
  { name: "computers", market: 0.6, sector: "Technology" },
  { name: "attorney", market: 0.4, sector: "Legal" },
  { name: "accountant", market: 0.1, sector: "Accounting" },
  { name: "makeup", market: 0.1, sector: "Beauty" },
];

/** Teal — holding-company-owned properties. */
const HOLDINGS = [
  "adseyewear", "quuik", "siimpler", "roatan", "kardiaguard", "mammo.express",
  "whartonjelly", "iexosomes", "2xinvesting", "keywordcalls",
  "weightlosslollipops", "beyondlimits",
];

/** Purple — external joint ventures & partners (unnamed in the memorandum). */
const JV_ICONS = ["🏥", "💊", "🏦", "🏠", "🚗", "⚖️", "🛍️", "💻", "🎓", "🏋️", "👓", "🧬"];

const usd = (n: number, dp = 0) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

function compact(n: number) {
  if (Math.abs(n) >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (Math.abs(n) >= 1e3) return "$" + Math.round(n / 1e3) + "K";
  return "$" + Math.round(n);
}
const num = (n: number) =>
  n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(Math.round(n));

export default function PlusNetwork() {
  const [capital, setCapital] = useState(12_000_000);
  const [touches, setTouches] = useState(10);
  const [marginalSale, setMarginalSale] = useState(80);
  const [gateOpen, setGateOpen] = useState(false);

  const m = useMemo(() => {
    const acquired = capital / CPA;
    const sellable = acquired * (1 + FREE_REPEAT);
    const directRev = sellable * SALE;
    const directProfit = directRev - capital;

    const incTouches = acquired * Math.max(0, touches - 1);
    const netRev = incTouches * marginalSale;
    const netCost = netRev * MARGINAL_EXPENSE;
    const netProfit = netRev - netCost;

    const totalRev = directRev + netRev;
    const totalProfit = directProfit + netProfit;

    return {
      acquired, sellable, directRev, directProfit,
      incTouches, netRev, netCost, netProfit,
      totalRev, totalProfit,
      blended: totalRev > 0 ? totalProfit / totalRev : 0,
      multiple: capital > 0 ? totalProfit / capital : 0,
      perPortal: netRev / Math.max(1, touches - 1),
    };
  }, [capital, touches, marginalSale]);

  // Intensity drives the diagram's glow as capital scales.
  const intensity = Math.min(1, Math.max(0.12, capital / 50_000_000));

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <header className="mx-auto max-w-6xl px-6 pt-14 pb-10">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          <span className="text-lg">🚀</span>
          <span>R0cket<span className="text-gold">Ship</span></span>
        </div>
        <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
          Confidential investment memorandum
        </p>
        <h1 className="mt-3 font-serif text-5xl leading-none tracking-tight sm:text-6xl">
          The <span className="text-gold">Plus</span> Network
        </h1>
        <p className="mt-3 text-lg italic text-muted">
          A predictive-data roll-up — anchored by 1-800-MEDIGAP
        </p>
        <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-muted">
          One company consolidating R0cketShip&rsquo;s IP, a portfolio of top-of-funnel portals and
          controlled joint ventures — sitting in front of <b className="text-text">~$9.8 trillion</b> of
          U.S. demand, monetized through a 10-year-proven acquisition asset, and already revenue-positive.
        </p>
        <p className="mt-5 text-[15px]">
          Raising <b className="text-gold">$12M</b> · $60M post ·{" "}
          <b className="text-brand">~4&times;</b> to early investors at a year 3&ndash;5 PE step-in
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => setGateOpen(true)}
            className="rounded-lg bg-gold px-6 py-3 text-sm font-bold text-[#1a1406] transition hover:brightness-110"
          >
            Download the memorandum (PDF)
          </button>
          <a
            href="#model"
            className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-text transition hover:bg-panel"
          >
            Run the numbers
          </a>
        </div>
      </header>

      {/* ── The arbitrage ──────────────────────────────────────── */}
      <section className="border-y border-border bg-panel/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-12 sm:grid-cols-3">
          {[
            ["$380B", "Paid every year to acquire customers — the ad tax on U.S. business"],
            ["$0", "The Plus Network's share of it. We are not the advertiser — we are the destination"],
            ["88%", "Of every in-network sale drops to profit once the customer is already inside"],
          ].map(([n, l]) => (
            <div key={l as string}>
              <div className="font-serif text-4xl text-gold">{n}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The model ──────────────────────────────────────────── */}
      <section id="model" className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
          The accretive engine
        </p>
        <h2 className="mt-3 font-serif text-4xl leading-tight">
          Move the capital. Watch the network compound.
        </h2>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted">
          We pay once to bring a consumer in the front door. From that moment, moving them across every
          portal, owned property and joint venture carries no ad tax — just <b className="text-text">12%
          marginal expense</b>. The rest is margin that stays inside the portfolio.
        </p>

        {/* Controls */}
        <div className="mt-8 rounded-2xl border border-border bg-panel p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
              Marketing capital deployed
            </span>
            <span className="font-serif text-4xl text-brand tabular-nums">
              {compact(capital)}
              <span className="ml-1 font-sans text-sm font-semibold text-muted">/ year</span>
            </span>
          </div>
          <input
            type="range"
            min={500_000}
            max={50_000_000}
            step={250_000}
            value={capital}
            onChange={(e) => setCapital(+e.target.value)}
            aria-label="Marketing capital deployed per year"
            className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-[#0d3b31] to-brand accent-brand"
          />
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>$500K</span>
            <span>$50M</span>
          </div>

          <div className="mt-6 grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-muted">
                Companies each customer touches over 10 years
              </span>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range" min={2} max={20} step={1} value={touches}
                  onChange={(e) => setTouches(+e.target.value)}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-gold"
                />
                <span className="w-8 text-right font-serif text-xl text-gold tabular-nums">{touches}</span>
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted">
                Marginal sale value per touch
              </span>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range" min={10} max={400} step={5} value={marginalSale}
                  onChange={(e) => setMarginalSale(+e.target.value)}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-gold"
                />
                <span className="w-16 text-right font-serif text-xl text-gold tabular-nums">
                  ${marginalSale}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Two-stage results */}
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {/* Stage 1 */}
          <div className="rounded-2xl border border-border bg-panel p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Stage 1 · 1-800-MEDIGAP — the anchor
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Stat label="Calls acquired / yr" value={num(m.acquired)} />
              <Stat label="Sellable (incl. free repeats)" value={num(m.sellable)} />
              <Stat label="Direct revenue" value={compact(m.directRev)} tone="brand" />
              <Stat label="Direct profit" value={compact(m.directProfit)} tone="gold" />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              {usd(CPA)} acquires a call sold at {usd(SALE)}, plus {Math.round(FREE_REPEAT * 100)}% free
              sellable repeats the brand earns at zero acquisition cost.
            </p>
          </div>

          {/* Stage 2 */}
          <div className="rounded-2xl border border-brand/40 bg-gradient-to-br from-[#0b2620] to-panel p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
              Stage 2 · Inside the stack — 10-year accretive value
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Stat label={`Incremental touches (${touches - 1}/customer)`} value={num(m.incTouches)} />
              <Stat label="Network revenue" value={compact(m.netRev)} tone="brand" />
              <Stat label="Marginal cost @ 12%" value={compact(m.netCost)} />
              <Stat label="Network profit @ 88%" value={compact(m.netProfit)} tone="gold" />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              The entry touch is already counted in Stage 1, so only {touches - 1} incremental touches are
              modeled here — no double counting.
            </p>
          </div>
        </div>

        {/* Profit split bar */}
        <div className="mt-6 rounded-2xl border border-border bg-panel p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Where every in-network dollar goes
            </span>
            <span className="text-sm text-muted">
              on {compact(m.netRev)} of network revenue
            </span>
          </div>
          <div className="mt-4 flex h-9 overflow-hidden rounded-lg bg-[#0a0f16]">
            <div
              className="flex items-center justify-center bg-gradient-to-r from-[#6b4d12] to-gold text-[11px] font-bold text-[#1a1406]"
              style={{ width: `${MARGINAL_EXPENSE * 100}%` }}
            >
              12%
            </div>
            <div className="flex items-center justify-center bg-gradient-to-r from-[#0d5f4c] to-brand text-[12px] font-bold text-[#04150f]">
              88% profit — {compact(m.netProfit)}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-5 text-xs text-muted">
            <span><i className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-gold align-[-1px]" />Marginal expense</span>
            <span><i className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-brand align-[-1px]" />Profit retained in the portfolio</span>
          </div>
        </div>

        {/* Totals */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Big label="10-year revenue" value={compact(m.totalRev)} tone="brand" />
          <Big label="10-year profit" value={compact(m.totalProfit)} tone="gold" />
          <Big label="Blended margin" value={`${(m.blended * 100).toFixed(0)}%`} />
          <Big label="Return on capital" value={`${m.multiple.toFixed(1)}×`} tone="brand" />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Modeled on one year&rsquo;s cohort of {num(m.acquired)} acquired customers followed for ten years.
          Roughly <b className="text-text">{compact(m.perPortal)}</b> of that network revenue accrues to each
          additional company the customer touches.
        </p>
      </section>

      {/* ── Network diagram ────────────────────────────────────── */}
      <section className="border-y border-border bg-panel/30 py-14">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">The network</p>
          <h2 className="mt-3 font-serif text-4xl leading-tight">
            One engine. Every industry&rsquo;s <span className="text-gold">front door.</span>
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] text-muted">
            R0cketShip&rsquo;s predictive-data engine at the centre, the owned <b className="text-gold">.plus</b>{" "}
            portals around it, holding-company properties beyond that, and external joint ventures on the rim.
            Flow intensity tracks the capital you deploy above.
          </p>

          <div className="mt-8 overflow-x-auto">
            <Diagram intensity={intensity} perPortal={m.perPortal} />
          </div>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <Legend color="#f3c969" label="Plus Network owned .plus portals" />
            <Legend color="#16d6a5" label="Holding-company-owned properties" />
            <Legend color="#9085e9" label="Joint ventures & partners" />
          </div>
        </div>
      </section>

      {/* ── Download ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">The full memorandum</p>
        <h2 className="mt-3 font-serif text-4xl leading-tight">
          Sixteen pages. The whole thesis.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
          Traction already contracted, the five-year plan to $110M revenue and $42M EBITDA, the
          public-company JV, valuation comps and the indicative term sheet.
        </p>
        <button
          onClick={() => setGateOpen(true)}
          className="mt-7 rounded-lg bg-gold px-8 py-4 text-base font-bold text-[#1a1406] transition hover:brightness-110"
        >
          Download the memorandum
        </button>
        <p className="mt-3 text-xs text-muted">PDF · 16 pages · confidential</p>
      </section>

      <footer className="border-t border-border px-6 py-10 text-center text-xs leading-relaxed text-muted">
        <p className="mx-auto max-w-3xl">
          Illustrative management projections using the stated assumptions — not booked revenue, not an
          offer to sell securities, and not a guarantee of future performance. The accretive model assumes
          each acquired customer transacts with {touches} companies across the network over ten years at{" "}
          {usd(marginalSale)} per marginal sale and 12% marginal expense. Actual results will vary.
        </p>
        <p className="mt-4">R0cketShip · The Plus Network · jeff.cline@me.com</p>
      </footer>

      {gateOpen && <Gate onClose={() => setGateOpen(false)} />}
    </div>
  );
}

/* ── Small presentational pieces ─────────────────────────────── */

function Stat({ label, value, tone }: { label: string; value: string; tone?: "brand" | "gold" }) {
  const c = tone === "brand" ? "text-brand" : tone === "gold" ? "text-gold" : "text-text";
  return (
    <div>
      <div className={`font-serif text-2xl tabular-nums ${c}`}>{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

function Big({ label, value, tone }: { label: string; value: string; tone?: "brand" | "gold" }) {
  const c = tone === "brand" ? "text-brand" : tone === "gold" ? "text-gold" : "text-text";
  return (
    <div className="rounded-2xl border border-border bg-panel p-5">
      <div className={`font-serif text-3xl tabular-nums ${c}`}>{value}</div>
      <div className="mt-2 text-[11px] uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-muted">
      <i className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

/* ── The network diagram ─────────────────────────────────────── */

function Diagram({ intensity, perPortal }: { intensity: number; perPortal: number }) {
  const CX = 500, CY = 430;
  const ring = (r: number, n: number, i: number, offset = -Math.PI / 2) => {
    const a = offset + (i / n) * Math.PI * 2;
    return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
  };
  const money = (n: number) =>
    n >= 1e6 ? "$" + (n / 1e6).toFixed(1) + "M" : "$" + Math.round(n / 1e3) + "K";

  return (
    <svg viewBox="0 0 1000 860" className="min-w-[760px] w-full" role="img"
         aria-label="The Plus Network — R0cketShip predictive-data engine at the centre">
      <defs>
        <radialGradient id="coreGlow">
          <stop offset="0%" stopColor="#f3c969" stopOpacity={0.55 * intensity + 0.2} />
          <stop offset="100%" stopColor="#f3c969" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={CX} cy={CY} r={230} fill="url(#coreGlow)" />

      {/* JV spokes + nodes */}
      {JV_ICONS.map((ic, i) => {
        const p = ring(395, JV_ICONS.length, i, -Math.PI / 2 + 0.26);
        return (
          <g key={`jv${i}`}>
            <line x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="#9085e9"
                  strokeOpacity={0.1 + 0.2 * intensity} strokeWidth="1" />
            <circle cx={p.x} cy={p.y} r="17" fill="#1a1630" stroke="#9085e9" strokeWidth="1.5" />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="15">{ic}</text>
          </g>
        );
      })}

      {/* Holding-company properties */}
      {HOLDINGS.map((h, i) => {
        const p = ring(288, HOLDINGS.length, i, -Math.PI / 2 + 0.13);
        return (
          <g key={h}>
            <line x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="#16d6a5"
                  strokeOpacity={0.12 + 0.25 * intensity} strokeWidth="1" />
            <circle cx={p.x} cy={p.y} r="21" fill="#0c211d" stroke="#16d6a5" strokeWidth="1.5"
                    strokeOpacity={0.5 + 0.4 * intensity} />
            <text x={p.x} y={p.y + 37} textAnchor="middle" fontSize="10.5" fill="#93a0b5">{h}</text>
          </g>
        );
      })}

      {/* Owned .plus portals */}
      {PORTALS.map((pt, i) => {
        const p = ring(163, PORTALS.length, i);
        const r = 30 + pt.market * 8;
        return (
          <g key={pt.name}>
            <line x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="#f3c969"
                  strokeOpacity={0.3 + 0.5 * intensity} strokeWidth={1.5 + 2 * intensity} />
            <circle cx={p.x} cy={p.y} r={r} fill="#f3c969" fillOpacity={0.9} />
            {/* Scale the label so long names (socialsecurity, accountant) stay inside the circle. */}
            <text
              x={p.x} y={p.y - 1} textAnchor="middle" fontWeight="700" fill="#1a1406"
              fontSize={Math.min(12.5, (r * 1.75) / Math.max(1, pt.name.length) * 1.55)}
            >
              {pt.name}
            </text>
            <text x={p.x} y={p.y + 12} textAnchor="middle" fontSize="9.5" fill="#4a3a12">.plus</text>
            <text x={p.x} y={p.y + r + 15} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#f3c969">
              ${pt.market.toFixed(1)}T
            </text>
            <text x={p.x} y={p.y + r + 28} textAnchor="middle" fontSize="9.5" fill="#6f7d92">
              {money(perPortal)} accretive
            </text>
          </g>
        );
      })}

      {/* Core */}
      <circle cx={CX} cy={CY} r="74" fill="#f3c969" />
      <text x={CX} y={CY - 6} textAnchor="middle" fontSize="26">🚀</text>
      <text x={CX} y={CY + 18} textAnchor="middle" fontSize="14" fontWeight="800" fill="#1a1406">
        R0cketShip
      </text>
      <text x={CX} y={CY + 32} textAnchor="middle" fontSize="8" fontWeight="700"
            letterSpacing="0.5" fill="#4a3a12">
        PREDICTIVE-DATA ENGINE
      </text>
    </svg>
  );
}

/* ── Download gate ───────────────────────────────────────────── */

function Gate({ onClose }: { onClose: () => void }) {
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  // Action name must match the form id passed to guardForm on the server.
  const captcha = useRecaptcha("plus_access");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd) as Record<string, string>;
    if (!body.accredited) { setErr("Please tell us whether you're an accredited investor."); return; }
    setSending(true);
    try {
      const recaptchaToken = await captcha.getToken();
      const res = await fetch("/api/plus-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, recaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setDone(true);
      window.location.href = data.file;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="gate-title"
           className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-panel p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
              Confidential memorandum
            </p>
            <h3 id="gate-title" className="mt-1 font-serif text-2xl">Request the PDF</h3>
          </div>
          <button onClick={onClose} aria-label="Close"
                  className="-mr-1 text-2xl leading-none text-muted hover:text-text">&times;</button>
        </div>

        {done ? (
          <div className="mt-6">
            <p className="text-sm text-brand">
              Thank you — your download is starting.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              The fastest next step is a private conversation. Pick a time that suits you and
              it goes straight into the founder&rsquo;s calendar.
            </p>
            {/* /book is the existing branded scheduling page on this host (Calendly embed + phone fallback). */}
            <a
              href="/book"
              className="mt-5 block rounded-lg bg-gold py-3 text-center text-sm font-bold text-[#1a1406] transition hover:brightness-110"
            >
              Book a Call with the Founder
            </a>
            <p className="mt-3 text-center text-xs text-muted">
              Prefer to talk now? Call{" "}
              <a href="tel:18006334427" className="font-semibold text-gold hover:underline">
                1-800-MEDIGAP
              </a>
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg border border-border py-2.5 text-xs font-semibold text-muted transition hover:bg-bg hover:text-text"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field name="name" label="Full name" required />
            <Field name="email" label="Email" type="email" required />
            <Field name="phone" label="Phone number" type="tel" required />

            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-muted">
                Are you an accredited investor?
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {[["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]].map(([v, l]) => (
                  <label key={v}
                         className="cursor-pointer rounded-lg border border-border bg-bg px-3 py-2 text-center text-sm
                                    transition has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:checked]:text-gold">
                    <input type="radio" name="accredited" value={v} className="sr-only" />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>

            <input type="text" name="company_website" tabIndex={-1} autoComplete="off"
                   aria-hidden="true" className="absolute -left-[9999px] opacity-0" />

            {err && <p className="text-sm text-danger">{err}</p>}

            <button type="submit" disabled={sending}
                    className="w-full rounded-lg bg-gold py-3 text-sm font-bold text-[#1a1406] transition hover:brightness-110 disabled:opacity-50">
              {sending ? "Sending…" : "Get the memorandum"}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-muted">
              Confidential. Not an offer to sell securities. We&rsquo;ll only contact you about this opportunity.
            </p>
            <RecaptchaNotice className="text-center" />
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ name, label, type = "text", required }: {
  name: string; label: string; type?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <input
        name={name} type={type} required={required} autoComplete={
          name === "name" ? "name" : name === "email" ? "email" : name === "phone" ? "tel" : "off"
        }
        className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text
                   outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/25"
      />
    </label>
  );
}
