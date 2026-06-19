import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { TrustBand, BenefitGrid, FaqSection, FinalCta, VerticalHero } from "@/components/PublicBlocks";

export const metadata: Metadata = {
  title: "Medigap Supplements — Plan G & Plan N | medigap.plus",
  description:
    "Cover the 20% Original Medicare leaves behind. Compare Medigap Plan G and Plan N rates across top carriers. Keep your doctors, travel freely. Call 1-800-MEDIGAP.",
};

const benefits = [
  ["🛡️", "Cover the 20% gap", "Original Medicare leaves you on the hook for roughly 20% of costs with no annual cap. A Medigap plan picks up those gaps so a hospital stay doesn't wreck your savings."],
  ["⭐", "Plan G & Plan N, side by side", "Plan G is the most comprehensive popular choice; Plan N trades small copays for a lower premium. We show both so you pick the right balance."],
  ["🩺", "Keep any doctor that takes Medicare", "No networks. Use any doctor or hospital in the country that accepts Medicare — and travel with confidence."],
  ["💰", "Same coverage, different price", "Plans are standardized by law, so a Plan G is a Plan G — but premiums vary a lot by carrier. We shop the rates so you don't overpay for identical coverage."],
];

const faqs = [
  ["What is Medigap?", "Medigap (Medicare Supplement) is private insurance that pays the out-of-pocket costs Original Medicare leaves behind — deductibles, copays and the 20% coinsurance. You keep Original Medicare and add a Medigap plan on top."],
  ["Plan G or Plan N — which is better?", "Plan G covers nearly everything except the small Part B deductible. Plan N has a lower premium but you pay small copays for some office and ER visits. Which wins depends on how often you see doctors — we'll run the math with you."],
  ["Can I be turned down for a Medigap plan?", "During your one-time Medigap Open Enrollment (the 6 months after you're 65 and enrolled in Part B), you have guaranteed-issue rights — no health questions. Outside that window, underwriting may apply, so timing matters. Call us before it closes."],
  ["Why do prices differ if the plans are identical?", "Coverage is standardized by law, but each carrier prices its premiums differently and raises them differently over time. That's why comparing carriers — what we do — can save you hundreds a year for the exact same benefits."],
];

export default function Page() {
  return (
    <>
      <PublicHeader />
      <VerticalHero
        badge="Medicare Supplements"
        title="Cover the gaps"
        gradientTail="Original Medicare leaves behind."
        subhead="Medigap pays the deductibles, copays and 20% coinsurance that can otherwise cost you thousands. Compare Plan G and Plan N across top carriers — same coverage, better price."
        vertical="supplement"
        disclaimer
        LeadForm={LeadForm}
      />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Predictable bills. Any doctor. No networks.</h2>
        <p className="text-center text-[var(--muted)] mt-2">The peace of mind seniors love about Medigap.</p>
        <BenefitGrid items={benefits} />
      </section>

      <TrustBand />
      <FaqSection faqs={faqs} />
      <FinalCta
        title="Compare Plan G & Plan N rates now"
        body="Same standardized coverage, very different prices. A quick call could lower your premium without lowering your protection."
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
