import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE, SEO_PAGES, FAQS, type Faq } from '@/lib/mammo'
import FaqBlock from '@/components/mammo/FaqBlock'
import { activeLocations, fullAddress } from '@/lib/mammo-locations'
import { MammoHeader, MammoFooter } from '@/components/mammo/Chrome'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Site Map — Mammo Express',
  description: 'Every page on Mammo Express in one place.',
  alternates: { canonical: `${SITE}/sitemap` },
}

const SITEMAP_FAQS: Faq[] = [
  { q: 'What is this page for?', a: 'It lists every page on Mammo Express in one place. Useful if you would rather scan a list than use the navigation, and useful to search engines and answer engines that prefer a plain index to crawling menus.' },
  { q: 'Is there a machine-readable version?', a: 'Yes — three. sitemap.xml for search engines, sitemap.txt as a plain URL list, and llms.txt plus answers/feed.json written specifically for answer engines, with the medical sources attached to each claim.' },
  { q: 'Where do I actually book?', a: 'Create an account, then pick a location and a time. The locations page shows everything near you on a map with addresses and phone numbers.' },
]

export default async function HtmlSitemap() {
  const locs = await activeLocations().catch(() => [])
  return (
    <>
      <MammoHeader />
      <main className="bg-[#FFFFFF] text-[#2E1065]">
        <div className="max-w-4xl mx-auto px-4 py-14 md:py-20">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-10">Site map</h1>
          <div className="grid sm:grid-cols-2 gap-10">
            <section>
              <h2 className="font-black text-lg mb-3">Booking</h2>
              <ul className="space-y-2 text-[#2E1065]/80">
                <li><Link href="/" className="hover:text-[#7C3AED] underline">Home</Link></li>
                <li><Link href="/how-it-works" className="hover:text-[#7C3AED] underline">How it works</Link></li>
                <li><Link href="/locations" className="hover:text-[#7C3AED] underline">Screening locations</Link></li>
                <li><Link href="/signup" className="hover:text-[#7C3AED] underline">Create an account</Link></li>
                <li><Link href="/login" className="hover:text-[#7C3AED] underline">Log in</Link></li>
              </ul>
            </section>
            <section>
              <h2 className="font-black text-lg mb-3">Preparing</h2>
              <ul className="space-y-2 text-[#2E1065]/80">
                <li><Link href="/prepare" className="hover:text-[#7C3AED] underline">How to prepare</Link></li>
                <li><a href="/prepare/checklist.pdf" className="hover:text-[#7C3AED] underline">Printable checklist (PDF)</a></li>
                <li><Link href="/faq" className="hover:text-[#7C3AED] underline">Questions and answers ({FAQS.length})</Link></li>
              </ul>
            </section>
            <section className="sm:col-span-2">
              <h2 className="font-black text-lg mb-3">Answers</h2>
              <ul className="grid sm:grid-cols-2 gap-2 text-[#2E1065]/80">
                {SEO_PAGES.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/answers/${p.slug}`} className="hover:text-[#7C3AED] underline">{p.h1}</Link>
                  </li>
                ))}
              </ul>
            </section>
            {locs.length > 0 && (
              <section className="sm:col-span-2">
                <h2 className="font-black text-lg mb-3">Locations</h2>
                <ul className="space-y-2 text-[#2E1065]/80 text-sm">
                  {locs.map((l) => <li key={l.id}><strong>{l.name}</strong> — {fullAddress(l)}</li>)}
                </ul>
              </section>
            )}
            <section className="sm:col-span-2">
              <h2 className="font-black text-lg mb-3">Machine-readable</h2>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#2E1065]/70">
                <li><a href="/sitemap.xml" className="hover:text-[#7C3AED] underline">sitemap.xml</a></li>
                <li><a href="/sitemap.txt" className="hover:text-[#7C3AED] underline">sitemap.txt</a></li>
                <li><a href="/llms.txt" className="hover:text-[#7C3AED] underline">llms.txt</a></li>
                <li><a href="/answers/feed.json" className="hover:text-[#7C3AED] underline">answers/feed.json</a></li>
                <li><a href="/robots.txt" className="hover:text-[#7C3AED] underline">robots.txt</a></li>
              </ul>
            </section>
          </div>

          <div className="mt-16 pt-14 border-t border-[#2E1065]/10 max-w-3xl">
            <FaqBlock faqs={SITEMAP_FAQS} title="About this page" />
          </div>
        </div>
      </main>
      <MammoFooter />
    </>
  )
}
