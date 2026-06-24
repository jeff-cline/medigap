import type { Metadata } from "next";
import Logo from "@/components/agetech/Logo";
import { Section, Reveal, Counter } from "@/components/agetech/primitives";
import InterestForm from "@/components/agetech/InterestForm";
import DownloadPdfButton from "@/components/agetech/DownloadPdfButton";
import MortgageProforma from "@/components/mortgage/MortgageProforma";
import { FOUNDER } from "@/lib/jv-constants";
import "../agetech/agetech.css";

export const metadata: Metadata = {
  title: "Mortgage Plus — R0cketShip Lending Proforma",
  description: "An interactive proforma for Mortgage Plus: originate mortgage volume from R0cketShip's owned 65+ audience and predictive data at a structural CAC advantage.",
};

const AG = "https://medigap.plus/agetech";

export default function MortgageProformaPage() {
  return (
    <div className="ag-root min-h-screen">
      {/* header */}
      <header className="ag-no-print sticky top-0 z-40 backdrop-blur bg-[var(--ag-bg)]/70 border-b border-[var(--ag-border)]">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
          <a href="/agetech"><Logo size="sm" /></a>
          <div className="flex items-center gap-2">
            <a href="/agetech" className="ag-btn text-xs !py-1.5 !px-3 hidden sm:inline-flex">AgeTech thesis ↗</a>
            <a href="#start" className="ag-btn ag-btn-primary text-xs !py-1.5 !px-4">Start the conversation</a>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="ag-grid-bg relative px-6 pt-20 pb-16 overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[480px] rounded-full" style={{ background: "radial-gradient(circle, rgba(56,225,255,.16), transparent 65%)" }} />
        <div className="mx-auto max-w-5xl relative">
          <div className="flex items-center gap-3 mb-6"><Logo /><span className="ag-chip">Mortgage Plus · Lending Proforma</span></div>
          <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
            The same trusted relationship, <span className="ag-gradient ag-glow">now a mortgage.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--ag-muted)] leading-relaxed">
            R0cketShip already owns the relationship with <b className="text-[var(--ag-text)]"><Counter to={10000} /> Americans turning 65 every day</b>.
            Mortgage Plus originates reverse / HECM, refinance and purchase volume from that <b className="text-[var(--ag-text)]">owned audience and
            predictive data</b> — at a fraction of the industry&apos;s borrower-acquisition cost.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#proforma" className="ag-btn ag-btn-primary">Run the proforma →</a>
            <a href={AG} className="ag-btn">See the AgeTech thesis</a>
          </div>
        </div>
      </section>

      {/* thesis band */}
      <section className="border-y border-[var(--ag-border)] bg-[var(--ag-bg2)]">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <p className="text-2xl md:text-3xl font-medium leading-snug">
            Traditional lenders <span className="text-[var(--ag-red)]">buy every borrower</span> at high CAC.<br />
            Mortgage Plus <span className="ag-gradient font-bold">already owns the borrower</span> — and the data that converts them.
          </p>
        </div>
      </section>

      {/* the interactive proforma */}
      <Section id="proforma" n="01" eyebrow="Interactive Proforma" title={<>Model the <span className="ag-gradient">lending engine.</span></>} sub="Edit every lever — leads, conversion, loan size, revenue per loan, CAC, fulfillment and opex. Outputs and the 5-year ramp update live.">
        <MortgageProforma />
      </Section>

      {/* the advantage */}
      <Section id="edge" n="02" eyebrow="The R0cketShip Edge" title={<>Why this <span className="ag-gradient">compounds.</span></>} center>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ["Owned Audience", "10,000 turning 65 daily — a built-in, recurring borrower pipeline at near-zero CAC."],
            ["Predictive Data", "First-party signals identify refi / reverse / purchase intent before competitors."],
            ["Trusted Brand", "Seniors act on a brand they already trust — higher conversion, lower acquisition cost."],
            ["Cross-Sell", "Each borrower also feeds Medicare, insurance, housing and the wider ecosystem."],
          ].map(([t, d], idx) => (
            <Reveal key={t} delay={idx * 0.06}>
              <div className="ag-panel p-5 h-full text-left">
                <div className="ag-mono text-xs text-[var(--ag-cyan)]">0{idx + 1}</div>
                <div className="font-semibold mt-2">{t}</div>
                <div className="text-sm text-[var(--ag-muted)] mt-1">{d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section id="start" n="→" eyebrow="Start the Conversation" title={<>Back the <span className="ag-gradient">lending engine.</span></>} sub="Family offices, private credit, strategic & warehouse partners — let's talk." center>
        <InterestForm source="R0cketShip Mortgage Plus" />
      </Section>

      {/* footer */}
      <footer className="ag-hairline">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-wrap items-end justify-between gap-4 text-xs text-[var(--ag-muted)]">
          <div>
            <Logo size="sm" />
            <div className="mt-2"><b className="text-[var(--ag-text)]">{FOUNDER.name}</b> · {FOUNDER.title} &amp; CEO · {FOUNDER.email}</div>
            <div className="ag-mono mt-1">R0cketShip.com · <a href={AG} className="underline">AgeTech thesis</a> · <a href="https://medigap.plus/book" className="underline">book a call</a></div>
          </div>
          <div className="flex items-center gap-3">
            <DownloadPdfButton className="ag-no-print text-xs !py-1.5 !px-4" />
            <span className="ag-mono text-right max-w-xs">Illustrative assumptions only · not an offer to sell securities · not investment advice.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
