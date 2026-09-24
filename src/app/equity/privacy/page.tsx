import type { Metadata } from "next";
import { SITE_DISCLOSURE } from "@/lib/equity/consent";
import { getEquitySettings, telHref } from "@/lib/equity/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy | Equity Direct",
  description:
    "How Equity Direct collects, uses, and shares the information you give us, and the choices you have.",
  alternates: { canonical: "https://equity.direct/privacy" },
};

// Plain-language privacy policy. Written to be read rather than to be
// unreadable, and deliberately specific about the thing that matters most on a
// lead-gen site: who we pass your details to, and why.
//
// NOTE FOR REVIEW: this is a working draft covering actual data practices.
// It has not been reviewed by counsel, and state privacy laws (CCPA/CPRA and
// equivalents) impose specific disclosure and rights language that should be
// checked before launch.
export default async function PrivacyPage() {
  const { phone } = await getEquitySettings();

  return (
    <main className="eq-wrap eq-narrow" style={{ padding: "64px 24px 90px" }}>
      <h1 className="eq-h1" style={{ fontSize: "clamp(1.9rem,4vw,2.7rem)" }}>Privacy Policy</h1>
      <p style={{ marginTop: 10, color: "var(--slate)", fontSize: "0.9rem" }}>
        Last updated {new Date().toISOString().slice(0, 10)}
      </p>

      <div className="eq-prose" style={{ marginTop: 32 }}>
        <p>
          This policy explains what we collect when you use equity.direct, what we do
          with it, and what you can ask us to do. We have tried to write it in plain
          language rather than in the usual fog.
        </p>

        <h2>What we collect</h2>
        <p>
          When you complete a form, we collect what you enter: your name, email
          address, phone number, property ZIP code, and the figures you give us about
          your property and what you are trying to do. We also record which page you
          started on, because that tells us what you are interested in.
        </p>
        <p>
          Automatically, we record a first-party visitor identifier stored in a cookie,
          your IP address, your browser and device type, the pages you visit, and the
          site that referred you. If you arrive through a partner&rsquo;s referral
          link, we store that partner&rsquo;s code so the referral is attributed.
        </p>

        <h2>Why we collect it</h2>
        <p>
          To respond to your enquiry, to assess whether we can help, to introduce you to
          providers and professional partners who may be able to, and to improve the
          site. We also use it to detect and prevent fraudulent and automated
          submissions.
        </p>

        <h2>Who we share it with</h2>
        <p>
          <strong>This is the part that matters most, so we will be direct about it.</strong>{" "}
          We are a marketing and referral service. When you submit an enquiry, we may
          share the information you gave us with home equity agreement providers and
          with professional partners relevant to your stated reason. We are compensated
          for those introductions. That is our business model, and you should understand
          it before you submit anything.
        </p>
        <p>
          We also share information with service providers who operate the site on our
          behalf — hosting, email delivery, and anti-spam verification — and where we are
          required to by law.
        </p>
        <p>
          If you were referred by a partner, that partner can see that you enquired, your
          first name and last initial, your ZIP code, your stated reason, and the status
          of your enquiry. <strong>They do not see your email address or phone number.</strong>
        </p>

        <h2>Calls and texts</h2>
        <p>
          We only call or text you if you ticked the consent box, and we store the exact
          wording you agreed to along with the time and IP address. Consent is never a
          condition of anything. You can withdraw it at any time by replying STOP to a
          text or telling us on a call. If you did not consent, we will
          only contact you by email.
        </p>

        <h2>Cookies</h2>
        <p>
          We use a first-party cookie to recognise your device across visits and to
          attribute partner referrals. We do not need your permission to run the site,
          but you can clear or block cookies in your browser; attribution and some
          conveniences will stop working if you do.
        </p>

        <h2>How long we keep it</h2>
        <p>
          We keep enquiry records for as long as needed to provide the service and to
          meet our legal and record-keeping obligations, including proving consent where
          it was given. You can ask us to delete your information and we will do so
          unless we are required to retain it.
        </p>

        <h2>Your choices</h2>
        <p>
          You can ask us what we hold about you, ask us to correct it, ask us to delete
          it, and ask us to stop contacting you. Depending on where you live you may have
          additional statutory rights, including the right to opt out of the sharing of
          your personal information. Call us and we will act on it.
        </p>

        <h2>Children</h2>
        <p>
          This site is for homeowners and is not directed at anyone under 18. We do not
          knowingly collect information from children.
        </p>

        <h2>Security</h2>
        <p>
          Information is transmitted over an encrypted connection and access is limited
          to people who need it. No system is perfectly secure, and we will not pretend
          otherwise.
        </p>

        <h2>Changes</h2>
        <p>
          If we change this policy we will update the date at the top. Material changes
          will be made obvious rather than slipped in.
        </p>

        <h2>Contact</h2>
        <p>
          Questions, requests, or complaints — including asking us to delete your
          information or stop contacting you — call{" "}
          <a href={telHref(phone)} style={{ color: "var(--gold)", textDecoration: "underline" }}>
            {phone}
          </a>.
        </p>

        <p style={{ marginTop: 34, paddingTop: 22, borderTop: "1px solid var(--line)", fontSize: "0.85rem", color: "var(--slate)" }}>
          {SITE_DISCLOSURE}
        </p>
      </div>
    </main>
  );
}
