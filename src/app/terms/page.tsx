import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { TOLLFREE, TOLLFREE_TEL } from "@/lib/format";
import { Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Terms of Service — medigap.plus",
  description: "The terms of service governing your use of the medigap.plus network of websites and services.",
};

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="scroll-mt-24">
      <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm text-[var(--muted)] leading-relaxed">{children}</div>
    </section>
  );
}

export default function Page() {
  return (
    <>
      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient opacity-[0.06]" />
        <div className="mx-auto max-w-3xl px-6 py-14 md:py-20 relative">
          <Badge tone="brand">Legal</Badge>
          <h1 className="mt-5 text-3xl md:text-5xl font-extrabold leading-tight">Terms of Service</h1>
          <p className="mt-4 text-[var(--muted)]">
            These terms govern your use of medigap.plus and the websites, phone numbers and services in our network
            (the &quot;Network&quot;). By using the Network, you agree to them. Last updated June 19, 2026.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 pb-16 space-y-10">
        <Block title="Acceptance of terms">
          <p>
            By accessing or using the Network, submitting a form, or calling us, you agree to these Terms of Service and
            our <Link className="text-[var(--brand)] hover:underline" href="/privacy">Privacy Policy</Link>. If you do
            not agree, please do not use the Network.
          </p>
        </Block>

        <Block title="What we do">
          <p>
            The Network is a marketing and referral platform that connects consumers — primarily seniors and their
            families — with licensed insurance agents, carriers, placement advisors and related partners. We are not an
            insurance company, and we do not provide insurance, medical, legal, financial or tax advice. Any plan
            selection or enrollment is between you and the licensed professional or carrier you choose.
          </p>
        </Block>

        <Block title="Not government affiliated">
          <p>
            The Network is a private entity. We are not affiliated with or endorsed by the U.S. government or the federal
            Medicare program. For official information, contact Medicare.gov or 1-800-MEDICARE.
          </p>
        </Block>

        <Block title="Consent to be contacted">
          <p>
            When you submit your information or call us, you consent to be contacted as described in our Privacy Policy,
            including by phone, SMS and email — potentially using automated technology — about insurance and related
            senior products. Consent is not a condition of any purchase, and you may opt out at any time.
          </p>
        </Block>

        <Block title="Eligibility & acceptable use">
          <p>
            You must be at least 18 years old to use the Network. You agree to provide accurate information, to use the
            Network only for lawful purposes, and not to interfere with, scrape, overload or attempt to gain
            unauthorized access to the Network or its systems.
          </p>
        </Block>

        <Block title="Partner & account portals">
          <p>
            Agents, advertisers, investors and other partners who access portal features (for example via{" "}
            <Link className="text-[var(--brand)] hover:underline" href="/login">our login</Link>) are responsible for
            safeguarding their credentials and for all activity under their accounts, and may be subject to additional
            written agreements that govern their participation.
          </p>
        </Block>

        <Block title="Intellectual property">
          <p>
            The Network and its content, logos, software and design are owned by us or our licensors and are protected by
            intellectual property laws. You may not copy, modify, distribute or create derivative works without our
            permission.
          </p>
        </Block>

        <Block title="Disclaimers">
          <p>
            The Network is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
            express or implied, including fitness for a particular purpose, accuracy and non-infringement. Information
            on the Network is for general purposes and may not reflect the most current plans, prices or availability in
            your area.
          </p>
        </Block>

        <Block title="Limitation of liability">
          <p>
            To the fullest extent permitted by law, the Network and its operators will not be liable for any indirect,
            incidental, special, consequential or punitive damages, or any loss arising from your use of the Network or
            your dealings with any agent, carrier or partner you are connected to through it.
          </p>
        </Block>

        <Block title="Indemnification">
          <p>
            You agree to indemnify and hold harmless the Network and its operators from claims, damages and expenses
            arising out of your use of the Network or your violation of these terms.
          </p>
        </Block>

        <Block title="Changes & governing law">
          <p>
            We may update these terms from time to time; continued use of the Network after changes means you accept the
            updated terms. These terms are governed by the laws of the United States and the state in which we are
            organized, without regard to conflict-of-law rules.
          </p>
        </Block>

        <Block title="Contact">
          <p>
            Questions about these terms? Email{" "}
            <a className="text-[var(--brand)] hover:underline" href="mailto:legal@medigap.plus">legal@medigap.plus</a>,
            call <a className="text-[var(--brand)] hover:underline" href={`tel:${TOLLFREE_TEL}`}>{TOLLFREE}</a>, or use our{" "}
            <Link className="text-[var(--brand)] hover:underline" href="/contact">contact page</Link>.
          </p>
        </Block>
      </div>

      <SiteFooter />
    </>
  );
}
