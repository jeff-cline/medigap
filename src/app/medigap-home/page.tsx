import type { Metadata } from "next";
import Link from "next/link";
import SiloShell from "@/components/silo/SiloShell";
import LeadForm from "@/components/LeadForm";
import { MEDIGAP } from "@/lib/medigap-brand";
import { siloGroups, siloIndex } from "@/lib/silos";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "1-800-MEDIGAP — America's Trusted Toll-Free Number for Seniors",
  description: "One free call for everything senior — Medicare, senior living & care, retirement, insurance and benefits. Licensed US agents, no pressure. Call 1-800-MEDIGAP (1-800-633-4427).",
  alternates: { canonical: `${MEDIGAP.url}/` },
  openGraph: { title: "1-800-MEDIGAP — America's Trusted Toll-Free Number", description: "One free call for everything senior. Call 1-800-MEDIGAP.", url: `${MEDIGAP.url}/`, type: "website" },
};

const orgLd = JSON.stringify({
  "@context": "https://schema.org", "@type": "InsuranceAgency",
  name: MEDIGAP.brand, url: MEDIGAP.url, telephone: "+1-800-633-4427", slogan: MEDIGAP.tagline, areaServed: "US",
  contactPoint: { "@type": "ContactPoint", telephone: "+1-800-633-4427", contactType: "customer service", areaServed: "US", availableLanguage: "English" },
});

export default function MedigapHome() {
  const groups = siloGroups();
  const popular = [...siloIndex()].sort((a, b) => b.totalVol - a.totalVol).slice(0, 8);

  return (
    <SiloShell path="">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: orgLd }} />

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${MEDIGAP.colors.soft}, #ffffff)` }} />
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-20 relative grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium" style={{ color: MEDIGAP.colors.brand }}>★ {MEDIGAP.tagline}</div>
            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Everything senior, <span style={{ color: MEDIGAP.colors.brand }}>one free call.</span>
            </h1>
            <p className="mt-5 text-lg text-[var(--muted)]">Medicare, senior living & care, retirement, insurance and benefits — licensed US specialists guide you at no cost and no pressure. America counts on one number: <b>1-800-MEDIGAP</b>.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={`tel:${MEDIGAP.tel}`} className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-bold text-white" style={{ background: MEDIGAP.colors.brand }}>📞 Call {MEDIGAP.telDisplay}</a>
              <a href="#help" className="inline-flex items-center rounded-full px-6 py-3 text-base font-semibold border border-[var(--border)] bg-white">Get a free call back</a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--muted)]">
              <span>✓ 100% free</span><span>✓ Licensed US agents</span><span>✓ No obligation</span><span>✓ Every senior need</span>
            </div>
          </div>
          {/* lead form — wired to the Core CRM (/api/leads → append + routing) */}
          <div id="help" className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl">
            <div className="font-bold text-lg">Request a free call back</div>
            <p className="text-sm text-[var(--muted)] mb-3">Tell us how to reach you — a licensed specialist will help, free.</p>
            <LeadForm vertical="senior" compact />
            <p className="text-[11px] text-[var(--muted)] mt-3">By submitting you agree we may contact you about senior products &amp; services. Not affiliated with the U.S. government.</p>
          </div>
        </div>
      </section>

      {/* categories — the silo hub */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-3xl font-bold text-center">How can we help you today?</h2>
        <p className="text-center text-[var(--muted)] mt-2">Six categories, every senior question — and one number to call.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.group} className="rounded-2xl border border-[var(--border)] bg-white p-6">
              <div className="font-bold text-lg mb-2">{g.group}</div>
              <ul className="space-y-1.5 text-sm">
                {g.silos.slice(0, 6).map((s) => <li key={s.slug}><Link href={`/${s.slug}`} className="text-[var(--text)] hover:text-[var(--brand)]">{s.name} →</Link></li>)}
              </ul>
              {g.silos.length > 6 && <div className="text-xs text-[var(--muted)] mt-2">+ {g.silos.length - 6} more</div>}
            </div>
          ))}
        </div>
      </section>

      {/* popular guides */}
      <section className="bg-[var(--panel)] border-y border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <h2 className="text-2xl font-bold text-center mb-8">Most-searched guides</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((s) => (
              <Link key={s.slug} href={`/${s.slug}`} className="rounded-xl border border-[var(--border)] bg-white p-4 hover:border-[var(--brand)] transition">
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-[var(--muted)] mt-1">{s.group}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold">Not sure where to start? <span style={{ color: MEDIGAP.colors.brand }}>Just call.</span></h2>
        <p className="mt-3 text-[var(--muted)]">One conversation with a licensed specialist points you in the right direction — free.</p>
        <a href={`tel:${MEDIGAP.tel}`} className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 mt-6 text-lg font-bold text-white" style={{ background: MEDIGAP.colors.brand }}>📞 Call {MEDIGAP.brand}</a>
      </section>
    </SiloShell>
  );
}
