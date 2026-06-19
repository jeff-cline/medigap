import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { Card, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Carrier & Risk Partners — medigap.plus",
  description:
    "We acquire seniors, enroll them, collect premium and sweep funds to you. A reinsurance-style partnership that turns our distribution engine into your book. Partner with us.",
};

const features = [
  ["🎯", "We own the distribution", "Our network already produces tens of thousands of high-intent senior calls and leads a year. We bring the policyholders to you — you don't pay for marketing you can't measure."],
  ["✍️", "We enroll & service", "Our licensed specialists handle the conversation, the application and the enrollment, then keep the policyholder supported — so you get a clean, compliant book."],
  ["🏦", "We collect & sweep premium", "We collect premium and sweep the funds to you on a defined schedule, with transparent reporting on every policy and every dollar."],
  ["🛡️", "Reinsurance-style risk share", "You carry the risk and the long-term premium; we carry the acquisition and operations. Structures can be tailored — quota share, fronting, or a custom reinsurance-style arrangement."],
];

export default function Page() {
  return (
    <>
      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-[0.07]" />
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24 relative">
          <Badge tone="gold">Carrier & Risk Partners</Badge>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight max-w-4xl">
            Your book, <span className="text-gradient">built on our engine.</span>
          </h1>
          <p className="mt-5 text-lg text-[var(--muted)] max-w-2xl">
            We acquire the seniors, enroll them, collect the premium and sweep the funds to you — a reinsurance-style
            partnership where you carry the risk and we carry the distribution and operations.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-brand text-base">Explore a partnership →</Link>
            <Link href="/contact" className="btn btn-ghost text-base">Request structure details</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center">A turnkey path to premium</h2>
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
          <div><div className="text-3xl md:text-4xl font-extrabold text-gradient">36,000+</div><div className="mt-1 text-sm text-[var(--muted)]">inbound calls / yr</div></div>
          <div><div className="text-3xl md:text-4xl font-extrabold text-gradient">100,000+</div><div className="mt-1 text-sm text-[var(--muted)]">seniors enrolled & served</div></div>
          <div><div className="text-3xl md:text-4xl font-extrabold text-[var(--gold)]">50</div><div className="mt-1 text-sm text-[var(--muted)]">states of distribution</div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="card glow p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 brand-gradient opacity-[0.08]" />
          <div className="relative">
            <h2 className="text-2xl md:text-4xl font-extrabold">Let&apos;s structure the deal</h2>
            <p className="mt-3 text-[var(--muted)] max-w-2xl mx-auto">
              Tell us the products and risk appetite you have in mind. We&apos;ll design an enrollment, collection and
              fund-sweep arrangement that fits.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <Link href="/contact" className="btn btn-brand text-lg">Contact our partnerships team →</Link>
            </div>
            <p className="mt-5 text-xs text-[var(--muted)] max-w-2xl mx-auto">
              For prospective carrier, MGA and reinsurance partners only. Any arrangement is subject to due diligence,
              definitive agreements and applicable regulatory approval.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
