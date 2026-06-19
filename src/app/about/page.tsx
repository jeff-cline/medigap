import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { TOLLFREE, TOLLFREE_TEL } from "@/lib/format";
import { Card, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "About the Network — medigap.plus",
  description:
    "medigap.plus is a multi-million-dollar senior-marketing business reimagined as an AI-run platform — 36,000 inbound calls and 100,000 leads a year, now fully orchestrated.",
};

const pillars = [
  ["📞", "A real, proven business", "This isn't a startup deck. Last year alone the network handled 36,000+ inbound senior calls and generated 100,000+ leads across Medicare, supplements, housing, care and life insurance."],
  ["🤖", "Now run by AI", "We've rebuilt that operation around an AI core that listens to calls, scores intent, routes seniors to the best-fit licensed agent, optimizes ad spend and prices every lead in real time."],
  ["🤝", "Better for seniors", "Faster connections, better-matched specialists and accountability through ratings — so the senior on the phone gets help, not a runaround."],
  ["📈", "Better for partners", "Agents, advertisers, carriers and investors all plug into one engine with transparent, real-time dashboards — and share in the value it creates."],
];

export default function Page() {
  return (
    <>
      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-[0.07]" />
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24 relative">
          <Badge tone="brand">About the Network</Badge>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight max-w-4xl">
            A multi-million-dollar senior business, <span className="text-gradient">reborn as an AI platform.</span>
          </h1>
          <p className="mt-5 text-lg text-[var(--muted)] max-w-3xl">
            medigap.plus is the marketing network for the entire over-65 community. We took a proven, multi-million-dollar
            senior-marketing business — one that handled 36,000 inbound calls and 100,000 leads last year — and rebuilt
            it from the ground up to be run by AI. The result is a single platform that connects seniors to the right
            help, and connects agents, advertisers, carriers and investors to real opportunity.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand text-base">📞 {TOLLFREE}</a>
            <Link href="/contact" className="btn btn-ghost text-base">Get in touch</Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-3 gap-4 text-center">
          <div><div className="text-3xl md:text-4xl font-extrabold text-gradient">36,000+</div><div className="mt-1 text-sm text-[var(--muted)]">inbound calls last year</div></div>
          <div><div className="text-3xl md:text-4xl font-extrabold text-gradient">100,000+</div><div className="mt-1 text-sm text-[var(--muted)]">seniors helped</div></div>
          <div><div className="text-3xl md:text-4xl font-extrabold text-[var(--gold)]">★ 4.8</div><div className="mt-1 text-sm text-[var(--muted)]">avg specialist rating</div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center">What makes the network different</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {pillars.map(([icon, title, body]) => (
            <Card key={title}>
              <div className="text-3xl">{icon}</div>
              <h3 className="mt-3 font-semibold text-lg">{title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-14">
        <Card>
          <h3 className="font-semibold text-lg">Our mission</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Seniors face some of the most confusing, highest-stakes decisions of their lives — and too often they face
            them alone, surrounded by sales pitches. Our mission is to make every one of those decisions simpler and
            more trustworthy by pairing world-class AI with real, licensed human experts. When we do that well,
            everyone in the network wins.
          </p>
        </Card>
      </section>

      <SiteFooter />
    </>
  );
}
