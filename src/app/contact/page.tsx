import type { Metadata } from "next";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { TOLLFREE, TOLLFREE_TEL } from "@/lib/format";
import { Card, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact medigap.plus — Call 1-800-MEDIGAP",
  description:
    "Reach the medigap.plus team. Call 1-800-MEDIGAP, email us, or send a message. Seniors and families plus agent, advertiser, investor and partner inquiries welcome.",
};

export default function Page() {
  return (
    <>
      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-[0.07]" />
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-start relative">
          <div>
            <Badge tone="brand">Contact</Badge>
            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-tight">
              We&apos;re here to <span className="text-gradient">help.</span>
            </h1>
            <p className="mt-5 text-lg text-[var(--muted)]">
              Whether you&apos;re a senior or family member who needs guidance, or a partner exploring a relationship
              with the network, reach out — a real person will get back to you.
            </p>

            <div className="mt-8 space-y-4">
              <Card>
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Call us — fastest</div>
                <a href={`tel:${TOLLFREE_TEL}`} className="mt-1 block text-2xl font-extrabold text-gradient">📞 {TOLLFREE}</a>
                <div className="mt-1 text-sm text-[var(--muted)]">Licensed specialists are standing by.</div>
              </Card>
              <Card>
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Email</div>
                <a href="mailto:hello@medigap.plus" className="mt-1 block text-lg font-semibold text-[var(--brand)] hover:underline">hello@medigap.plus</a>
                <div className="mt-1 text-sm text-[var(--muted)]">Privacy requests: <a className="text-[var(--brand)] hover:underline" href="mailto:privacy@medigap.plus">privacy@medigap.plus</a></div>
              </Card>
              <Card>
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Partner inquiries</div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Agents, advertisers, investors and carrier/risk partners: use the form and tell us which program
                  you&apos;re interested in, or visit{" "}
                  <Link className="text-[var(--brand)] hover:underline" href="/agents">Agents</Link>,{" "}
                  <Link className="text-[var(--brand)] hover:underline" href="/advertise">Advertise</Link>,{" "}
                  <Link className="text-[var(--brand)] hover:underline" href="/investors">Investors</Link> or{" "}
                  <Link className="text-[var(--brand)] hover:underline" href="/risk-partners">Risk Partners</Link>.
                </p>
              </Card>
            </div>
          </div>

          <div id="quote" className="md:pt-12">
            <h2 className="text-lg font-semibold mb-3">Send us a message</h2>
            <LeadForm vertical="contact" />
            <p className="mt-4 text-xs text-[var(--muted)]">
              Prefer to talk now? Call <a className="text-[var(--brand)] hover:underline" href={`tel:${TOLLFREE_TEL}`}>{TOLLFREE}</a> for the fastest help.
            </p>
          </div>
        </div>
      </section>

      <p className="mx-auto max-w-7xl px-6 pb-12 text-xs text-[var(--muted)]">
        Not affiliated with or endorsed by the U.S. government or federal Medicare program.
      </p>

      <SiteFooter />
    </>
  );
}
