import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { TrustBand, BenefitGrid, FaqSection, FinalCta, VerticalHero } from "@/components/PublicBlocks";

export const metadata: Metadata = {
  title: "Medicare Insurance Help & Enrollment — medigap.plus",
  description:
    "Confused about Original Medicare? Talk to a licensed specialist about Part A, Part B, enrollment windows and avoiding lifelong penalties. Call 1-800-MEDIGAP.",
};

const benefits = [
  ["🩺", "Part A & Part B, explained simply", "We walk you through exactly what hospital and medical coverage you get, what it costs, and what it doesn't cover — in plain English, no jargon."],
  ["⏰", "Never miss an enrollment window", "Sign up at the wrong time and you can owe a penalty for life. We make sure your Initial, Special and General Enrollment timing is right."],
  ["🧭", "Unbiased guidance, every carrier", "We're not a single insurance company. We compare your options across the top national carriers so the plan fits you — not a sales quota."],
  ["💬", "A real human, every time", "Speak with a licensed specialist by phone in minutes. No phone trees, no robots, no pressure."],
];

const faqs = [
  ["When can I enroll in Medicare?", "Most people can first enroll during the 7-month window around their 65th birthday (3 months before, your birthday month, and 3 months after). If you missed it, you may qualify for a Special Enrollment Period. Call us and we'll check your exact dates."],
  ["What does Original Medicare actually cover?", "Part A covers hospital, skilled nursing, hospice and some home health care. Part B covers doctor visits, outpatient care, preventive services and medical equipment. It does not cover most prescription drugs, dental, vision or hearing — which is where supplements and Advantage plans come in."],
  ["Will I owe a penalty?", "If you delay Part B or Part D without qualifying coverage, you can owe a permanent monthly penalty. The rules are tricky — a 5-minute call can save you hundreds of dollars a year for the rest of your life."],
  ["Does this cost me anything?", "No. Our guidance is completely free to you. We're paid by the carriers, never by you, and you're never obligated to enroll in anything."],
];

export default function Page() {
  return (
    <>
      <PublicHeader />
      <VerticalHero
        badge="Medicare Insurance"
        title="Medicare made"
        gradientTail="simple and stress-free."
        subhead="Turning 65 or new to Medicare? Get straight answers about Part A, Part B, enrollment timing and how to avoid penalties — from a licensed specialist who works for you, not a single insurance company."
        vertical="medicare"
        disclaimer
        LeadForm={LeadForm}
      />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Why seniors trust us with Medicare</h2>
        <p className="text-center text-[var(--muted)] mt-2">Clear answers, the right timing, zero pressure.</p>
        <BenefitGrid items={benefits} />
      </section>

      <TrustBand />
      <FaqSection faqs={faqs} />
      <FinalCta
        title="Talk to a licensed Medicare specialist now"
        body="Five minutes on the phone can save you from a lifetime penalty and thousands in surprise bills."
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
