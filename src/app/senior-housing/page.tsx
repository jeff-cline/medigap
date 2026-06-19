import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { TrustBand, BenefitGrid, FaqSection, FinalCta, VerticalHero } from "@/components/PublicBlocks";

export const metadata: Metadata = {
  title: "Senior Housing & Assisted Living Placement — medigap.plus",
  description:
    "Free help finding independent living, assisted living and senior communities that fit your needs and budget. Compassionate placement advisors. Call 1-800-MEDIGAP.",
};

const benefits = [
  ["🏡", "Independent & assisted living", "From active 55+ communities to assisted living with daily support, we match you to the right level of care — not just the first open bed."],
  ["💵", "Honest about cost & budget", "We talk real numbers up front and find communities that fit what your family can actually afford, including options that accept benefits you may qualify for."],
  ["🤝", "A dedicated placement advisor", "One caring advisor learns your situation, shortlists vetted communities, and coordinates tours — so you're never doing this alone."],
  ["⚡", "Fast when you need it fast", "Hospital discharge or a sudden change at home? We can move quickly to find a safe, welcoming place on a tight timeline."],
];

const faqs = [
  ["What's the difference between independent and assisted living?", "Independent living suits seniors who are largely self-sufficient but want community, amenities and no home maintenance. Assisted living adds help with daily activities like bathing, dressing, medication reminders and meals. We'll help you figure out which fits today and as needs change."],
  ["How much does senior housing cost?", "It varies widely by region, level of care and amenities. We'll give you realistic ranges for your area and find communities that match your budget — including ones that accept certain benefits you might qualify for."],
  ["Is your placement help free?", "Yes. Our placement guidance is free to your family. We're compensated by our network of vetted communities, and you're never obligated to choose any of them."],
  ["Can you help on short notice?", "Absolutely. Many families call us during a hospital discharge or after a fall. We're built to move quickly and find a safe placement fast when time matters."],
];

export default function Page() {
  return (
    <>
      <PublicHeader />
      <VerticalHero
        badge="Senior Housing"
        title="Find the right senior community —"
        gradientTail="with someone in your corner."
        subhead="Independent living, assisted living and senior communities matched to your needs, your budget and your timeline. A caring advisor does the legwork and the touring with you — free."
        vertical="housing"
        LeadForm={LeadForm}
      />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Placement made caring and clear</h2>
        <p className="text-center text-[var(--muted)] mt-2">The right level of care, the right community, the right price.</p>
        <BenefitGrid items={benefits} />
      </section>

      <TrustBand />
      <FaqSection faqs={faqs} />
      <FinalCta
        title="Talk to a senior housing advisor today"
        body="Whether you're planning ahead or facing a discharge tomorrow, a caring advisor is ready to help — at no cost to your family."
      />

      <SiteFooter />
    </>
  );
}
