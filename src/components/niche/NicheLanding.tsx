import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import PublicHeader from "@/components/PublicHeader";
import SiteFooter from "@/components/SiteFooter";
import { TrustBand, VerticalHero, FinalCta } from "@/components/PublicBlocks";
import { TOLLFREE, TOLLFREE_TEL } from "@/lib/format";
import { SITE_URL, type Niche } from "@/lib/niches";

// JSON-LD for SEO + AEO: FAQPage (answer engines + rich results) and a Service/Organization
// node so assistants understand who provides this and how to reach us (the phone number).
function structuredData(n: Niche) {
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: n.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: n.primaryKeyword,
    serviceType: n.primaryKeyword,
    areaServed: "US",
    description: n.metaDescription,
    provider: {
      "@type": "InsuranceAgency",
      name: "1-800-MEDIGAP",
      telephone: "+1-800-633-4427",
      url: `${SITE_URL}/insurance/${n.slug}`,
    },
    availableChannel: {
      "@type": "ServiceChannel",
      servicePhone: { "@type": "ContactPoint", telephone: "+1-800-633-4427", contactType: "sales" },
    },
  };
  return JSON.stringify([faqPage, service]);
}

export default function NicheLanding({ niche: n }: { niche: Niche }) {
  const isMedicare = n.vertical === "medicare";
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData(n) }} />
      <PublicHeader />

      <VerticalHero
        badge={n.primaryKeyword}
        title={n.h1}
        gradientTail=""
        subhead={n.heroSubhead}
        vertical={n.vertical}
        disclaimer={isMedicare}
        LeadForm={LeadForm}
      />

      {/* AEO quick-answer — the snippet built to be quoted verbatim by answer engines */}
      <section className="mx-auto max-w-4xl px-6 -mt-2">
        <div className="card p-6 border-l-4 border-[var(--brand)]">
          <div className="text-[10px] uppercase tracking-wide text-[var(--brand)] font-semibold mb-1">Quick answer</div>
          <p className="text-lg leading-relaxed">{n.quickAnswer}</p>
          <a href={`tel:${TOLLFREE_TEL}`} className="btn btn-brand mt-4 text-sm">📞 Call {TOLLFREE} — Free</a>
        </div>
      </section>

      <TrustBand />

      {/* trust points */}
      {n.trustPoints?.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {n.trustPoints.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <span className="text-[var(--brand)]">✓</span> {t}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* benefits */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h2 className="text-3xl font-bold text-center">Why call 1-800-MEDIGAP for {n.primaryKeyword}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {n.benefits.map((b, i) => (
            <div key={i} className="card p-6">
              <div className="text-3xl">{b.icon}</div>
              <div className="mt-2 font-semibold text-lg">{b.title}</div>
              <p className="text-sm text-[var(--muted)] mt-1">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* long-form SEO sections */}
      <section className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        {n.sections.map((s, i) => (
          <article key={i}>
            <h2 className="text-2xl font-bold">{s.h2}</h2>
            <p className="mt-3 text-[var(--muted)] leading-relaxed">{s.body}</p>
          </article>
        ))}
      </section>

      {/* FAQ (mirrors the FAQPage JSON-LD) */}
      <section className="mx-auto max-w-3xl px-6 py-10">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently asked questions</h2>
        <div className="space-y-3">
          {n.faqs.map((f, i) => (
            <details key={i} className="card p-5 group">
              <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">
                {f.q}<span className="text-[var(--muted)] group-open:rotate-45 transition">+</span>
              </summary>
              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* cross-links to the other niches (internal linking for SEO) */}
      <section className="mx-auto max-w-7xl px-6 py-6 text-center">
        <Link href="/insurance" className="text-sm text-[var(--muted)] hover:text-[var(--brand)] border-b border-dashed border-[var(--border)] pb-0.5">
          ← See all insurance we help with
        </Link>
      </section>

      <FinalCta title={n.ctaLine || `Get free ${n.primaryKeyword} help now`} body={`Call 1-800-MEDIGAP and a licensed US-based specialist will help you in minutes — free, no obligation.`} />

      <SiteFooter />
    </>
  );
}
