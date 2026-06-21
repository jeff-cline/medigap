import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import SiteFooter from "@/components/SiteFooter";
import AdSlot from "@/components/AdSlot";
import { TOLLFREE, TOLLFREE_TEL, usd, num } from "@/lib/format";
import { getMoneySnapshot } from "@/lib/queries";
import { getCurrentSite } from "@/lib/site";
import FounderCTA from "@/components/jv/FounderCTA";

export default async function Home() {
  const [m, brand] = await Promise.all([getMoneySnapshot().catch(() => null), getCurrentSite()]);
  const brandName = brand?.name || "medigap.plus";
  const brandStyle = brand?.brandColor ? ({ "--brand": brand.brandColor } as React.CSSProperties) : undefined;
  const headline = brand?.heroHeadline;
  const ticker = [
    `Calls routed today: ${num((m?.calls ?? 0))}`,
    `Network leads: ${num(m?.leads ?? 0)}`,
    `Revenue to date: ${usd(m?.revenue ?? 0)}`,
    `Avg call value: $${(((m?.revenue ?? 0) / Math.max(1, m?.calls ?? 1)) / 100).toFixed(0)}`,
    `Live agents bidding: ${num(m?.agents ?? 0)}`,
  ];

  return (
    <div style={brandStyle}>
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gradient">
            {brand?.logoUrl ? <img src={brand.logoUrl} alt={brandName} className="h-8 w-auto" /> : brandName}
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--muted)]">
            <Link href="/medicare" className="hover:text-[var(--text)]">Medicare</Link>
            <Link href="/medigap" className="hover:text-[var(--text)]">Supplements</Link>
            <Link href="/senior-housing" className="hover:text-[var(--text)]">Housing</Link>
            <Link href="/senior-care" className="hover:text-[var(--text)]">Care</Link>
            <Link href="/agents" className="hover:text-[var(--text)]">For Agents</Link>
            <Link href="/advertise" className="hover:text-[var(--text)]">Advertise</Link>
          </nav>
          <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand text-sm">📞 {TOLLFREE}</a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-[0.07]" />
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">
              <span className="live-dot text-[var(--brand)]">●</span> Trusted by seniors in all 50 states
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight">
              {headline ? (
                <span className="text-gradient">{headline}</span>
              ) : (
                <>Every Medicare &amp; senior decision, <span className="text-gradient">handled by real experts.</span></>
              )}
            </h1>
            <p className="mt-5 text-lg text-[var(--muted)]">
              Compare Medicare Advantage, Medigap supplements, senior housing, in-home care and Alzheimer&apos;s care — all in one place.
              Talk to a licensed specialist in minutes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand text-base">📞 Call {TOLLFREE} — Free</a>
              <a href="#quote" className="btn btn-ghost text-base">Get a free quote</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-[var(--muted)]">
              <div><span className="text-[var(--text)] font-bold text-xl">36,000+</span><br />calls handled / yr</div>
              <div><span className="text-[var(--text)] font-bold text-xl">100,000+</span><br />seniors helped</div>
              <div><span className="text-[var(--text)] font-bold text-xl">★ 4.8</span><br />avg agent rating</div>
            </div>
          </div>
          <div id="quote" className="space-y-4">
            <LeadForm />
            {/* Live advertiser inventory — billed per click via /go/[adId] */}
            <AdSlot placement="inline" />
          </div>
        </div>
      </section>

      {/* Verticals */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl font-bold text-center">Everything the over-65 community needs</h2>
        <p className="text-center text-[var(--muted)] mt-2">One network. Licensed specialists for every product.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["🩺", "Medicare Insurance", "Original Medicare guidance & enrollment", "/medicare"],
            ["📋", "Medicare Advantage", "$0-premium plans with extra benefits", "/medicare-advantage"],
            ["🛡️", "Medigap Supplements", "Cover what Medicare leaves behind", "/medigap"],
            ["🏡", "Senior Housing", "Independent & assisted living options", "/senior-housing"],
            ["❤️", "Senior Care", "In-home & long-term care support", "/senior-care"],
            ["🧠", "Alzheimer's Care", "Memory care placement & resources", "/alzheimers-care"],
            ["💵", "Life & Final Expense", "Protect your family & your mortgage", "/life"],
            ["📞", "Talk to a Human", `Call ${TOLLFREE} anytime`, `tel:${TOLLFREE_TEL}`],
          ].map(([icon, title, desc, href]) => (
            <Link key={href} href={href} className="card p-5 hover:glow transition block">
              <div className="text-3xl">{icon}</div>
              <div className="mt-3 font-semibold">{title}</div>
              <div className="text-sm text-[var(--muted)] mt-1">{desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust / call band */}
      <section className="border-y border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-6 py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">The fastest way to real answers? <span className="text-gradient">Pick up the phone.</span></h2>
          <p className="mt-3 text-[var(--muted)]">Our licensed specialists are standing by — no hold music, no runaround.</p>
          <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand text-lg mt-6">📞 {TOLLFREE}</a>
        </div>
      </section>

      <SiteFooter ticker={ticker} brand={brand} />
      {!brand && <FounderCTA />}
    </div>
  );
}
