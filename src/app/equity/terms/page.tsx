import type { Metadata } from "next";
import { SITE_DISCLOSURE, SPEED_FOOTNOTE } from "@/lib/equity/consent";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Use | Equity Direct",
  description: "The terms on which you may use equity.direct.",
  alternates: { canonical: "https://equity.direct/terms" },
};

// NOTE FOR REVIEW: working draft. Not reviewed by counsel. Home equity
// agreements sit in a space with active CFPB attention and live state
// litigation over whether they are disguised credit — the disclaimers below are
// written conservatively for that reason, but they are not a substitute for a
// lawyer reading them.
export default function TermsPage() {
  return (
    <main className="eq-wrap eq-narrow" style={{ padding: "64px 24px 90px" }}>
      <h1 className="eq-h1" style={{ fontSize: "clamp(1.9rem,4vw,2.7rem)" }}>Terms of Use</h1>
      <p style={{ marginTop: 10, color: "var(--slate)", fontSize: "0.9rem" }}>
        Last updated {new Date().toISOString().slice(0, 10)}
      </p>

      <div className="eq-prose" style={{ marginTop: 32 }}>
        <h2>What this service is</h2>
        <p>
          Equity Direct is a marketing and referral service. We introduce homeowners to
          providers of home equity agreements and to professional partners. We are{" "}
          <strong>not a lender, mortgage broker, investment adviser, or law firm</strong>.
          We do not make credit decisions, we do not originate or fund transactions, and
          nothing on this site is financial, tax, or legal advice.
        </p>

        <h2>We are paid for referrals</h2>
        <p>
          We receive compensation when we introduce you to a provider or partner. That
          compensation may vary between them. You should assume our introductions are
          commercially motivated and satisfy yourself independently that any product or
          professional is right for you.
        </p>

        <h2>No guarantee of eligibility, amount, or timing</h2>
        <p>
          Nothing here is an offer or a commitment. Whether you qualify, how much you
          could access, and on what terms are decided by the provider, not by us. Not
          everyone qualifies. {SPEED_FOOTNOTE}
        </p>

        <h2>What a home equity agreement is</h2>
        <p>
          A home equity agreement is not a loan. You receive a lump sum and grant the
          provider a share of your home&rsquo;s value, secured against the property. It
          must be settled in full when the agreement ends — usually on sale, refinance,
          or at the end of the term. If your home rises in value, the amount you settle
          rises with it, and it may exceed what an interest-bearing loan would have cost.
          These agreements are not suitable for everyone. Read any agreement in full and
          consider independent advice before signing.
        </p>

        <h2>Accuracy of what you tell us</h2>
        <p>
          You agree that the information you submit is truthful and that you are the
          homeowner, or authorised to enquire on the owner&rsquo;s behalf. Submitting
          someone else&rsquo;s details without their permission is not permitted.
        </p>

        <h2>Information on this site</h2>
        <p>
          The guidance on our pages is general information, not advice about your
          circumstances. Cost ranges are typical market ranges rather than quotes.
          Statistics are attributed to their source and were accurate when published.
          Rules, rates, incentives, and tax treatment change, and we do not warrant that
          every page reflects the current position.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Do not attempt to disrupt the site, submit automated or fraudulent enquiries,
          scrape it at scale, or use it for any unlawful purpose.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, we are not liable for any indirect or
          consequential loss arising from your use of this site or from any transaction
          you enter into with a provider or partner. Your agreement is with them, not
          with us.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms. Continued use after an update means you accept the
          revised version.
        </p>

        <h2>Contact</h2>
        <p>
          <a href="mailto:hello@equity.direct" style={{ color: "var(--gold)", textDecoration: "underline" }}>
            hello@equity.direct
          </a>
        </p>

        <p style={{ marginTop: 34, paddingTop: 22, borderTop: "1px solid var(--line)", fontSize: "0.85rem", color: "var(--slate)" }}>
          {SITE_DISCLOSURE}
        </p>
      </div>
    </main>
  );
}
