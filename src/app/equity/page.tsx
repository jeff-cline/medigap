import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, USES, byCategory, featured, pathFor } from "@/lib/equity";
import { STATS, SPEED_CLAIM, SPEED_FOOTNOTE } from "@/lib/equity/consent";
import QualifyForm from "./QualifyForm";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Equity Direct — Access Your Home Equity Without a Monthly Payment",
  description:
    "US homeowners hold $35.8 trillion in home equity. Access yours without a monthly payment or an interest rate — for any of 100 reasons. Free and no obligation.",
  alternates: { canonical: "https://equity.direct/" },
  openGraph: {
    title: "Access Your Home Equity Without a Monthly Payment",
    description:
      "An equity agreement is not a loan. No interest rate, no monthly payment. See what you could access in about two minutes.",
    url: "https://equity.direct/",
    siteName: "Equity Direct",
  },
};

export default function EquityHome() {
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Equity Direct",
    url: "https://equity.direct/",
    description:
      "Marketing and referral service connecting homeowners with home equity agreement providers and professional partners.",
  };
  const homeFaqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqLd) }} />

      {/* ── hero ──────────────────────────────────────────────────── */}
      <section className="eq-hero">
        <div className="eq-wrap">
          <div className="eq-layout">
            <div>
              <p className="eq-eyebrow">
                <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2 2 10h3v11h5v-6h4v6h5V10h3z" fill="currentColor" />
                </svg>
                Not a loan · No monthly payment
              </p>
              <h1 className="eq-h1">
                Your home is worth more than your bank account.
                <br />
                <em>Reach it without a monthly payment.</em>
              </h1>
              <p className="eq-lede">
                A home equity agreement is not debt. There is no interest rate and
                no monthly bill. You receive a lump sum now and share a portion of
                your home&rsquo;s value later — so you keep the house, and the asset
                keeps working for you.
              </p>

              <div className="eq-stat">
                <span className="eq-stat-big">{STATS.ownersEquity.value}</span>
                <span className="eq-stat-label">{STATS.ownersEquity.label}</span>
                <span className="eq-stat-src">
                  Source:{" "}
                  <a href={STATS.ownersEquity.href} target="_blank" rel="noopener noreferrer">
                    {STATS.ownersEquity.source}
                  </a>{" "}
                  — {STATS.equityShare.value} of all household real estate value.
                </span>
              </div>

              <div className="eq-actions">
                <Link href="#qualify" className="eq-btn">
                  See what you qualify for
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.4"
                          strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link href="#reasons" className="eq-btn eq-btn-ghost">Browse all 100 reasons</Link>
              </div>
              <p style={{ marginTop: 14, fontSize: "0.85rem", color: "var(--slate)" }}>
                Free · No obligation · Does not affect your credit score
              </p>
            </div>

            <aside>
              <QualifyForm />
            </aside>
          </div>
        </div>
      </section>

      {/* ── how it works ──────────────────────────────────────────── */}
      <section className="eq-section" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="eq-wrap">
          <h2 className="eq-h2">How it works</h2>
          <p className="eq-sub">
            Four steps. Nothing is committed until you sign, and you can stop at any point.
          </p>
          <div className="eq-steps">
            {[
              { h: "Tell us about the property", p: "A ZIP code, a rough value, and what you owe. About two minutes, and no credit check to find out." },
              { h: "We check your options", p: "We match your property and your reason against the providers and partners in our network." },
              { h: "Review the terms", p: "You see exactly what is offered, what share is involved, and how it settles — before anything is signed." },
              { h: "Funds released", p: SPEED_CLAIM },
            ].map((s) => (
              <div className="eq-step" key={s.h}>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22, fontSize: "0.8rem", color: "var(--slate)", maxWidth: "48rem" }}>
            {SPEED_FOOTNOTE}
          </p>
        </div>
      </section>

      {/* ── the silo: categories ──────────────────────────────────── */}
      <section className="eq-section eq-section-light" id="reasons">
        <div className="eq-wrap">
          <h2 className="eq-h2">A hundred reasons, in nine categories</h2>
          <p className="eq-sub">
            Homeowners reach for equity for very different things, and the right
            structure is not the same for a kitchen as it is for a business
            acquisition. Start with what you are actually trying to do.
          </p>

          <div className="eq-cats">
            {CATEGORIES.map((c) => {
              const items = byCategory(c.key);
              return (
                <Link key={c.key} href={`/${c.key}`} className="eq-cat">
                  <span className="eq-cat-n">{String(items.length).padStart(2, "0")} pages</span>
                  <h3 className="eq-h3">{c.label}</h3>
                  <p>{c.blurb}</p>
                  <div className="eq-cat-list">
                    {items.slice(0, 4).map((u) => (
                      <span className="eq-chip" key={u.slug}>{u.reason}</span>
                    ))}
                  </div>
                  <span className="eq-cat-more">See all {items.length} →</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── the full index: every one of the 100, one click from here ── */}
      <section className="eq-section eq-section-light" style={{ paddingTop: 0 }}>
        <div className="eq-wrap">
          <h2 className="eq-h2" style={{ fontSize: "1.6rem" }}>Every reason we cover</h2>
          <p className="eq-sub" style={{ fontSize: "0.95rem" }}>
            All 100, linked directly. Pick the one that matches your situation.
          </p>
          <div className="eq-index">
            {CATEGORIES.map((c) => (
              <div key={c.key}>
                <h3><Link href={`/${c.key}`}>{c.label}</Link></h3>
                <ul>
                  {byCategory(c.key).map((u) => (
                    <li key={u.slug}>
                      <Link href={pathFor(u)}>{u.reason}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── featured ──────────────────────────────────────────────── */}
      <section className="eq-section">
        <div className="eq-wrap">
          <h2 className="eq-h2">Most common</h2>
          <p className="eq-sub">The reasons homeowners ask about most often.</p>
          <div className="eq-related-grid" style={{ marginTop: 22 }}>
            {featured().map((u) => (
              <Link key={u.slug} href={pathFor(u)}>
                <strong style={{ display: "block", color: "var(--parchment)" }}>{u.reason}</strong>
                <span style={{ fontSize: "0.84rem", color: "var(--slate)" }}>{u.description.slice(0, 82)}…</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ for AEO ───────────────────────────────────────────── */}
      <section className="eq-section" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="eq-wrap eq-narrow">
          <h2 className="eq-h2">Straight answers</h2>
          <div style={{ marginTop: 22 }}>
            {HOME_FAQS.map((f) => (
              <div className="eq-faq-item" key={f.q}>
                <h3 className="eq-faq-q">{f.q}</h3>
                <p className="eq-faq-a">{f.a}</p>
              </div>
            ))}
          </div>
          <div className="eq-actions" style={{ justifyContent: "center", marginTop: 36 }}>
            <Link href="#qualify" className="eq-btn">See what you qualify for</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// Visible on the page and mirrored into FAQPage structured data — the two must
// match exactly, which is why they come from one array.
const HOME_FAQS = [
  {
    q: "What is a home equity agreement?",
    a: "A contract in which you receive a lump sum today in exchange for a share of your home's future value. It is not a loan: there is no interest rate and no monthly payment. It is settled in full when you sell the home, refinance, or reach the end of the agreement's term — typically 10 to 30 years.",
  },
  {
    q: "How is this different from a HELOC or a home equity loan?",
    a: "A HELOC and a home equity loan are debt. You borrow money, you pay interest, and you make a monthly payment. An equity agreement has no interest rate and no monthly payment; instead the investor participates in your home's value when the agreement ends. The trade-off is that a rising home value costs you more under an agreement than a fixed-rate loan would have.",
  },
  {
    q: "Do I need good credit?",
    a: "Credit matters less than it does for a loan, because qualification rests principally on the property and your equity position rather than on monthly repayment capacity. Requirements still vary by provider and by state, and not everyone qualifies. Checking does not affect your credit score.",
  },
  {
    q: "How much of my equity can I access?",
    a: "It depends on your property's value, what you owe, your location, and the provider. Most providers require you to retain a meaningful equity cushion, so this is not a route to accessing everything you have. You will see the specific figure before you commit to anything.",
  },
  {
    q: "How quickly can I get the money?",
    a: "Funding can happen in as quickly as three days for qualified applicants whose approval, property, title, and valuation are already clear. That is a best case rather than a typical one — most take longer, and some applicants do not qualify at all.",
  },
  {
    q: "What happens if my home loses value?",
    a: "That depends on the agreement, and it is one of the most important questions to ask. Some providers share downside as well as upside; others apply a floor that protects their position. Read the settlement terms carefully, and ask specifically what happens in a falling market before you sign.",
  },
  {
    q: "What do I owe at the end?",
    a: "The agreed share of your home's value at settlement, paid in a single amount. That is the central thing to understand: there is no monthly payment, but there is a lump sum due when the agreement ends, and you need a realistic plan for it — usually selling, refinancing, or settling from other funds.",
  },
  {
    q: "Is Equity Direct a lender?",
    a: "No. We are a marketing and referral service. We do not make credit decisions, we do not lend, and we do not provide financial, tax, or legal advice. We connect homeowners with providers and professional partners, and we are compensated for that referral.",
  },
] as const;
