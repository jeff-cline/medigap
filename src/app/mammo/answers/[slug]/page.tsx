import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SITE, SEO_PAGES, findSeoPage, relatedPages, MEDICAL_DISCLAIMER } from '@/lib/mammo'
import FaqBlock from '@/components/mammo/FaqBlock'
import { MammoHeader, MammoFooter } from '@/components/mammo/Chrome'
import VisitorId from '@/components/mammo/VisitorId'

export function generateStaticParams() {
  return SEO_PAGES.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = findSeoPage(slug)
  if (!p) return {}
  return {
    title: `${p.title} — Mammo Express`,
    description: p.description,
    alternates: { canonical: `${SITE}/answers/${p.slug}` },
    openGraph: { title: p.title, description: p.description, url: `${SITE}/answers/${p.slug}`, type: 'article' },
  }
}

export default async function AnswerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = findSeoPage(slug)
  if (!p) notFound()

  const others = relatedPages(p)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article', '@id': `${SITE}/answers/${p.slug}`,
        headline: p.h1, description: p.description,
        articleSection: 'Health', isAccessibleForFree: true,
        publisher: { '@type': 'Organization', name: 'Mammo Express', url: SITE },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/answers/${p.slug}` },
      },
      ...(p.faqs.length
        ? [{
            '@type': 'FAQPage',
            '@id': `${SITE}/answers/${p.slug}#faq`,
            mainEntity: p.faqs.map((f) => ({
              '@type': 'Question', name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }]
        : []),
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Answers', item: `${SITE}/answers` },
          { '@type': 'ListItem', position: 2, name: p.h1, item: `${SITE}/answers/${p.slug}` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <VisitorId />
      <MammoHeader />
      <main className="bg-[#FFFFFF] text-[#2E1065]">
        <article className="max-w-3xl mx-auto px-4 py-14 md:py-20">
          <nav className="text-sm text-[#2E1065]/50 mb-6">
            <Link href="/answers" className="hover:text-[#7C3AED] font-bold">Answers</Link>
          </nav>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-6">{p.h1}</h1>
          <p className="text-xl text-[#2E1065]/80 leading-relaxed mb-12 font-medium">{p.intro}</p>

          {p.body.map((b) => (
            <section key={b.heading} className="mb-9">
              <h2 className="text-2xl font-black mb-3 leading-snug">{b.heading}</h2>
              <p className="text-[#2E1065]/80 leading-relaxed text-lg">{b.text}</p>
            </section>
          ))}

          {p.faqs.length > 0 && (
            <div className="mt-14 pt-12 border-t border-[#2E1065]/10">
              <FaqBlock faqs={p.faqs} title="Questions about this" schema={false} id="faq" />
            </div>
          )}

          <div className="rounded-3xl bg-[#2E1065] text-white p-8 my-12 text-center">
            <h2 className="text-2xl font-black mb-3">Book it yourself</h2>
            <p className="text-white/70 mb-6">Pick a location, pick a time. About a minute to set up.</p>
            <Link href="/signup"
              className="inline-flex rounded-2xl bg-[#7C3AED] hover:bg-white hover:text-[#2E1065] text-white font-black px-8 py-4 transition-colors">
              Create an account to get started →
            </Link>
          </div>

          <p className="text-xs text-[#2E1065]/55 leading-relaxed rounded-2xl bg-white border-2 border-[#7C3AED]/35 p-5">{MEDICAL_DISCLAIMER}</p>

          {others.length > 0 && (
            <section className="mt-12 pt-10 border-t border-[#2E1065]/10">
              <h2 className="text-xl font-black mb-5">Related</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {others.map((o) => (
                  <Link key={o.slug} href={`/answers/${o.slug}`}
                    className="rounded-2xl border-2 border-[#7C3AED]/30 hover:border-[#7C3AED]/50 bg-white p-5 transition-colors">
                    <span className="block font-black text-sm leading-snug mb-1.5">{o.h1}</span>
                    <span className="block text-xs text-[#2E1065]/60 line-clamp-3">{o.description}</span>
                  </Link>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <Link href="/answers" className="font-bold text-[#6D28D9] hover:underline">All answers</Link>
                <Link href="/faq" className="font-bold text-[#6D28D9] hover:underline">Full FAQ</Link>
                <Link href="/locations" className="font-bold text-[#6D28D9] hover:underline">Find a location</Link>
                <Link href="/prepare" className="font-bold text-[#6D28D9] hover:underline">How to prepare</Link>
              </div>
            </section>
          )}
        </article>
      </main>
      <MammoFooter />
    </>
  )
}
