import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { TrustBand, BenefitGrid, FaqSection, FinalCta, VerticalHero } from "@/components/PublicBlocks";

export const metadata: Metadata = {
  title: "In-Home & Long-Term Senior Care Support — medigap.plus",
  description:
    "Compassionate help arranging in-home care, caregivers and long-term care support for an aging parent or spouse. Talk to a care advisor free. Call 1-800-MEDIGAP.",
};

const benefits = [
  ["❤️", "Care that comes to them", "From a few hours a week to round-the-clock support, we help arrange in-home caregivers so your loved one can stay where they're most comfortable — home."],
  ["🧑‍⚕️", "The right level of help", "Companionship, personal care, meal prep, medication reminders or skilled support — we match the type and amount of care to what's actually needed."],
  ["📋", "Long-term care, planned right", "We help you understand long-term care options and how to pay for them, so a future health change doesn't become a financial crisis."],
  ["🤲", "Support for the family, too", "Caregiving is hard. We give worn-out family members a knowledgeable guide and real options for respite and relief."],
];

const faqs = [
  ["What kind of in-home care can you arrange?", "Everything from a few hours of companionship and help around the house to personal care (bathing, dressing, mobility) and coordination with skilled nursing. We match the level of care to your loved one's needs and your budget."],
  ["How is in-home care paid for?", "It depends on the situation — some costs may be covered by long-term care insurance, certain benefits, or private pay. We'll walk you through the realistic options and what you may qualify for."],
  ["Can you help if Mom or Dad needs care soon?", "Yes. Many families reach out during a crisis or right after a hospital stay. We can move quickly to arrange trusted in-home support so your loved one is safe."],
  ["Does it cost us anything to talk to you?", "No. Our care guidance is free to your family. We're here to give you clear options and a real human to lean on — with no obligation."],
];

export default function Page() {
  return (
    <>
      <PublicHeader />
      <VerticalHero
        badge="Senior Care"
        title="Help your loved one age"
        gradientTail="safely, right at home."
        subhead="Compassionate guidance for in-home caregivers and long-term care support — matched to your loved one's needs and your family's budget. A care advisor helps you build the right plan, free."
        vertical="care"
        LeadForm={LeadForm}
      />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Care that fits your family's life</h2>
        <p className="text-center text-[var(--muted)] mt-2">The right support, arranged with compassion.</p>
        <BenefitGrid items={benefits} />
      </section>

      <TrustBand />
      <FaqSection faqs={faqs} />
      <FinalCta
        title="Talk to a senior care advisor now"
        body="Whether you need a few hours of help or a full long-term plan, we'll guide you to the right care — at no cost to your family."
      />

      <SiteFooter />
    </>
  );
}
