import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { TrustBand, BenefitGrid, FaqSection, FinalCta, VerticalHero } from "@/components/PublicBlocks";

export const metadata: Metadata = {
  title: "Medicare Advantage Plans — $0 Premium Options | medigap.plus",
  description:
    "Compare $0-premium Medicare Advantage plans with dental, vision, hearing, OTC allowances and more. Talk to a licensed specialist. Call 1-800-MEDIGAP.",
};

const benefits = [
  ["💲", "$0-premium plans in many areas", "Many Medicare Advantage plans cost $0 in monthly premium beyond your Part B — all-in-one coverage that can be lighter on your budget."],
  ["🦷", "Extras Original Medicare won't give you", "Dental, vision, hearing aids, fitness memberships and over-the-counter (OTC) allowances are commonly bundled in. Original Medicare doesn't cover most of these."],
  ["💊", "Drug coverage built in", "Most Advantage plans include Part D prescription coverage, so you manage one plan and one card instead of juggling several."],
  ["📍", "Matched to your doctors & ZIP", "Plans vary block by block. We check that your doctors, pharmacies and prescriptions fit before you ever enroll."],
];

const faqs = [
  ["What is Medicare Advantage (Part C)?", "It's an all-in-one alternative to Original Medicare offered by private carriers approved by Medicare. It bundles your Part A, Part B, usually Part D drug coverage, plus extra benefits — often for a $0 monthly plan premium."],
  ["Are these plans really $0?", "Many have a $0 monthly plan premium, but you still pay your Part B premium, and plans have copays, deductibles and networks. We'll show you the true total cost for your situation before you decide."],
  ["Will my doctor be covered?", "Advantage plans use networks. Before you enroll, we confirm whether your current doctors and preferred pharmacies are in-network so there are no surprises."],
  ["When can I switch to an Advantage plan?", "Typically during your Initial Enrollment, the Annual Enrollment Period (Oct 15 – Dec 7), or the Medicare Advantage Open Enrollment (Jan 1 – Mar 31). You may also qualify for a Special Enrollment Period — call us to check."],
];

export default function Page() {
  return (
    <>
      <PublicHeader />
      <VerticalHero
        badge="Medicare Advantage"
        title="$0-premium plans with"
        gradientTail="benefits you can actually use."
        subhead="Dental, vision, hearing, OTC allowances and prescription coverage — bundled into one plan. We compare the top carriers in your ZIP and match a plan to your doctors and your budget."
        vertical="medicare_advantage"
        disclaimer
        LeadForm={LeadForm}
      />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center">More coverage, often $0 more per month</h2>
        <p className="text-center text-[var(--muted)] mt-2">All-in-one plans with the extras seniors want most.</p>
        <BenefitGrid items={benefits} />
      </section>

      <TrustBand />
      <FaqSection faqs={faqs} />
      <FinalCta
        title="See the $0 plans available in your ZIP"
        body="Plans change every year and vary by neighborhood. Let a licensed specialist pull your real options in minutes."
      />

      <p className="mx-auto max-w-7xl px-6 pb-10 text-xs text-[var(--muted)]">
        Not affiliated with or endorsed by the U.S. government or federal Medicare program. We do not offer every plan
        available in your area. Any information we provide is limited to the plans we do offer in your area. Please
        contact Medicare.gov or 1-800-MEDICARE to get information on all of your options.
      </p>

      <SiteFooter />
    </>
  );
}
