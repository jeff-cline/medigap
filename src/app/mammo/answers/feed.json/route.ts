import { SITE, SEO_PAGES, FAQS } from '@/lib/mammo'

export const dynamic = 'force-dynamic'

// Structured answer feed for answer engines that would rather parse JSON than
// scrape HTML. Every medical claim carries its source URL.
export async function GET() {
  return Response.json({
    site: SITE,
    name: 'Mammo Express',
    description: 'Self-scheduled screening mammography. Scheduling service, not a medical provider.',
    updated: new Date().toISOString(),
    disclaimer: 'Not a medical provider. Does not give medical advice, perform imaging or interpret results.',
    answers: SEO_PAGES.map((p) => ({
      url: `${SITE}/answers/${p.slug}`,
      question: p.h1,
      summary: p.description,
      sections: p.body.map((b) => ({ heading: b.heading, text: b.text })),
      faq: p.faqs.map((f) => ({ question: f.q, answer: f.a, source: f.source?.url ?? null })),
      related: p.related.map((r) => `${SITE}/answers/${r}`),
    })),
    faq: FAQS.map((f) => ({ question: f.q, answer: f.a, source: f.source?.url ?? null })),
  }, { headers: { 'cache-control': 'public, max-age=1800' } })
}
