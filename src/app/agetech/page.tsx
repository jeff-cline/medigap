import Hero from "@/components/agetech/Hero";
import EcosystemMap from "@/components/agetech/EcosystemMap";
import LtvJourney from "@/components/agetech/LtvJourney";
import ValueCalculator from "@/components/agetech/ValueCalculator";
import PortfolioSimulator from "@/components/agetech/PortfolioSimulator";
import WhatIfSimulator from "@/components/agetech/WhatIfSimulator";
import Flywheel from "@/components/agetech/Flywheel";
import { Section } from "@/components/agetech/primitives";
import InterestForm from "@/components/agetech/InterestForm";
import { TrustEngine, DemandEngine, DataMoat, AcquisitionEngine, Roadmap, DownloadCenter, ProgressNav, FinalTakeaway } from "@/components/agetech/sections";

export default function AgeTechPage() {
  return (
    <div id="top">
      <ProgressNav />

      <div id="opportunity"><Hero /></div>

      {/* thesis band */}
      <section className="border-y border-[var(--ag-border)] bg-[var(--ag-bg2)]">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="text-2xl md:text-3xl font-medium leading-snug">
            Traditional companies monetize a customer <span className="text-[var(--ag-red)]">once.</span><br />
            R)cketShip monetizes the same customer <span className="ag-gradient font-bold">repeatedly, across decades</span> — through products, services, partnerships and acquisitions.
          </p>
          <p className="mt-6 ag-mono text-sm text-[var(--ag-muted)]">Every customer becomes a growing economic asset. Every acquisition increases the value of every customer.</p>
        </div>
      </section>

      <Section id="ecosystem" n="02" eyebrow="The Ecosystem" title={<>One trusted layer, <span className="ag-gradient">an expanding universe.</span></>} sub="R)cketShip sits at the center of every aging-related decision — each node a revenue pathway, each connection routed through the trust layer.">
        <EcosystemMap />
      </Section>

      <Section id="trust" n="03" eyebrow="The Trust Engine" title={<>The relationship <span className="ag-gradient">is the asset.</span></>} sub="Audience, opt-in data and engagement compound into durable, re-monetizable economic assets." center>
        <TrustEngine />
      </Section>

      <Section id="ltv" n="04" eyebrow="Lifetime Value" title={<>One relationship. <span className="ag-gradient">Decades of value.</span></>} sub="Follow a hypothetical customer from 64 to 85 — watch cumulative lifetime value compound at every stage.">
        <LtvJourney />
      </Section>

      <Section id="calculator" n="05" eyebrow="Value Creation Calculator" title={<>Model the <span className="ag-gradient">compounding.</span></>} sub="Edit every assumption. Outputs update live. Built to be stress-tested by institutional capital.">
        <ValueCalculator />
      </Section>

      <Section id="demand" n="06" eyebrow="The Demand Engine" title={<>Owned acquisition, <span className="ag-gradient">end to end.</span></>} sub="From traffic to revenue activation — a closed loop R)cketShip controls and re-monetizes.">
        <DemandEngine />
      </Section>

      <Section id="data" n="07" eyebrow="The Data Moat" title={<>More data, <span className="ag-gradient">more efficiency.</span></>} sub="Every interaction enriches the platform — sharpening prediction, matching and conversion.">
        <DataMoat />
      </Section>

      <Section id="acquisition" n="08" eyebrow="Accretive Acquisition Engine" title={<>Each acquisition <span className="ag-gradient">feeds the whole network.</span></>} sub="What one acquisition adds flows to every existing customer and every other node.">
        <AcquisitionEngine />
      </Section>

      <Section id="portfolio" n="09" eyebrow="Portfolio Compounding Simulator" title={<>Build the <span className="ag-gradient">portfolio.</span></>} sub="Select targets and watch revenue, cross-sell, data assets and enterprise value compound in real time.">
        <PortfolioSimulator />
      </Section>

      <Section id="flywheel" n="10" eyebrow="The Flywheel" title={<>An <span className="ag-gradient">infinite compounding</span> loop.</>} sub="More customers → more data → better predictions → higher conversion → more revenue → more acquisitions → more customers.">
        <Flywheel />
      </Section>

      <Section n="★" eyebrow="What If?" title={<>The investor <span className="ag-gradient">accelerator.</span></>} sub="Set your own assumptions and watch the ecosystem, customer base, portfolio and enterprise value expand in real time.">
        <WhatIfSimulator />
      </Section>

      <Section id="invest" n="11" eyebrow="Investment Opportunity" title={<>The <span className="ag-gradient">roadmap.</span></>} sub="Capital, acquisition, partnership and growth strategy across a long-term horizon.">
        <Roadmap />
      </Section>

      <Section n="DL" eyebrow="Download Center" title={<>Take the <span className="ag-gradient">thesis</span> with you.</>} sub="Generate a PDF of this experience, or request tailored institutional materials." center>
        <DownloadCenter />
      </Section>

      <Section id="start" n="→" eyebrow="Start the Conversation" title={<>Become part of the <span className="ag-gradient">rising tide.</span></>} sub="Family offices, private equity, strategic & private-credit partners, and acquisition targets — let's talk." center>
        <InterestForm />
      </Section>

      <FinalTakeaway />

      <footer className="ag-hairline">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ag-muted)]">
          <span>© 2026 R)cketShip — AgeTech Capital Platform.</span>
          <span className="ag-mono">Illustrative assumptions only · not an offer to sell securities · not investment advice.</span>
        </div>
      </footer>
    </div>
  );
}
