import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { Card, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Advertise Across the Senior Network — medigap.plus",
  description:
    "Reach 100,000+ in-market seniors a year with CPC banner, text and display ads. Prepaid, real-time dashboard, auto-optimization. Create an advertiser account.",
};

const features = [
  ["🎯", "In-market senior audience", "Your ads run across our network of Medicare, supplement, housing, care and life-insurance pages — in front of seniors who are actively researching and ready to act."],
  ["💳", "Simple prepaid CPC", "Fund your account, set your bid, and pay only when someone clicks. No long contracts, no insertion orders, no surprises."],
  ["📊", "Real-time dashboard", "Watch impressions, clicks, CTR, spend and pacing update live. Pause, raise bids or reallocate budget the moment you see what's working."],
  ["⚙️", "Auto-optimization", "Our engine continuously shifts your impressions toward the placements and pages that convert best, maximizing revenue-per-1,000-views for every dollar you put in."],
];

const placements = [
  ["Banner ads", "Premium above-the-fold and in-content banners across high-traffic vertical pages."],
  ["Text ads", "Native, trust-forward text units that blend into editorial content and earn clicks."],
  ["Display units", "Responsive display creatives that follow your audience across the network."],
  ["Sponsored placements", "Featured positions on category and comparison pages where intent is highest."],
];

export default function Page() {
  return (
    <>
      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-[0.07]" />
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24 relative">
          <Badge tone="brand">For Advertisers</Badge>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight max-w-4xl">
            Advertise across the <span className="text-gradient">senior network.</span>
          </h1>
          <p className="mt-5 text-lg text-[var(--muted)] max-w-2xl">
            Put your brand in front of 100,000+ in-market seniors a year. CPC banner, text and display ads — prepaid,
            measured in real time, and auto-optimized to squeeze the most revenue out of every 1,000 views.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/login" className="btn btn-brand text-base">Create advertiser account →</Link>
            <Link href="/contact" className="btn btn-ghost text-base">Talk to our ad team</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Built for performance advertisers</h2>
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

      <section className="mx-auto max-w-7xl px-6 py-6">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Placements</h2>
        <p className="text-center text-[var(--muted)] mt-2">Our platform automatically maximizes revenue-per-1,000-views across every unit.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {placements.map(([title, body]) => (
            <Card key={title}>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="card glow p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 brand-gradient opacity-[0.08]" />
          <div className="relative">
            <h2 className="text-2xl md:text-4xl font-extrabold">Start reaching seniors today</h2>
            <p className="mt-3 text-[var(--muted)] max-w-2xl mx-auto">
              Open an advertiser account, fund it, and launch your first campaign in minutes — with a real-time
              dashboard from day one.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <Link href="/login" className="btn btn-brand text-lg">Create advertiser account →</Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
