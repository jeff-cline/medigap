import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { TrustBand, BenefitGrid, FaqSection, FinalCta, VerticalHero } from "@/components/PublicBlocks";

export const metadata: Metadata = {
  title: "Alzheimer's & Memory Care Placement — medigap.plus",
  description:
    "Compassionate help finding the right memory care for a loved one with Alzheimer's or dementia, plus resources for families. Talk to an advisor free. Call 1-800-MEDIGAP.",
};

const benefits = [
  ["🧠", "Specialized memory care communities", "We connect you to communities built for Alzheimer's and dementia — secure environments, trained staff and routines designed to reduce confusion and keep your loved one safe."],
  ["🛡️", "Safety first, always", "Wandering, falls and medication mistakes are real risks. We help you find settings with the right safeguards and supervision for your loved one's stage."],
  ["🤝", "A guide who understands", "Our advisors have walked families through this. You get patient, judgment-free guidance and a shortlist of vetted options — not a sales pitch."],
  ["📚", "Resources for the whole family", "Beyond placement, we point you to support groups, planning tools and respite options so caregivers can breathe."],
];

const faqs = [
  ["What is memory care?", "Memory care is a specialized type of senior living for people with Alzheimer's or other forms of dementia. Communities offer secure environments, staff trained in dementia care, structured routines and activities designed to reduce anxiety and keep residents safe."],
  ["How do I know it's time for memory care?", "Common signs include wandering, getting lost, missed medications, unsafe behaviors, aggression, or a caregiver who's burning out. If you're unsure, talk to one of our advisors — we'll help you think it through with compassion."],
  ["How much does memory care cost?", "It typically costs more than standard assisted living because of the added supervision and specialized staff. We'll give you honest ranges for your area and help find options that fit your family's budget and any benefits you qualify for."],
  ["Can you help us find a place quickly?", "Yes. Memory-related crises often move fast. We can act quickly to find a safe, appropriate, vetted community when your family needs it most."],
];

export default function Page() {
  return (
    <>
      <PublicHeader />
      <VerticalHero
        badge="Alzheimer's & Memory Care"
        title="The right memory care,"
        gradientTail="found with compassion."
        subhead="When a loved one has Alzheimer's or dementia, the search is overwhelming. A caring advisor helps you find safe, specialized memory care and connects your family to the resources you need — free."
        vertical="alzheimers"
        LeadForm={LeadForm}
      />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Safety, dignity and support for your loved one</h2>
        <p className="text-center text-[var(--muted)] mt-2">Specialized care and a guide who's been there.</p>
        <BenefitGrid items={benefits} />
      </section>

      <TrustBand />
      <FaqSection faqs={faqs} />
      <FinalCta
        title="Talk to a memory care advisor today"
        body="You don't have to navigate Alzheimer's care alone. Reach a compassionate advisor now — at no cost to your family."
      />

      <SiteFooter />
    </>
  );
}
