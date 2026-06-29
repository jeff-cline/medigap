import Link from "next/link";
import { MEDIGAP } from "@/lib/medigap-brand";
import type { SiloPage } from "@/lib/silos";

type Crumb = { name: string; url: string };
type LinkItem = { href: string; label: string; sub?: string };

function jsonLd(page: SiloPage, path: string, crumbs: Crumb[]) {
  const url = `${MEDIGAP.url}/${path}`;
  const article = {
    "@context": "https://schema.org", "@type": "Article",
    headline: page.h1, description: page.metaDescription, about: page.h1,
    author: { "@type": "Organization", name: MEDIGAP.brand, url: MEDIGAP.url },
    publisher: { "@type": "Organization", name: MEDIGAP.brand, url: MEDIGAP.url, telephone: "+1-800-633-4427" },
    mainEntityOfPage: url,
  };
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: page.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
  };
  const service = {
    "@context": "https://schema.org", "@type": "InsuranceAgency", name: MEDIGAP.brand, url: MEDIGAP.url,
    telephone: "+1-800-633-4427", areaServed: "US", slogan: MEDIGAP.tagline,
  };
  return JSON.stringify([article, faq, breadcrumb, service]);
}

export default function SiloArticle({ page, path, crumbs, links, linksTitle, image }: {
  page: SiloPage; path: string; crumbs: Crumb[]; links: LinkItem[]; linksTitle: string;
  image?: { url: string; alt: string; credit?: string };
}) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(page, path, crumbs) }} />

      {/* breadcrumbs */}
      <nav className="mx-auto max-w-3xl px-5 pt-6 text-xs text-[var(--muted)]">
        {crumbs.map((c, i) => (
          <span key={c.url}>{i > 0 && <span className="mx-1.5">/</span>}
            {i < crumbs.length - 1 ? <Link href={c.url.replace(MEDIGAP.url, "") || "/"} className="hover:text-[var(--brand)]">{c.name}</Link> : <span className="text-[var(--text)]">{c.name}</span>}
          </span>
        ))}
      </nav>

      {/* hero */}
      <section className="mx-auto max-w-3xl px-5 pt-4 pb-2">
        <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.08] tracking-tight">{page.h1}</h1>
        {page.heroSubhead && <p className="mt-4 text-lg text-[var(--muted)]">{page.heroSubhead}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={`tel:${MEDIGAP.tel}`} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white" style={{ background: MEDIGAP.colors.brand }}>📞 Call {MEDIGAP.telDisplay} — Free</a>
          <span className="inline-flex items-center text-xs text-[var(--muted)]">{MEDIGAP.tagline}</span>
        </div>
      </section>

      {/* hero image — placed next to the H1; ADA-compliant descriptive alt with the keyword + brand */}
      {image && (
        <figure className="mx-auto max-w-3xl px-5 mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.alt} width={1200} height={627} loading="eager" decoding="async" fetchPriority="high" className="w-full rounded-2xl border border-[var(--border)] object-cover aspect-[1200/627]" />
          {image.credit && <figcaption className="text-[10px] text-[var(--muted)] mt-1 text-right">Photo: {image.credit} / Pexels</figcaption>}
        </figure>
      )}

      {/* AEO quick answer — engineered to be quoted by answer engines */}
      <section className="mx-auto max-w-3xl px-5 mt-4">
        <div className="rounded-xl border-l-4 p-5 bg-[var(--panel)]" style={{ borderColor: MEDIGAP.colors.brand }}>
          <div className="text-[10px] uppercase tracking-wide font-bold mb-1" style={{ color: MEDIGAP.colors.brand }}>Quick answer</div>
          <p className="text-[17px] leading-relaxed">{page.quickAnswer}</p>
        </div>
      </section>

      {/* body */}
      <article className="mx-auto max-w-3xl px-5 mt-8">
        <p className="text-lg text-[var(--muted)] leading-relaxed">{page.intro}</p>
        {page.sections.map((s, i) => (
          <div key={i} className="mt-8">
            <h2 className="text-2xl font-bold tracking-tight">{s.h2}</h2>
            <p className="mt-3 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </article>

      {/* interlinks — the silo */}
      {links.length > 0 && (
        <section className="mx-auto max-w-3xl px-5 mt-10">
          <h2 className="text-xl font-bold mb-3">{linksTitle}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg border border-[var(--border)] px-4 py-2.5 hover:border-[var(--brand)] transition">
                <span className="font-medium text-[var(--text)]">{l.label}</span>
                {l.sub && <span className="block text-xs text-[var(--muted)]">{l.sub}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQ (mirrors FAQPage JSON-LD) */}
      {page.faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-5 mt-10">
          <h2 className="text-2xl font-bold mb-4">Frequently asked questions</h2>
          <div className="space-y-2">
            {page.faqs.map((f, i) => (
              <details key={i} className="rounded-lg border border-[var(--border)] p-4 group bg-white">
                <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">{f.q}<span className="text-[var(--muted)] group-open:rotate-45 transition">+</span></summary>
                <p className="mt-3 text-[var(--muted)] leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* CTA band */}
      <section className="mx-auto max-w-3xl px-5 mt-12">
        <div className="rounded-2xl p-8 text-center text-white" style={{ background: `linear-gradient(135deg, ${MEDIGAP.colors.brand}, ${MEDIGAP.colors.ink})` }}>
          <h2 className="text-2xl md:text-3xl font-extrabold">Talk to a licensed specialist — free.</h2>
          <p className="mt-2 text-white/80">{MEDIGAP.tagline}. One call answers it all, at no cost and no obligation.</p>
          <a href={`tel:${MEDIGAP.tel}`} className="inline-flex items-center gap-2 rounded-full px-6 py-3 mt-5 text-base font-bold" style={{ background: MEDIGAP.colors.gold, color: MEDIGAP.colors.ink }}>📞 Call {MEDIGAP.brand}</a>
        </div>
      </section>
    </>
  );
}
