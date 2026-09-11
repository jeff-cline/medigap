import { SITE, SEO_PAGES } from '@/lib/mammo'

export const dynamic = 'force-dynamic'
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

export async function GET() {
  const now = new Date().toISOString()
  const urls: [string, string, string][] = [
    [SITE, 'weekly', '1.0'],
    [`${SITE}/locations`, 'daily', '0.9'],
    [`${SITE}/how-it-works`, 'monthly', '0.8'],
    [`${SITE}/prepare`, 'monthly', '0.9'],
    [`${SITE}/faq`, 'monthly', '0.9'],
    [`${SITE}/answers`, 'weekly', '0.8'],
    [`${SITE}/sitemap`, 'monthly', '0.4'],
    [`${SITE}/signup`, 'monthly', '0.7'],
    ...SEO_PAGES.map((p) => [`${SITE}/answers/${p.slug}`, 'monthly', '0.8'] as [string, string, string]),
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([loc, f, p]) => `  <url>
    <loc>${esc(loc)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${f}</changefreq>
    <priority>${p}</priority>
  </url>`).join('\n')}
</urlset>
`
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=1800' } })
}
