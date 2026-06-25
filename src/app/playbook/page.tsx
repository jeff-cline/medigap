import type { Metadata } from "next";
import Link from "next/link";
import PlaybookForm from "@/components/PlaybookForm";
import { getCurrentSite } from "@/lib/site";
import { TOLLFREE_TEL } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getCurrentSite();
  const name = site?.name || "R0cketShip";
  return { title: `Uberize your industry — ${name}`, description: "Every industry is a geek away from being uberized. Are you ready to disrupt your market? Join the movement — powered by the R0cketShip Core." };
}

const STEPS = [
  ["Bring the idea", "Pick a market that's stuck in the old way of doing things. There's one in every industry."],
  ["Plug into the Core", "Skip years of build. CRM, data enrichment, communications, attribution and an API — already running."],
  ["Launch on the network", "Your own branded front door, sharing one powerful backend with every other business on the Core."],
  ["Monetize & compound", "Every lead is tracked, nurtured and re-marketed forever. Each new business makes every other one stronger."],
];

export default async function PlaybookPage() {
  const site = await getCurrentSite();
  const brandName = site?.name || "R0cketShip";
  const style = site?.brandColor ? ({ "--brand": site.brandColor } as React.CSSProperties) : undefined;

  return (
    <div style={style} className={site ? "theme-light min-h-screen bg-[var(--bg)]" : "min-h-screen bg-[var(--bg)]"}>
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gradient">{site?.logoUrl ? <img src={site.logoUrl} alt={brandName} className="h-8 w-auto" /> : brandName}</Link>
          <a href="#join" className="btn btn-brand text-sm">Join the movement</a>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-[0.07]" />
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]"><span className="live-dot text-[var(--brand)]">●</span> The disruption playbook</div>
          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold leading-[1.05]">
            Every industry is <span className="text-gradient">a geek away</span> from being uberized.
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-[var(--muted)]">Are you ready to disrupt your market?</p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <a href="#join" className="btn btn-brand text-base">Join the movement →</a>
            <a href="#how" className="btn btn-ghost text-base">See the playbook</a>
          </div>
        </div>
      </section>

      {/* the thesis */}
      <section className="border-y border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p className="text-2xl md:text-3xl font-medium leading-snug">
            Taxis had Uber. Hotels had Airbnb. <span className="text-gradient font-bold">Your industry is next</span> — and the hard part is already built.
          </p>
          <p className="mt-4 text-[var(--muted)]">The Core is a running platform — CRM, data, communications, attribution and an API. You bring the market; we bring the engine.</p>
        </div>
      </section>

      {/* playbook steps */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-bold text-center">The launch playbook</h2>
        <p className="text-center text-[var(--muted)] mt-2">Four steps from idea to a business on the network.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <div key={t} className="card p-6">
              <div className="text-3xl font-extrabold text-gradient">0{i + 1}</div>
              <div className="mt-2 font-semibold text-lg">{t}</div>
              <div className="text-sm text-[var(--muted)] mt-1">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* what you get */}
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["A running backend", "CRM, data append, comms, billing — live from day one."],
            ["A demand engine", "Owned acquisition + attribution that tracks every lead to revenue."],
            ["The network effect", "Every business on the Core strengthens every other one."],
            ["Your own brand", "A branded front door; the Core is invisible to your customers."],
            ["An API + SDK", "Build deeper, or let partners build on you."],
            ["A partner who's done it", "Real businesses already running on the Core."],
          ].map(([t, d]) => (
            <div key={t} className="card p-5"><div className="font-semibold">{t}</div><div className="text-sm text-[var(--muted)] mt-1">{d}</div></div>
          ))}
        </div>
      </section>

      {/* CTA form */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to <span className="text-gradient">disrupt your market?</span></h2>
          <p className="mt-3 text-[var(--muted)]">Join the movement. Tell us your industry and we&apos;ll take it from there.</p>
        </div>
        <PlaybookForm />
      </section>

      {/* secret weapon link */}
      <section className="mx-auto max-w-3xl px-6 pb-16 text-center">
        <Link href="/playbook/secret-weapon" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--brand)] border-b border-dashed border-[var(--border)] pb-0.5">
          🗝️ Founders &amp; executives: discover the Secret Weapon →
        </Link>
      </section>

      <footer className="border-t border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
          <span>© 2026 {brandName} · powered by the R0cketShip Core.</span>
          <a href={`tel:${TOLLFREE_TEL}`} className="hover:text-[var(--brand)]">Talk to us</a>
        </div>
      </footer>
    </div>
  );
}
