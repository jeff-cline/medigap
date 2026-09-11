import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE, SEO_PAGES, HOME_FAQS } from '@/lib/mammo'
import FaqBlock from '@/components/mammo/FaqBlock'
import { MammoHeader, MammoFooter } from '@/components/mammo/Chrome'
import VisitorId from '@/components/mammo/VisitorId'

export const metadata: Metadata = {
  title: 'Answers — Mammo Express',
  description: 'Clear, sourced answers about screening mammography: referrals, cost, frequency, preparation and breast density.',
  alternates: { canonical: `${SITE}/answers` },
}

export default function Answers() {
  return (
    <>
      <VisitorId />
      <MammoHeader />
      <main className="bg-[#FFFFFF] text-[#2E1065]">
        <div className="max-w-4xl mx-auto px-4 py-14 md:py-20">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-5">Answers</h1>
          <p className="text-xl text-[#2E1065]/70 mb-12 max-w-2xl">
            Everything here is sourced from the FDA, CDC, National Cancer Institute or the USPSTF,
            with the link so you can check it yourself.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {SEO_PAGES.map((p) => (
              <Link key={p.slug} href={`/answers/${p.slug}`}
                className="rounded-3xl border-2 border-[#2E1065]/12 hover:border-[#7C3AED]/50 bg-white p-7 transition-all hover:shadow-md">
                <h2 className="text-xl font-black leading-snug mb-3">{p.h1}</h2>
                <p className="text-sm text-[#2E1065]/65 leading-relaxed">{p.description}</p>
                <span className="inline-block mt-4 font-black text-[#7C3AED] text-sm">Read →</span>
              </Link>
            ))}
          </div>

          <div className="mt-16 pt-14 border-t border-[#2E1065]/10 max-w-3xl">
            <FaqBlock faqs={HOME_FAQS} title="The questions everyone asks first" />
          </div>

          <nav className="mt-14 pt-10 border-t border-[#2E1065]/10 max-w-3xl">
            <h2 className="text-xl font-black mb-5">Ready to book?</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/locations" className="rounded-2xl border-2 border-[#2E1065]/12 hover:border-[#7C3AED]/50 bg-white p-5 transition-colors"><span className="font-black">Find a location</span></Link>
              <Link href="/prepare" className="rounded-2xl border-2 border-[#2E1065]/12 hover:border-[#7C3AED]/50 bg-white p-5 transition-colors"><span className="font-black">How to prepare</span></Link>
              <Link href="/faq" className="rounded-2xl border-2 border-[#2E1065]/12 hover:border-[#7C3AED]/50 bg-white p-5 transition-colors"><span className="font-black">Full FAQ</span></Link>
            </div>
          </nav>
        </div>
      </main>
      <MammoFooter />
    </>
  )
}
