import type { Metadata } from "next";
import Logo from "@/components/agetech/Logo";
import DownloadPdfButton from "@/components/agetech/DownloadPdfButton";
import { FOUNDER } from "@/lib/jv-constants";
import "../agetech.css";

export const metadata: Metadata = {
  title: "R0cketShip AgeTech Growth Fund — Investment One-Sheet",
  description: "$100M to acquire AgeTech businesses generating $9M EBITDA — then compound it to $12M+ with R0cketShip proprietary technology, predictive data and brand.",
};

const SITE = "https://medigap.plus/agetech";

// Clickable deep-link into the interactive thesis.
function GuideLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} className="text-[var(--ag-cyan)] underline decoration-[var(--ag-cyan)]/40 hover:decoration-[var(--ag-cyan)]">{children}</a>;
}

export default function AgeTechOneSheet() {
  const reasons = [
    { n: "01", t: "Acquire $9M of EBITDA", d: <>Deploy <b className="text-[var(--ag-text)]">$100M</b> to acquire AgeTech businesses generating <b className="text-[var(--ag-text)]">$9M in EBITDA</b> today — durable, cash-generative platforms serving the aging economy.</>, tag: "$9M EBITDA", tone: "cyan" },
    { n: "02", t: "New proprietary data → platform revenue", d: <>Each acquisition adds first-party data we monetize <b className="text-[var(--ag-text)]">across the entire ecosystem</b> — an estimated <b className="text-[var(--ag-text)]">+$1M / year</b> of new revenue created beyond the target itself.</>, tag: "+$1M / yr data", tone: "green" },
    { n: "03", t: "Technology drives costs down", d: <>R0cketShip&apos;s automation, demand engine and predictive routing cut cost — lifting the acquired <b className="text-[var(--ag-text)]">$9M EBITDA to $12M</b>, a <b className="text-[var(--ag-text)]">+$3M</b> efficiency gain.</>, tag: "+$3M → $12M", tone: "gold" },
    { n: "04", t: "Multi-state, multi-channel expansion", d: <>Targets operate in only a handful of states. Our technology and brand let us <b className="text-[var(--ag-text)]">open new states and channels</b>, expanding revenue well beyond the acquired footprint.</>, tag: "Geographic upside", tone: "cyan" },
    { n: "05", t: "A perfect target for the Scale Engine", d: <>Layering R0cketShip technology, predictive data and the trusted brand across the business <b className="text-[var(--ag-text)]">increases sales and compounds EBITDA</b> — strategic, accretive, and repeatable.</>, tag: "Accretive & repeatable", tone: "green" },
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
        <section className="mt-7">
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">
            <span className="ag-gradient">$100M to compound the aging economy.</span>
          </h1>
          <p className="mt-3 text-[var(--ag-muted)] leading-relaxed">
            10,000 Americans turn 65 every day. R0cketShip owns the trusted relationship layer — and turns every acquisition into a
            growing, multi-channel, data-rich asset. We buy <b className="text-[var(--ag-text)]">$9M of EBITDA</b>, then use our
            <b className="text-[var(--ag-text)]"> proprietary technology, predictive data and brand</b> to compound it.
            <span className="block mt-1">Explore the live model: <GuideLink href={`${SITE}#calculator`}>value calculator</GuideLink> · <GuideLink href={`${SITE}#portfolio`}>portfolio simulator</GuideLink> · <GuideLink href={`${SITE}#flywheel`}>the flywheel</GuideLink>.</span>
          </p>
        </section>

        {/* the value-creation stack */}
        <section className="mt-6 grid md:grid-cols-[1.4fr_1fr] gap-5 items-stretch">
          <div className="space-y-2.5">
            {reasons.map((r) => (
              <div key={r.n} className="ag-panel p-3.5 flex items-start gap-3">
                <span className="ag-mono text-sm text-[var(--ag-muted)] mt-0.5">{r.n}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{r.t}</span>
                    <span className={`ag-mono text-xs whitespace-nowrap ${toneCls(r.tone)}`}>{r.tag}</span>
                  </div>
                  <p className="text-[13px] text-[var(--ag-muted)] leading-snug mt-1">{r.d}</p>
                </div>
              </div>
            ))}
          </div>

          {/* the math waterfall */}
          <div className="ag-panel p-5 flex flex-col">
            <div className="text-[11px] uppercase tracking-widest text-[var(--ag-muted)]">The value-creation math</div>
            <div className="mt-3 space-y-3 flex-1">
              <Row label="Acquired EBITDA" val="$9M" tone="text" />
              <Row label="+ Technology efficiency" val="+$3M" tone="gold" />
              <div className="border-t border-[var(--ag-border)] pt-3"><Row label="Optimized EBITDA" val="$12M" tone="cyan" big /></div>
              <Row label="+ New platform data revenue" val="+$1M / yr" tone="green" />
              <Row label="+ Multi-state / multi-channel" val="Upside" tone="green" />
            </div>
            <div className="mt-4 rounded-xl p-3 text-center" style={{ background: "linear-gradient(110deg, rgba(56,225,255,.12), rgba(216,180,106,.12))" }}>
              <div className="text-[11px] uppercase tracking-widest text-[var(--ag-muted)]">Entry</div>
              <div className="ag-mono text-2xl font-bold ag-gradient">$100M → $9M EBITDA</div>
              <div className="text-[11px] text-[var(--ag-muted)] mt-1">compounding to $12M+ and growing</div>
            </div>
          </div>
        </section>

        {/* why rocketship */}
        <section className="mt-6 grid grid-cols-3 gap-3">
          {[
            ["Proprietary Technology", "Automation + demand engine that drives cost down and sales up."],
            ["Predictive Data", "First-party data & scoring that compounds with every acquisition."],
            ["Trusted Brand", "The relationship layer for 10,000 Americans turning 65 daily."],
          ].map(([t, d]) => (
            <div key={t} className="ag-panel p-3.5">
              <div className="font-semibold text-sm">{t}</div>
              <div className="text-[12px] text-[var(--ag-muted)] mt-1 leading-snug">{d}</div>
            </div>
          ))}
        </section>

        {/* drill-in band */}
        <section className="mt-6 ag-panel p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm">Drill into the live, interactive thesis →</span>
          <div className="flex flex-wrap gap-3 text-sm">
            <GuideLink href={`${SITE}#ecosystem`}>Ecosystem</GuideLink>
            <GuideLink href={`${SITE}#calculator`}>Value Calculator</GuideLink>
            <GuideLink href={`${SITE}#portfolio`}>Portfolio Simulator</GuideLink>
            <GuideLink href={`${SITE}#invest`}>Roadmap</GuideLink>
            <GuideLink href="https://medigap.plus/book">Book a call</GuideLink>
          </div>
        </section>

        {/* footer — founder info */}
        <footer className="mt-7 pt-5 border-t border-[var(--ag-border)] flex flex-wrap items-end justify-between gap-4">
          <div>
            <Logo size="sm" />
            <div className="text-[13px] mt-2"><b className="text-[var(--ag-text)]">{FOUNDER.name}</b> · {FOUNDER.title} &amp; CEO</div>
            <div className="ag-mono text-[12px] text-[var(--ag-muted)] mt-1">
              {FOUNDER.email} · ({FOUNDER.cell.slice(0,3)}) {FOUNDER.cell.slice(3,6)}-{FOUNDER.cell.slice(6)}<br />
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

function Row({ label, val, tone, big = false }: { label: string; val: string; tone: "text" | "cyan" | "gold" | "green"; big?: boolean }) {
  const c = tone === "gold" ? "text-[var(--ag-gold)]" : tone === "green" ? "text-[var(--ag-green)]" : tone === "cyan" ? "text-[var(--ag-cyan)]" : "text-[var(--ag-text)]";
  return (
    <div className="flex items-center justify-between">
      <span className={`text-[13px] ${big ? "font-semibold text-[var(--ag-text)]" : "text-[var(--ag-muted)]"}`}>{label}</span>
      <span className={`ag-mono font-bold ${big ? "text-xl" : "text-base"} ${c}`}>{val}</span>
    </div>
  );
}
