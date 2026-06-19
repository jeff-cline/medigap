import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { Card, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Live Inbound Calls for Insurance Agents — medigap.plus",
  description:
    "Get live, high-intent inbound senior calls. Pay-per-call bidding from $25/call, $99/mo per ZIP seat, star ratings, on/off availability and built-in CRM. Join now.",
};

const features = [
  ["📞", "Live, high-intent inbound calls", "These aren't aged internet leads. They're seniors calling in right now about Medicare, supplements, housing, care and life insurance — routed straight to your phone."],
  ["💲", "Pay-per-call bidding from $25", "Set your bid and only pay for calls you actually take. Bid higher to win more volume in your ZIPs; pause anytime. No retainers, no mystery fees."],
  ["📍", "Own your ZIPs — $99/mo per seat", "Lock down the territories you want with a $99/month per-ZIP seat. Protect your market and get consistent, local flow."],
  ["⭐", "Star ratings reward great agents", "Callers rate their experience. Higher-rated agents win more routing priority, so doing right by seniors directly grows your book."],
  ["🟢", "On/off availability", "Flip yourself available when you're ready to sell and off when you're not. Never pay for a call you can't take."],
  ["🗂️", "Built-in CRM", "Every call lands in your dashboard with recordings, caller details and follow-up status — so nothing slips and every dollar is accounted for."],
];

export default function Page() {
  return (
    <>
      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-[0.07]" />
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24 relative">
          <Badge tone="brand">For Licensed Agents</Badge>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight max-w-4xl">
            Get live, high-intent <span className="text-gradient">inbound calls.</span>
          </h1>
          <p className="mt-5 text-lg text-[var(--muted)] max-w-2xl">
            Stop chasing dead internet leads. Bid on real seniors calling in right now — pay-per-call from $25, own
            your ZIPs for $99/month per seat, and manage everything in one dashboard with a built-in CRM.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/login" className="btn btn-brand text-base">Start getting calls →</Link>
            <Link href="/contact" className="btn btn-ghost text-base">Questions? Talk to us</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Everything you need to close more seniors</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <div><div className="text-3xl md:text-4xl font-extrabold text-gradient">36,000+</div><div className="mt-1 text-sm text-[var(--muted)]">calls / yr routed</div></div>
          <div><div className="text-3xl md:text-4xl font-extrabold text-gradient">from $25</div><div className="mt-1 text-sm text-[var(--muted)]">per live call</div></div>
          <div><div className="text-3xl md:text-4xl font-extrabold text-[var(--gold)]">$99/mo</div><div className="mt-1 text-sm text-[var(--muted)]">per ZIP seat</div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="card glow p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 brand-gradient opacity-[0.08]" />
          <div className="relative">
            <h2 className="text-2xl md:text-4xl font-extrabold">Turn your phone into a pipeline</h2>
            <p className="mt-3 text-[var(--muted)] max-w-2xl mx-auto">
              Create your agent account, pick your ZIPs, set your bids and go live. Calls can start ringing today.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <Link href="/login" className="btn btn-brand text-lg">Create agent account →</Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
