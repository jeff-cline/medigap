import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JvForm from "@/components/jv/JvForm";
import FounderCTA from "@/components/jv/FounderCTA";
import { TOLLFREE, TOLLFREE_TEL } from "@/lib/format";

type Cta = { interest: string; lockInterest: boolean; title: string; sub: string; bullets: string[]; cta: string };

const CTAS: Record<string, Cta> = {
  sponsor: {
    interest: "", lockInterest: false,
    title: "Sponsor a Market under 1-800-MEDIGAP",
    sub: "Own the inbound from a ZIP, a city, a state — or the whole country. Pick your level and the leads route to you under the most trusted vanity brand in Medicare.",
    bullets: ["Exclusive territory — your leads, not shared", "The vanity number does the trust-building for you", "Lower cost per acquisition than building your own brand", "Turn it on fast — we run the tech"],
    cta: "Request my territory",
  },
  "lock-zip": {
    interest: "lock_zip", lockInterest: true,
    title: "Agents — Lock In Your ZIP",
    sub: "Secure your ZIP code before another agent takes it. Calls and web leads from 1-800-MEDIGAP in your territory route to you.",
    bullets: ["First-come, exclusive ZIP rights", "Inbound from a number seniors already trust", "Pay-per-call + seat — no wasted ad spend", "Stack ZIPs to build a region"],
    cta: "Lock in my ZIP",
  },
  "brand-takeover": {
    interest: "nationwide_takeover", lockInterest: true,
    title: "National Provider — Brand Takeover",
    sub: "For national providers who want the whole experience: take over 1-800-MEDIGAP as your front door to the senior market.",
    bullets: ["The category vanity brand, working for you nationally", "Proprietary network + data behind every call", "Co-branded or fully white-labeled", "A genuine moat in a $1B market"],
    cta: "Explore a brand takeover",
  },
  investor: {
    interest: "investor", lockInterest: true,
    title: "Investor Inquiry",
    sub: "Come in at the top of a billion-dollar market with a structural advantage: the category vanity number, proprietary tech, and a data engine that lowers acquisition cost.",
    bullets: ["Category-defining asset (1-800-MEDIGAP)", "Proven demand: real inbound call volume", "Tech + data moat: R0cketShip.com + PredictiveData.org", "Network effects across agents, advertisers, carriers"],
    cta: "Request the investor brief",
  },
  exclusive: {
    interest: "exclusive", lockInterest: true,
    title: "Become an Exclusive Strategic Partner",
    sub: "We work with a small number of exclusive partners. If you can move markets, let's talk about a partnership built around the vanity brand and our proprietary network.",
    bullets: ["Strictly limited — by selection", "Direct line to the founder", "Shared upside on a category asset", "Built for partners who can scale"],
    cta: "Apply to partner",
  },
};

export function generateStaticParams() {
  return Object.keys(CTAS).map((cta) => ({ cta }));
}

export async function generateMetadata({ params }: { params: Promise<{ cta: string }> }): Promise<Metadata> {
  const { cta } = await params;
  const c = CTAS[cta];
  return c ? { title: `${c.title} — 1-800-MEDIGAP`, description: c.sub } : {};
}

export default async function CtaLanding({ params }: { params: Promise<{ cta: string }> }) {
  const { cta } = await params;
  const c = CTAS[cta];
  if (!c) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/1-800-medigap" className="text-xl font-bold text-gradient">1-800-MEDIGAP</Link>
          <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand text-sm">📞 {TOLLFREE}</a>
        </div>
      </header>

      <section className="relative overflow-hidden flex-1">
        <div className="absolute inset-0 brand-gradient opacity-[0.07]" />
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-start relative">
          <div>
            <Link href="/1-800-medigap" className="text-sm text-[var(--muted)] hover:text-[var(--brand)]">← All opportunities</Link>
            <h1 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight">{c.title}</h1>
            <p className="mt-5 text-lg text-[var(--muted)]">{c.sub}</p>
            <ul className="mt-7 space-y-3">
              {c.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm"><span className="text-[var(--brand)] mt-0.5">✓</span><span>{b}</span></li>
              ))}
            </ul>
            <div className="mt-8 card p-4 bg-[var(--panel)]">
              <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Powered by</div>
              <div className="mt-1 text-sm">
                <span className="font-semibold text-[var(--brand)]">R0cketShip.com</span> build &amp; deployment ·{" "}
                <span className="font-semibold text-[var(--brand)]">PredictiveData.org</span> data engine · our proprietary network
              </div>
            </div>
          </div>
          <div className="lg:sticky lg:top-24">
            <JvForm interest={c.interest} lockInterest={c.lockInterest} cta={c.cta} />
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-6 py-8 text-xs text-[var(--muted)] flex flex-wrap justify-between gap-2">
          <span>© 2026 1-800-MEDIGAP · medigap.plus</span>
          <span>Powered by R0cketShip.com · PredictiveData.org</span>
        </div>
      </footer>

      <FounderCTA />
    </div>
  );
}
