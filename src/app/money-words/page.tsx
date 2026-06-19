import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { Card, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Money Words Partners — Hot-Transfer Senior Leads | medigap.plus",
  description:
    "When our AI hears your keyword on a live senior call, we hot-transfer a qualified, consenting senior straight to you. Pay only for real connected transfers. Partner with us.",
};

const features = [
  ["🗣️", "We listen for your keyword", "On tens of thousands of live senior calls, our AI listens for the topics you care about — say, peptides, hearing aids, diabetic supplies or a specific medication."],
  ["🔥", "Hot transfer, while they're warm", "The moment your 'money word' comes up, we ask for consent and hot-transfer that senior to your team — live, engaged and already talking about exactly what you sell."],
  ["✅", "Qualified, not random", "You set the qualifying criteria. We only transfer seniors who match and who agree to the connection, so your reps spend time on real opportunities."],
  ["📈", "Incremental, not cannibal", "These are conversations that would otherwise end. Your offer becomes the perfect next step — found revenue from calls we're already handling."],
];

export default function Page() {
  return (
    <>
      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-[0.07]" />
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24 relative">
          <Badge tone="brand">Money Words Partners</Badge>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight max-w-4xl">
            When our AI hears your word, <span className="text-gradient">you get the call.</span>
          </h1>
          <p className="mt-5 text-lg text-[var(--muted)] max-w-2xl">
            Tell us your keyword — peptides, a medication, a device, a service. Across thousands of live senior calls,
            our AI listens for it and hot-transfers a qualified, consenting senior straight to your team, while
            they&apos;re still warm.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-brand text-base">Become a partner →</Link>
            <Link href="/contact" className="btn btn-ghost text-base">Tell us your keyword</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Found revenue from calls already happening</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map(([icon, title, body]) => (
            <Card key={title}>
              <div className="text-3xl">{icon}</div>
              <h3 className="mt-3 font-semibold text-lg">{title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-3 gap-4 text-center">
          <div><div className="text-3xl md:text-4xl font-extrabold text-gradient">36,000+</div><div className="mt-1 text-sm text-[var(--muted)]">live calls / yr to listen on</div></div>
          <div><div className="text-3xl md:text-4xl font-extrabold text-gradient">100,000+</div><div className="mt-1 text-sm text-[var(--muted)]">seniors in the network</div></div>
          <div><div className="text-3xl md:text-4xl font-extrabold text-[var(--gold)]">AI</div><div className="mt-1 text-sm text-[var(--muted)]">real-time keyword detection</div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="card glow p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 brand-gradient opacity-[0.08]" />
          <div className="relative">
            <h2 className="text-2xl md:text-4xl font-extrabold">Claim your money word</h2>
            <p className="mt-3 text-[var(--muted)] max-w-2xl mx-auto">
              Categories are limited per keyword. Reach out and we&apos;ll set up your hot-transfer pipeline.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <Link href="/contact" className="btn btn-brand text-lg">Contact our partnerships team →</Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
