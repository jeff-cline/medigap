import type { Metadata } from "next";
import Logo from "@/components/agetech/Logo";
import DownloadPdfButton from "@/components/agetech/DownloadPdfButton";
import { FOUNDER } from "@/lib/jv-constants";
import "../agetech.css";

export const metadata: Metadata = {
  title: "R0cketShip AgeTech Growth Fund — Investment One-Sheet",
  description: "$100M to acquire AgeTech businesses generating $9M EBITDA — then compound it to ~$50M over four years with R0cketShip proprietary technology, predictive data and brand.",
};

const SITE = "https://medigap.plus/agetech";

function GuideLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} className="text-[var(--ag-cyan)] underline decoration-[var(--ag-cyan)]/40 hover:decoration-[var(--ag-cyan)]">{children}</a>;
}

// 5-year accretive EBITDA ramp (illustrative). Entry $9M → compounds as every driver repeats.
const RAMP = [
  { label: "Acquired", ebitda: 9, note: "entry" },
  { label: "Year 1", ebitda: 16, note: "+tech +data +expansion" },
  { label: "Year 2", ebitda: 22, note: "+scale engine, compounding" },
  { label: "Year 3", ebitda: 30, note: "accretion across the platform" },
  { label: "Year 4", ebitda: 50, note: "full Scale-Engine effect" },
];
const RAMP_MAX = 50;

