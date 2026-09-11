import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE, FAQS } from '@/lib/mammo'
import FaqBlock from '@/components/mammo/FaqBlock'
import { MammoHeader, MammoFooter } from '@/components/mammo/Chrome'
import VisitorId from '@/components/mammo/VisitorId'

export const metadata: Metadata = {
  title: 'Questions and Answers — Mammo Express',
  description: 'Do you need a referral? What does it cost? Does it hurt? How often should you go? Straight answers, sourced from the FDA, CDC, NCI and USPSTF.',
  alternates: { canonical: `${SITE}/faq` },
}

export default function Faq() {
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage', '@id': `${SITE}/faq`,
    mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <VisitorId />
      <MammoHeader />
      <main className="bg-[#FFFFFF] text-[#2E1065]">
        <div className="max-w-3xl mx-auto px-4 py-14 md:py-20">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-5">Questions</h1>
          <p className="text-xl text-[#2E1065]/70 mb-12">
            The ones people actually ask, answered plainly. Where it is a medical question we cite the
            source so you can check us.
          </p>
          {/* schema={false}: the page already emits one FAQPage above, and two
              on one URL is worse than none. */}
          <FaqBlock faqs={FAQS} title="" schema={false} />
          <div className="mt-14 rounded-3xl bg-[#2E1065] text-white p-8 text-center">
            <h2 className="text-2xl font-black mb-3">Ready when you are</h2>
            <p className="text-white/70 mb-6">Create an account, pick a location, pick a time.</p>
            <Link href="/signup"
              className="inline-flex rounded-2xl bg-[#7C3AED] hover:bg-white hover:text-[#2E1065] text-white font-black px-8 py-4 transition-colors">
              Create an account to get started →
            </Link>
          </div>
        </div>
      </main>
      <MammoFooter />
    </>
  )
}
