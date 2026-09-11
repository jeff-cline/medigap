import { SITE, SEO_PAGES } from '@/lib/mammo'
export const dynamic = 'force-dynamic'
export async function GET() {
  const urls = [SITE, `${SITE}/locations`, `${SITE}/how-it-works`, `${SITE}/prepare`,
    `${SITE}/faq`, `${SITE}/answers`, `${SITE}/sitemap`, `${SITE}/signup`,
    ...SEO_PAGES.map((p) => `${SITE}/answers/${p.slug}`)]
  return new Response(urls.join('\n') + '\n',
    { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=1800' } })
}
