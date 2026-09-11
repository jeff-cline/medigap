import { SITE } from '@/lib/mammo'
export const dynamic = 'force-dynamic'
export async function GET() {
  return new Response(`User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /admin
Disallow: /schedule
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
Sitemap: ${SITE}/sitemap.txt
Host: ${SITE}
`, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
