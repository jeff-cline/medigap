import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { Card, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Upsell Vendors — Receive Transferred Senior Calls | medigap.plus",
  description:
    "Offer a complementary senior product? Receive warm, transferred calls from seniors who just finished with us and are open to your offer. Become an upsell vendor.",
};

const features = [
  ["🔁", "Warm transfers, not cold dials", "After we help a senior, many are open to a complementary offer. We transfer them to you while they're still on the phone and in a buying frame of mind."],
  ["🧩", "Complementary, not competing", "Think final expense after a Medicare call, medical alert devices, dental discount plans, home services, OTC programs — products that genuinely help the senior we just served."],
  ["🎚️", "You control the flow", "Set your hours, capacity and qualifying criteria. Turn volume up when you can sell and down when you can't — you only get what you can handle."],
  ["💵", "Pay only for connected calls", "No retainers and no aged lists. You pay for live, connected transfers of consenting seniors — clean, simple, and accountable."],
];

export default function Page() {
  return (
    <>
      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-[0.07]" />
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24 relative">
          <Badge tone="brand">Upsell Vendors</Badge>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight max-w-4xl">
            Get warm seniors, <span className="text-gradient">already on the phone.</span>
          </h1>
          <p className="mt-5 text-lg text-[var(--muted)] max-w-2xl">
            If you sell a complementary senior product, we&apos;ll transfer you consenting seniors right after we help
            them — warm, engaged and open to a relevant next step. You pay only for connected calls.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-brand text-base">Become an upsell vendor →</Link>
            <Link href="/contact" className="btn btn-ghost text-base">See if you&apos;re a fit</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center">A pipeline of in-the-moment seniors</h2>
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

      <section className="border-y border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-3 gap-4 text-center">
          <div><div className="text-3xl md:text-4xl font-extrabold text-gradient">36,000+</div><div className="mt-1 text-sm text-[var(--muted)]">calls / yr to transfer from</div></div>
          <div><div className="text-3xl md:text-4xl font-extrabold text-gradient">100,000+</div><div className="mt-1 text-sm text-[var(--muted)]">seniors helped</div></div>
          <div><div className="text-3xl md:text-4xl font-extrabold text-[var(--gold)]">Live</div><div className="mt-1 text-sm text-[var(--muted)]">warm transfers only</div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="card glow p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 brand-gradient opacity-[0.08]" />
          <div className="relative">
            <h2 className="text-2xl md:text-4xl font-extrabold">Let&apos;s build your transfer pipeline</h2>
            <p className="mt-3 text-[var(--muted)] max-w-2xl mx-auto">
              Tell us what you sell and the seniors you want. We&apos;ll map it to our call flow and start sending warm
              transfers.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <Link href="/contact" className="btn btn-brand text-lg">Contact our partnerships team →</Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
