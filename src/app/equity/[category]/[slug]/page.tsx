import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { USES, bySlug, relatedTo, categoryOf, pathFor, type CategoryKey } from "@/lib/equity";
import QualifyForm from "../../QualifyForm";

// One of the 100 keyword pages. Fully static: generateStaticParams enumerates
// every slug at build time, so each page is prerendered HTML that a crawler
// gets in one request with no JavaScript required to read it.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return USES.map((u) => ({ category: u.category, slug: u.slug }));
}

type Params = { params: Promise<{ category: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category, slug } = await params;
  const u = bySlug(slug);
  if (!u || u.category !== category) return { title: "Not found", robots: { index: false } };

  const url = `https://equity.direct${pathFor(u)}`;
  return {
    title: u.title,
    description: u.description,
    alternates: { canonical: url },
    openGraph: {
      title: u.title,
      description: u.description,
      url,
      type: "article",
      siteName: "Equity Direct",
    },
    twitter: { card: "summary_large_image", title: u.title, description: u.description },
  };
}

export default async function UsePage({ params }: Params) {
  const { category, slug } = await params;
  const u = bySlug(slug);
  if (!u || u.category !== category) notFound();

  const cat = categoryOf(u.category as CategoryKey);
  const related = relatedTo(u);

  // FAQPage structured data is what an answer engine reads to quote us
  // directly. It mirrors the visible FAQ exactly — marked-up content that is
  // not on the page is a manual action waiting to happen.
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: u.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://equity.direct/" },
      { "@type": "ListItem", position: 2, name: cat.label, item: `https://equity.direct/${cat.key}` },
      { "@type": "ListItem", position: 3, name: u.h1, item: `https://equity.direct${pathFor(u)}` },
    ],
  };

  return (
    <main>
      <script type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="eq-wrap">
        <nav className="eq-crumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>/</span>
          <Link href={`/${cat.key}`}>{cat.label}</Link><span>/</span>
          <span style={{ opacity: 0.85, margin: 0 }}>{u.reason}</span>
        </nav>
      </div>

      <div className="eq-wrap eq-article">
        <div className="eq-layout">
          <article>
            <h1 className="eq-h1" style={{ fontSize: "clamp(2rem,4.4vw,3rem)", marginTop: 12 }}>
              {u.h1}
            </h1>

            <div className="eq-prose" style={{ marginTop: 24 }}>
              <p style={{ fontSize: "1.14rem", color: "#c9d3e2" }}>{u.intro}</p>

              <h2>Why homeowners use equity for this</h2>
              <ul className="eq-why">
                {u.why.map((w) => (
                  <li key={w}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.6"
                            strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>

              {u.typicalRange && (
                <dl className="eq-range">
                  <dt>Typical cost</dt>
                  <dd>
                    {u.typicalRange}
                    <span className="eq-range-note">
                      A typical market range, not a quote. Costs vary considerably by
                      region, specification, and provider.
                    </span>
                  </dd>
                </dl>
              )}

              <h2>How an equity agreement differs from a loan</h2>
              <p>
                A home equity agreement is <strong>not a loan</strong>. There is no interest
                rate and no monthly payment. You receive a lump sum today, and in exchange
                the investor receives a share of your home&rsquo;s value when the agreement
                ends — usually when you sell, refinance, or reach the end of the term.
              </p>
              <p>
                That structure is what makes it suit {u.reason.toLowerCase()}: the money
                arrives when it is needed, and nothing is added to your monthly outgoings
                in the period before it starts paying off. It also means the agreement has
                to be settled in full at the end, and that the share you give up grows if
                your home does. Both facts deserve equal weight before you sign anything.
              </p>

              <h2>Who else is usually involved</h2>
              <p>
                Decisions like this are rarely made alone. {u.partner} are typically part of
                the conversation — {u.partnerWhy.charAt(0).toLowerCase() + u.partnerWhy.slice(1)}{" "}
                If you are already working with someone, we can work alongside them.
              </p>
            </div>

            <section className="eq-faq" aria-labelledby="faq-heading">
              <h2 id="faq-heading" className="eq-h2" style={{ fontSize: "1.7rem" }}>
                Questions people ask
              </h2>
              <div style={{ marginTop: 18 }}>
                {u.faqs.map((f) => (
                  <div className="eq-faq-item" key={f.q}>
                    <h3 className="eq-faq-q">{f.q}</h3>
                    <p className="eq-faq-a">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="eq-related" aria-labelledby="related-heading">
              <h2 id="related-heading" className="eq-h2" style={{ fontSize: "1.45rem" }}>
                Other reasons homeowners access equity
              </h2>
              <div className="eq-related-grid">
                {related.map((r) => (
                  <Link key={r.slug} href={pathFor(r)}>{r.h1.replace("Using Home Equity ", "")}</Link>
                ))}
              </div>
              <p style={{ marginTop: 16, fontSize: "0.9rem" }}>
                <Link href={`/${cat.key}`} style={{ color: "var(--gold)", fontWeight: 700 }}>
                  See all of {cat.label.toLowerCase()} →
                </Link>
              </p>
            </section>
          </article>

          <aside>
            <QualifyForm slug={u.slug} reason={u.reason} />
          </aside>
        </div>
      </div>
    </main>
  );
}
