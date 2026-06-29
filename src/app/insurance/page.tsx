import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import SiteFooter from "@/components/SiteFooter";
import { FinalCta } from "@/components/PublicBlocks";
import { TOLLFREE, TOLLFREE_TEL } from "@/lib/format";
import { NICHES, SITE_URL } from "@/lib/niches";

export const metadata: Metadata = {
  title: "Insurance Help by Phone — Compare Every Plan | 1-800-MEDIGAP",
  description: "Free, no-pressure insurance help from licensed US agents — Medicare, home, life, pet and auto. Compare every carrier in one call. Dial 1-800-MEDIGAP.",
  alternates: { canonical: `${SITE_URL}/insurance` },
  openGraph: { title: "Insurance Help by Phone | 1-800-MEDIGAP", description: "Compare Medicare, home, life, pet and auto insurance in one free call.", url: `${SITE_URL}/insurance`, type: "website" },
};

export default function InsuranceHub() {
  return (
    <>
      <PublicHeader />
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 brand-gradient opacity-[0.07]" />
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-24 text-center relative">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">Every kind of insurance, <span className="text-gradient">one free call.</span></h1>
          <p className="mt-5 text-lg text-[var(--muted)]">Licensed, US-based specialists compare top carriers for you — Medicare, home, life, pet and auto. No cost, no pressure.</p>
          <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand mt-7 text-base">📞 Call {TOLLFREE} — Free</a>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {NICHES.map((n) => (
            <Link key={n.slug} href={`/insurance/${n.slug}`} className="card p-6 hover:border-[var(--brand)] transition group">
              <div className="font-semibold text-lg group-hover:text-[var(--brand)]">{n.primaryKeyword}</div>
              <p className="text-sm text-[var(--muted)] mt-2 line-clamp-3">{n.heroSubhead}</p>
              <div className="mt-4 text-sm text-[var(--brand)]">Learn more →</div>
            </Link>
          ))}
        </div>
      </section>

      <FinalCta title="Not sure which coverage you need?" body="Call 1-800-MEDIGAP and a licensed specialist will point you in the right direction — free, in minutes." />
      <SiteFooter />
    </>
  );
}
