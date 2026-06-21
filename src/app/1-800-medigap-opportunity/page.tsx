import Link from "next/link";
import type { Metadata } from "next";
import FounderCTA from "@/components/jv/FounderCTA";
import { TOLLFREE, TOLLFREE_TEL } from "@/lib/format";

export const metadata: Metadata = {
  title: "The 1-800-MEDIGAP Opportunity — A Vanity Brand Moat in a $1B Market",
  description:
    "Why 1-800-MEDIGAP wins: a category-defining vanity number drives recall, trust and authority — lowering acquisition cost. Powered by R0cketShip.com and the PredictiveData.org data engine across a proprietary network.",
  openGraph: { title: "The 1-800-MEDIGAP Opportunity", description: "A structural advantage in senior insurance: the vanity brand + proprietary tech + data." },
};

function Stat({ big, label }: { big: string; label: string }) {
  return <div><div className="text-3xl md:text-4xl font-extrabold text-gradient">{big}</div><div className="text-sm text-[var(--muted)] mt-1">{label}</div></div>;
}

export default function Opportunity() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/1-800-medigap" className="text-xl font-bold text-gradient">1-800-MEDIGAP</Link>
          <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand text-sm">📞 {TOLLFREE}</a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-[0.08]" />
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-24 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">
            <span className="live-dot text-[var(--brand)]">●</span> The opportunity
          </div>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight">
            We own the words seniors already say: <span className="text-gradient">1-800-MEDIGAP.</span>
          </h1>
          <p className="mt-6 text-lg text-[var(--muted)] max-w-2xl mx-auto">
            In a market projected to move <b>tens of billions</b> in senior insurance and services, the scarcest asset
            isn&apos;t ad budget — it&apos;s <b>trust</b>. A category-defining vanity number is a permanent, unfair advantage:
            it&apos;s remembered, it&apos;s trusted, and it converts at a lower cost than anything you can buy.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/1-800-medigap/exclusive" className="btn btn-brand text-base">Looking for exclusive partners →</Link>
            <Link href="/1-800-medigap/investor" className="btn btn-ghost text-base">Investor inquiry</Link>
          </div>
        </div>
      </section>

      {/* The numbers */}
      <section className="border-y border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-5xl px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <Stat big="$1B+" label="addressable senior-marketing spend" />
          <Stat big="10,000/day" label="Americans aging into Medicare" />
          <Stat big="~3×" label="recall lift from vanity vs. numeric numbers" />
          <Stat big="↓ CAC" label="lower cost to acquire via trusted inbound" />
        </div>
      </section>

      {/* The thesis */}
      <section className="mx-auto max-w-3xl px-6 py-16 space-y-10">
        <div>
          <h2 className="text-2xl font-bold">Why the vanity number is the moat</h2>
          <p className="mt-3 text-[var(--muted)]">
            The most valuable brands in direct response were built on vanity numbers — 1-800-FLOWERS, 1-800-CONTACTS,
            1-800-GOT-JUNK. The pattern is consistent: when the phone number <i>is</i> the category, you don&apos;t have to
            buy awareness — you already are the awareness. Studies of direct-response advertising have long shown vanity
            numbers are remembered far better than strings of digits, and better recall means more inbound from the same
            spend. For an older demographic that still picks up the phone, that effect is amplified.
          </p>
          <p className="mt-3 text-[var(--muted)]">
            <b>1-800-MEDIGAP</b> is the rare case where the vanity number is the literal product name. That&apos;s instant
            authority. A senior who hears it assumes we&apos;re the established, trustworthy choice — and trust is what
            converts a curious caller into a customer. The result is a structurally <b>lower cost of acquisition</b>: the
            brand does the persuading that competitors pay for with media.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold">The unfair stack behind every call</h2>
          <p className="mt-3 text-[var(--muted)]">The vanity brand gets attention. Three engines turn that attention into the highest-quality, lowest-cost outcomes in the category:</p>
          <div className="mt-5 grid gap-4">
            <div className="card p-5">
              <div className="text-sm uppercase tracking-wide text-[var(--brand)] font-semibold">Powered by R0cketShip.com</div>
              <p className="mt-1 text-sm text-[var(--muted)]">Our build-and-deploy engine spins up branded, conversion-optimized funnels and territories in hours, not months — so a partner can go live fast and we can test and scale relentlessly.</p>
            </div>
            <div className="card p-5">
              <div className="text-sm uppercase tracking-wide text-[var(--brand)] font-semibold">The secret sauce — PredictiveData.org</div>
              <p className="mt-1 text-sm text-[var(--muted)]">Real-time identity resolution and data append enriches every caller and lead the moment they arrive — name, age, household, intent. We know who&apos;s worth a human conversation before the phone stops ringing, so spend flows only to high-value engagement.</p>
            </div>
            <div className="card p-5">
              <div className="text-sm uppercase tracking-wide text-[var(--brand)] font-semibold">The proprietary network</div>
              <p className="mt-1 text-sm text-[var(--muted)]">A live auction across agents, advertisers, money-word partners and carriers routes every call and lead to its highest-value buyer — with the overflow monetized, never wasted. Network effects compound as more partners join.</p>
            </div>
          </div>
        </div>

        <div className="card glow p-6">
          <h2 className="text-xl font-bold">Put it together</h2>
          <p className="mt-2 text-[var(--muted)]">
            Category vanity brand <span className="text-[var(--text)]">(trust + recall)</span> + R0cketShip
            <span className="text-[var(--text)]"> (speed)</span> + PredictiveData
            <span className="text-[var(--text)]"> (knowing who matters)</span> + a proprietary auction
            <span className="text-[var(--text)]"> (monetizing every outcome)</span> = <b>higher-quality engagement, lower
            cost acquisition, and the ability to disrupt the entire marketplace.</b> That&apos;s the opportunity — and
            we&apos;re opening a small number of exclusive partnerships around it.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/1-800-medigap/exclusive" className="btn btn-brand">Become an exclusive partner →</Link>
            <Link href="/1-800-medigap" className="btn btn-ghost">See all opportunities</Link>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-6 py-8 text-xs text-[var(--muted)] flex flex-wrap justify-between gap-2">
          <span>© 2026 1-800-MEDIGAP · medigap.plus</span>
          <span>Powered by R0cketShip.com · PredictiveData.org · the proprietary network</span>
        </div>
      </footer>

      <FounderCTA />
    </div>
  );
}