export default function AgeTechOneSheet() {
  // Every moving piece, cited with its dollar value — the accretive drivers that repeat 5 yrs.
  const reasons = [
    { n: "01", t: "Acquire $9M of EBITDA", d: <>Deploy <b className="text-[var(--ag-text)]">$100M</b> to acquire AgeTech businesses generating <b className="text-[var(--ag-text)]">$9M in EBITDA</b> today — durable, cash-generative platforms serving the aging economy.</>, tag: "$9M base", tone: "cyan" },
    { n: "02", t: "Technology drives costs down", d: <>R0cketShip automation, demand engine and predictive routing cut cost — lifting the acquired <b className="text-[var(--ag-text)]">$9M EBITDA to $12M</b>.</>, tag: "+$3M", tone: "gold" },
    { n: "03", t: "New proprietary data → platform revenue", d: <>Each acquisition adds first-party data we monetize <b className="text-[var(--ag-text)]">across the entire ecosystem</b> — new revenue created beyond the target itself.</>, tag: "+$1M / yr", tone: "green" },
    { n: "04", t: "Multi-state, multi-channel expansion", d: <>Targets run in only a handful of states. Our tech + brand <b className="text-[var(--ag-text)]">open new states and channels</b>, expanding revenue well beyond the acquired footprint.</>, tag: "+$3M / yr", tone: "cyan" },
    { n: "05", t: "The AgeTech Capital Scale Engine", d: <>Layering technology, predictive data and the trusted brand across the business compounds sales and EBITDA — <b className="text-[var(--ag-text)]">strategic, accretive, and repeatable</b>.</>, tag: "+$3M / yr", tone: "gold" },
  ];
  const toneCls = (t: string) => t === "gold" ? "text-[var(--ag-gold)]" : t === "green" ? "text-[var(--ag-green)]" : "text-[var(--ag-cyan)]";

  return (
    <div className="ag-root min-h-screen">
      {/* screen-only toolbar */}
      <div className="ag-no-print sticky top-0 z-40 backdrop-blur bg-[var(--ag-bg)]/70 border-b border-[var(--ag-border)]">
        <div className="ag-sheet px-6 h-14 flex items-center justify-between">
          <a href="/agetech"><Logo size="sm" /></a>
          <div className="flex items-center gap-2">
            <a href="/agetech" className="ag-btn text-xs !py-1.5 !px-3">Interactive thesis ↗</a>
            <DownloadPdfButton className="text-xs !py-1.5 !px-4" />
          </div>
        </div>
      </div>

      <div className="ag-sheet ag-grid-bg px-8 py-10">
        {/* header */}
        <header className="flex items-start justify-between gap-4 border-b border-[var(--ag-border)] pb-6">
          <div>
            <Logo size="lg" />
            <div className="ag-mono text-xs tracking-[0.35em] text-[var(--ag-gold)] mt-2">AGETECH GROWTH FUND</div>
          </div>
          <div className="text-right">
            <div className="ag-chip inline-block">Executive Summary · Investment One-Sheet</div>
            <div className="text-[11px] text-[var(--ag-muted)] mt-2 ag-mono">Confidential · Illustrative</div>
          </div>
        </header>

        {/* thesis */}
        <section className="mt-6">
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">
            <span className="ag-gradient">$100M in. $9M EBITDA → ~$50M in four years.</span>
          </h1>
          <p className="mt-2.5 text-[var(--ag-muted)] leading-relaxed">
            10,000 Americans turn 65 every day. R0cketShip owns the trusted relationship layer. We buy <b className="text-[var(--ag-text)]">$9M of EBITDA</b>,
            then stack <b className="text-[var(--ag-text)]">five accretive drivers</b> — technology efficiency, new data, expansion and the Scale Engine —
            that <b className="text-[var(--ag-text)]">repeat and compound for five straight years</b>.
            <span className="block mt-1">Live model: <GuideLink href={`${SITE}#calculator`}>value calculator</GuideLink> · <GuideLink href={`${SITE}#portfolio`}>portfolio simulator</GuideLink> · <GuideLink href={`${SITE}#flywheel`}>the flywheel</GuideLink>.</span>
          </p>
        </section>

        {/* drivers + 5-year ramp */}
        <section className="mt-5 grid md:grid-cols-[1.25fr_1fr] gap-5 items-stretch">
          {/* the cited moving pieces */}
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-widest text-[var(--ag-muted)] mb-1">The moving pieces — each repeats & compounds for 5 years</div>
            {reasons.map((r) => (
              <div key={r.n} className="ag-panel p-3 flex items-start gap-3">
                <span className="ag-mono text-sm text-[var(--ag-muted)] mt-0.5">{r.n}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[14px]">{r.t}</span>
                    <span className={`ag-mono text-xs whitespace-nowrap ${toneCls(r.tone)}`}>{r.tag}</span>
                  </div>
                  <p className="text-[12px] text-[var(--ag-muted)] leading-snug mt-0.5">{r.d}</p>
                </div>
              </div>
            ))}
          </div>

          {/* the 5-year EBITDA ramp */}
          <div className="ag-panel p-5 flex flex-col">
            <div className="text-[11px] uppercase tracking-widest text-[var(--ag-muted)]">EBITDA ramp · accretive compounding</div>
            <div className="mt-4 space-y-2.5 flex-1">
              {RAMP.map((r, i) => (
                <div key={r.label}>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className={i === 0 ? "text-[var(--ag-muted)]" : "text-[var(--ag-text)] font-medium"}>{r.label}</span>
                    <span className={`ag-mono font-bold ${i === RAMP.length - 1 ? "text-[var(--ag-gold)] text-base" : i === 0 ? "text-[var(--ag-muted)]" : "text-[var(--ag-cyan)]"}`}>${r.ebitda}M</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--ag-border)] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(r.ebitda / RAMP_MAX) * 100}%`, background: i === 0 ? "#33415f" : i === RAMP.length - 1 ? "linear-gradient(90deg,#38e1ff,#d8b46a)" : "#38e1ff" }} />
                  </div>
                  <div className="text-[10px] text-[var(--ag-muted)] mt-0.5">{r.note}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl p-3 text-center" style={{ background: "linear-gradient(110deg, rgba(56,225,255,.12), rgba(216,180,106,.12))" }}>
              <div className="ag-mono text-xl font-bold ag-gradient">$9M → ~$50M EBITDA</div>
              <div className="text-[10px] text-[var(--ag-muted)] mt-0.5">~5.5× EBITDA growth · driven by the accretive value of all the pieces</div>
            </div>
          </div>
        </section>

        {/* why rocketship */}
        <section className="mt-5 grid grid-cols-3 gap-3">
          {[
            ["Proprietary Technology", "Automation + demand engine that drives cost down and sales up."],
            ["Predictive Data", "First-party data & scoring that compounds with every acquisition."],
            ["Trusted Brand", "The relationship layer for 10,000 Americans turning 65 daily."],
          ].map(([t, d]) => (
            <div key={t} className="ag-panel p-3">
              <div className="font-semibold text-[13px]">{t}</div>
              <div className="text-[11px] text-[var(--ag-muted)] mt-0.5 leading-snug">{d}</div>
            </div>
          ))}
        </section>

        {/* drill-in band */}
        <section className="mt-5 ag-panel p-3.5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px]">Drill into the live, interactive thesis →</span>
          <div className="flex flex-wrap gap-3 text-[13px]">
            <GuideLink href={`${SITE}#ecosystem`}>Ecosystem</GuideLink>
            <GuideLink href={`${SITE}#calculator`}>Value Calculator</GuideLink>
            <GuideLink href={`${SITE}#portfolio`}>Portfolio Simulator</GuideLink>
            <GuideLink href={`${SITE}#flywheel`}>Flywheel</GuideLink>
            <GuideLink href={`${SITE}#invest`}>Roadmap</GuideLink>
            <GuideLink href="https://medigap.plus/book">Book a call</GuideLink>
          </div>
        </section>

        {/* footer — founder info */}
        <footer className="mt-6 pt-4 border-t border-[var(--ag-border)] flex flex-wrap items-end justify-between gap-4">
          <div>
            <Logo size="sm" />
            <div className="text-[13px] mt-2"><b className="text-[var(--ag-text)]">{FOUNDER.name}</b> · {FOUNDER.title} &amp; CEO</div>
            <div className="ag-mono text-[12px] text-[var(--ag-muted)] mt-1">
              {FOUNDER.email} · ({FOUNDER.cell.slice(0, 3)}) {FOUNDER.cell.slice(3, 6)}-{FOUNDER.cell.slice(6)}<br />
              R0cketShip.com · <GuideLink href={SITE}>medigap.plus/agetech</GuideLink> · <GuideLink href="https://medigap.plus/book">book a call</GuideLink>
            </div>
          </div>
          <div className="text-right text-[10px] text-[var(--ag-muted)] max-w-xs">
            Illustrative assumptions only. Not an offer to sell securities and not investment advice. Figures are projected scenarios, not historical results.
          </div>
        </footer>
      </div>

      <div className="ag-no-print text-center pb-10">
        <DownloadPdfButton />
      </div>
    </div>
  );
}
