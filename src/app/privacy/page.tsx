import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import PublicHeader from "@/components/PublicHeader";
import { TOLLFREE, TOLLFREE_TEL } from "@/lib/format";
import { Card, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy Policy — medigap.plus",
  description:
    "The centralized privacy policy for the medigap.plus network, including data we collect, TCPA call/SMS consent, sharing with licensed agents, cookies, and your rights.",
};

function Block({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
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
          <Badge tone="brand">Privacy</Badge>
          <h1 className="mt-5 text-3xl md:text-5xl font-extrabold leading-tight">Privacy Policy</h1>
          <p className="mt-4 text-[var(--muted)]">
            This is the centralized privacy policy for medigap.plus and the websites, brands and phone numbers in our
            network (the &quot;Network&quot;). It explains what we collect, how we use it, and the choices you have.
            Last updated June 26, 2026.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 pb-16 space-y-10">
        <Block title="Who this policy covers">
          <p>
            This policy applies to all sites, landing pages, call centers and phone numbers operated by the Network,
            including 1-800-MEDIGAP. Many sites in the Network link here as their master privacy policy.
          </p>
        </Block>

        <Block title="Information we collect">
          <p>We collect information you give us and information collected automatically, including:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Contact details</strong> — name, phone number, email and ZIP code.</li>
            <li><strong>Eligibility details</strong> — date of birth and the products or services you ask about (e.g., Medicare, supplements, housing, care, life insurance).</li>
            <li><strong>Call information</strong> — when you call us or are connected to an agent, your call may be recorded and analyzed (including by AI) for quality, routing, training and compliance.</li>
            <li><strong>Technical data</strong> — IP address, device and browser details, and how you interact with our pages, collected via cookies and similar technologies.</li>
          </ul>
        </Block>

        <Block title="How we use your information">
          <ul className="list-disc pl-5 space-y-1">
            <li>To connect you with licensed agents, specialists and partners who can help with what you requested.</li>
            <li>To contact you by phone, SMS and email about insurance and related senior products and services.</li>
            <li>To route, score and improve calls and leads, including with AI-assisted analysis.</li>
            <li>To operate, secure and improve the Network and comply with legal obligations.</li>
          </ul>
        </Block>

        <Block title="Calls, texts & TCPA consent">
          <p>
            When you provide your phone number and submit a form or call us, you agree that the Network and its
            licensed agent and marketing partners may contact you at that number — including by automatic telephone
            dialing system, prerecorded or artificial voice, and SMS text — about insurance and related senior products,
            even if your number is on a state or federal Do Not Call list.
 By submitting your information you also agree it
            may be shared with our Affiliated Companies, JV partners and affiliate networks who may likewise contact you
            about relevant products. <strong>Consent is not a condition of any purchase</strong>, and message/data rates
            may apply. You can opt out of calls or texts at any time by asking the caller to stop, replying STOP to a
            text, or contacting us using the details below.
          </p>
        </Block>

        <Block title="How we share information with licensed agents & partners">
          <p>
            The core of our service is connecting you with people who can help. We may share the information you provide
            with licensed insurance agents, brokers, carriers, placement advisors and vetted marketing partners so they
            can respond to your request and present relevant offers. We may also share data with service providers who
            operate our technology on our behalf, and as required by law. We do not sell your sensitive personal
            information for money in the traditional sense, but some sharing for advertising may be considered a
            &quot;sale&quot; or &quot;sharing&quot; under certain state laws — see your rights below.
          </p>
        </Block>

        <Block id="family" title="Our family of companies, JV partners & affiliate networks">
          <p>
            The Network is part of a family of brands, businesses and joint ventures operated by, affiliated with, or
            partnered with <strong>R0cketShip.com (R0cketShip Holdings)</strong> and its sister and portfolio companies
            (together, our &quot;Affiliated Companies&quot;). To serve you better, faster and at lower cost, we may share
            the information you provide <strong>across our Affiliated Companies, joint-venture (JV) partners, and the
            affiliate marketing networks we work with</strong>. We do this to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>match your request to the company, brand or partner best able to help — including connecting your call or inquiry to an affiliate network that can present a relevant offer;</li>
            <li>avoid duplicate outreach and shared technology costs, so we can keep our services free to you;</li>
            <li>improve routing, scoring, analytics, fraud prevention and the overall quality of our services across the family of companies; and</li>
            <li>present additional products and services across our brands that may interest you.</li>
          </ul>
          <p>
            Affiliated Companies, JV partners and affiliate networks that receive your information use it consistent with
            this policy and their own privacy practices and applicable law. Some of this sharing may be considered a
            &quot;sale&quot; or &quot;sharing&quot; under certain state privacy laws. You can limit it at any time —
            see <Link className="text-[var(--brand)] hover:underline" href="#dnsmi">Do Not Sell or Share My Information</Link> below.
          </p>
        </Block>

        <Block title="Cookies & tracking">
          <p>
            We and our partners use cookies, pixels and similar technologies to run the site, remember your preferences,
            measure performance and deliver and measure advertising. You can control cookies through your browser
            settings; disabling some cookies may affect how the site works.
          </p>
        </Block>

        <Block title="Your privacy rights">
          <p>
            Depending on where you live, you may have the right to access, correct or delete the personal information we
            hold about you, to opt out of certain sharing or targeted advertising, and to not be discriminated against
            for exercising these rights. To make a request, use the section below or the contact details that follow.
          </p>
        </Block>

        <Block id="dnsmi" title="Do Not Sell or Share My Information">
          <Card>
            <p className="text-sm text-[var(--muted)]">
              You may request that we not sell or share your personal information for cross-context behavioral
              advertising. To submit a &quot;Do Not Sell or Share My Information&quot; request, contact us using any of
              the methods below and include the words <strong>&quot;Do Not Sell or Share&quot;</strong> along with the
              name, phone number, email and ZIP code you provided so we can locate your records:
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              <li>📧 Email: <a className="text-[var(--brand)] hover:underline" href="mailto:privacy@medigap.plus">privacy@medigap.plus</a> with subject &quot;Do Not Sell or Share&quot;</li>
              <li>📞 Phone: <a className="text-[var(--brand)] hover:underline" href={`tel:${TOLLFREE_TEL}`}>{TOLLFREE}</a></li>
              <li>✉️ Or use our <Link className="text-[var(--brand)] hover:underline" href="/contact">contact form</Link> and note your request.</li>
            </ul>
            <p className="mt-3 text-xs text-[var(--muted)]">
              We will honor verified requests as required by applicable law. An authorized agent may submit a request on
              your behalf with proof of authorization.
            </p>
          </Card>
        </Block>

        <Block title="Data retention & security">
          <p>
            We keep personal information for as long as needed to provide our services, meet legal and compliance
            obligations, and resolve disputes. We use reasonable administrative, technical and physical safeguards to
            protect your information, though no method of transmission or storage is completely secure.
          </p>
        </Block>

        <Block title="Children's privacy">
          <p>
            The Network is intended for adults — primarily seniors and their families — and is not directed to children.
            We do not knowingly collect personal information from children under 18.
          </p>
        </Block>

        <Block title="Changes to this policy">
          <p>
            We may update this policy from time to time. Material changes will be reflected by updating the date above
            and, where appropriate, by additional notice.
          </p>
        </Block>

        <Block title="Contact us">
          <p>
            Questions or requests about privacy? Email{" "}
            <a className="text-[var(--brand)] hover:underline" href="mailto:privacy@medigap.plus">privacy@medigap.plus</a>,
            call <a className="text-[var(--brand)] hover:underline" href={`tel:${TOLLFREE_TEL}`}>{TOLLFREE}</a>, or use our{" "}
            <Link className="text-[var(--brand)] hover:underline" href="/contact">contact page</Link>.
          </p>
          <p className="text-xs">
            Not affiliated with or endorsed by the U.S. government or federal Medicare program.
          </p>
        </Block>
      </div>

      <SiteFooter />
    </>
  );
}
