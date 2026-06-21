import Link from "next/link";
import type { Metadata } from "next";
import JvForm from "@/components/jv/JvForm";
import FounderCTA from "@/components/jv/FounderCTA";
import TvAds from "@/components/jv/TvAds";
import { TOLLFREE, TOLLFREE_TEL } from "@/lib/format";
import { ACCOUNT_OPTIONS } from "@/lib/jv";

export const metadata: Metadata = {
  title: "1-800-MEDIGAP — Sponsor, Lock In a ZIP, or Take Over the Brand",
  description:
    "Partner with the category-defining vanity brand in senior insurance. Sponsor a ZIP, city, state or nationwide; agents lock in a ZIP; national providers explore a full brand takeover. Powered by R0cketShip.com + PredictiveData.org.",
  openGraph: { title: "1-800-MEDIGAP — Partner & Sponsorship Opportunities", description: "Own a market under the most trusted vanity brand in Medicare." },
};

const CTAS = [
  { href: "/1-800-medigap/sponsor", icon: "📍", title: "Sponsor a Market", desc: "ZIP, city, state, or nationwide — own the inbound under the vanity brand." },
  { href: "/1-800-medigap/lock-zip", icon: "🔒", title: "Agents — Lock In Your ZIP", desc: "Secure your ZIP before another agent does. Exclusive territory." },
  { href: "/1-800-medigap/brand-takeover", icon: "🏢", title: "Brand Takeover", desc: "National providers: take over the entire brand experience." },
  { href: "/1-800-medigap/investor", icon: "📈", title: "Investor Inquiry", desc: "Come in at the top of a billion-dollar market." },
  { href: "/1-800-medigap/exclusive", icon: "⭐", title: "Exclusive Partner", desc: "A handful of strategic partnerships. By selection." },
];

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/1-800-medigap" className="text-xl font-bold text-gradient">1-800-MEDIGAP</Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--muted)]">
            <Link href="/1-800-medigap-opportunity" className="hover:text-[var(--text)]">The Opportunity</Link>
            <Link href="#options" className="hover:text-[var(--text)]">Account Options</Link>
            <Link href="#interest" className="hover:text-[var(--text)]">Express Interest</Link>
          </nav>
          <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand text-sm">📞 {TOLLFREE}</a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-[0.07]" />

        {/* Red corner "Lock in now" ribbon → jumps to the interest form (which sends to the founder) */}
        <Link href="#interest" aria-label="Lock in now" className="absolute -right-16 top-8 z-30 rotate-45 bg-[var(--danger)] px-20 py-2 text-center text-sm font-extrabold uppercase tracking-wide text-white shadow-xl hover:brightness-110">
          🔒 Lock in now
        </Link>

        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-1 text-xs font-semibold text-[var(--danger)]">
              <span className="live-dot">●</span> Disruption is coming
            </div>
            <p className="mt-5 text-2xl md:text-3xl font-bold leading-snug">
              New opportunities this <span className="text-[var(--brand)]">AEP/OEP</span>. Lock in your position to be part of the disruption.
            </p>
            <h1 className="mt-6 text-5xl md:text-7xl font-black leading-none">
              <span className="throb text-gradient">1-800-MEDIGAP</span>
            </h1>
            <p className="mt-6 text-lg text-[var(--muted)]">
              Sponsor a ZIP, city, state, or the whole country. Agents lock in their territory. National providers explore
              a full brand takeover. One trusted vanity number — more recall, more trust, lower acquisition cost.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#interest" className="btn btn-brand text-base">Express Interest — Check Availability →</Link>
              <Link href="/1-800-medigap-opportunity" className="btn btn-ghost text-base">See the opportunity</Link>
            </div>
          </div>
          <div id="interest"><JvForm cta="Express Interest — Check Availability" /></div>
        </div>
      </section>

      {/* National TV advertising — embedded spots with a Check-Availability CTA on finish */}
      <TvAds />

      {/* CTA cards — each to its own landing page */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl font-bold text-center">Choose your path</h2>
        <p className="text-center text-[var(--muted)] mt-2">Each opportunity has its own page — pick the one that fits.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CTAS.map((c) => (
            <Link key={c.href} href={c.href} className="card p-5 hover:glow transition block">
              <div className="text-3xl">{c.icon}</div>
              <div className="mt-3 font-semibold">{c.title}</div>
              <div className="text-sm text-[var(--muted)] mt-1">{c.desc}</div>
              <div className="mt-3 text-sm text-[var(--brand)]">Learn more →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Account options */}
      <section id="options" className="border-y border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <h2 className="text-2xl font-bold">Ways to plug into the network</h2>
          <p className="text-[var(--muted)] mt-2">Every account type you can set up, and what&apos;s available right now.</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {ACCOUNT_OPTIONS.map((o) => (
              <Link key={o.href} href={o.href} className="card p-4 flex items-start justify-between gap-3 hover:glow transition">
                <div>
                  <div className="font-semibold">{o.label}</div>
                  <div className="text-sm text-[var(--muted)] mt-0.5">{o.availability}</div>
                </div>
                <span className="text-[var(--brand)] text-sm shrink-0">Open →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">Why a vanity number changes the math</h2>
        <p className="mt-3 text-[var(--muted)] max-w-2xl mx-auto">
          People remember <b>1-800-MEDIGAP</b>. That recall means more inbound, more trust, and a lower cost to acquire
          every customer — an advantage we share with our partners.
        </p>
        <Link href="/1-800-medigap-opportunity" className="btn btn-brand text-base mt-6">Read the full story →</Link>
      </section>

      <footer className="mt-auto border-t border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-6 py-8 text-xs text-[var(--muted)] flex flex-wrap justify-between gap-2">
          <span>© 2026 1-800-MEDIGAP · medigap.plus — partnership & sponsorship inquiries.</span>
          <span>Powered by R0cketShip.com · PredictiveData.org</span>
        </div>
      </footer>

      <FounderCTA />
    </div>
  );
}
