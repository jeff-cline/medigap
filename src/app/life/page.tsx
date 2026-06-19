import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { TrustBand, BenefitGrid, FaqSection, FinalCta, VerticalHero } from "@/components/PublicBlocks";

export const metadata: Metadata = {
  title: "Life Insurance & Final Expense for Seniors — medigap.plus",
  description:
    "Affordable final expense, burial and mortgage protection life insurance for seniors. Lock in a rate, protect your family. Talk to a specialist. Call 1-800-MEDIGAP.",
};

const benefits = [
  ["💵", "Final expense made affordable", "Cover funeral, burial and final bills so the people you love aren't left with a surprise expense during the hardest week of their lives."],
  ["🏠", "Mortgage protection", "Make sure your spouse or family can stay in the home if something happens to you — coverage designed to pay off or pay down the mortgage."],
  ["✅", "Options with simple approval", "Many plans for seniors require no medical exam and just a few health questions — some accept you regardless of health history."],
  ["🔒", "Lock in your rate", "Choose plans with premiums that never increase and benefits that never decrease, so your protection stays put for life."],
];

const faqs = [
  ["What is final expense insurance?", "It's a smaller, affordable whole life policy designed to cover end-of-life costs — funeral, burial, medical bills and other final expenses — so your family isn't left paying out of pocket. Benefits are typically paid quickly and tax-free."],
  ["Do I need a medical exam?", "Often, no. Many senior final expense and burial plans use just a few health questions, and some guaranteed-issue options accept you regardless of your health history. We'll match you to the right type based on your situation."],
  ["How much coverage do seniors usually get?", "It varies, but many people choose enough to cover a funeral and final bills — often in the range of a few thousand to $25,000 or more. We help you pick an amount that fits your goals and budget."],
  ["Is it really affordable on a fixed income?", "Yes — that's the point. Premiums are designed to fit a fixed income, and with the right plan they're locked in and never go up. A quick call gets you real quotes with no obligation."],
];

export default function Page() {
  return (
    <>
      <PublicHeader />
      <VerticalHero
        badge="Life & Final Expense"
        title="Protect your family —"
        gradientTail="and leave no surprises."
        subhead="Affordable final expense, burial and mortgage protection coverage built for seniors. Many plans need no medical exam and lock in a rate that never increases. Get a free, no-obligation quote."
        vertical="life"
        LeadForm={LeadForm}
      />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Peace of mind for the people you love</h2>
        <p className="text-center text-[var(--muted)] mt-2">Simple coverage, locked-in rates, no medical exam options.</p>
        <BenefitGrid items={benefits} />
      </section>

      <TrustBand />
      <FaqSection faqs={faqs} />
      <FinalCta
        title="Get your free final expense quote"
        body="Lock in a rate that never goes up and make sure your family is taken care of. A licensed specialist is one call away."
      />

      <SiteFooter />
    </>
  );
}
