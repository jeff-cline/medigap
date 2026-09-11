import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE, MEDICAL_DISCLAIMER, HOW_IT_WORKS_FAQS, SEO_PAGES } from '@/lib/mammo'
import FaqBlock from '@/components/mammo/FaqBlock'
import { MammoHeader, MammoFooter } from '@/components/mammo/Chrome'
import VisitorId from '@/components/mammo/VisitorId'

export const metadata: Metadata = {
  title: 'How Mammo Express Works',
  description: 'Create an account, pick a location near you, pick a time on their calendar. We remember where you went and remind you when you are due again.',
  alternates: { canonical: `${SITE}/how-it-works` },
}

const STEPS = [
  { n: '01', t: 'Create your account', d: 'Name, email, ZIP code. About a minute. This is what lets us hold your reminder and tell the location you are coming.' },
  { n: '02', t: 'Pick your location', d: 'See every screening location near you on a map, with the address, the phone number, and whether that state needs a written order. You choose — we never assign you one.' },
  { n: '03', t: 'Pick your time', d: 'We hand you straight to that location’s own booking calendar. You pick the slot that fits your week, not the one left over.' },
  { n: '04', t: 'Go', d: 'Skip deodorant that morning, wear two pieces, bring your prior images if you have them. The imaging takes minutes.' },
  { n: '05', t: 'Get your results', d: 'The facility sends them directly to you in plain language, including your breast density. We never see them.' },
  { n: '06', t: 'We remind you next time', d: 'A year later — or two, your choice — we nudge you. That is the part almost everyone forgets, and it is the part that makes screening work.' },
]

export default function HowItWorks() {
  return (
    <>
      <VisitorId />
      <MammoHeader />
      <main className="bg-[#FFFFFF] text-[#2E1065]">
        <div className="max-w-3xl mx-auto px-4 py-14 md:py-20">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-5">How it works</h1>
          <p className="text-xl text-[#2E1065]/75 mb-14 leading-relaxed">
            Six steps, and you only do the first three. This is precision medicine doing the
            unglamorous thing well: the right screening, at the right interval, at a time that
            actually works for you.
          </p>
          <ol className="space-y-10 mb-14">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-6">
                <span className="text-4xl font-black text-[#7C3AED]/25 tabular-nums shrink-0 leading-none">{s.n}</span>
                <div>
                  <h2 className="text-xl font-black mb-2">{s.t}</h2>
                  <p className="text-[#2E1065]/75 leading-relaxed">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="rounded-3xl bg-white border-2 border-[#7C3AED]/35 p-7 mb-10">
            <h2 className="font-black mb-3">What we are, and what we are not</h2>
            <p className="text-sm text-[#2E1065]/80 leading-relaxed">{MEDICAL_DISCLAIMER}</p>
          </div>
          <Link href="/signup"
            className="inline-flex rounded-2xl bg-[#7C3AED] hover:bg-[#5B21B6] text-white font-black px-9 py-5 text-lg transition-colors">
            Create an account to get started →
          </Link>

          <div className="mt-16 pt-14 border-t border-[#2E1065]/10">
            <FaqBlock faqs={HOW_IT_WORKS_FAQS} title="Questions about the process" />
          </div>

          <nav className="mt-14 pt-10 border-t border-[#2E1065]/10">
            <h2 className="text-xl font-black mb-5">Read next</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link href="/locations" className="rounded-2xl border-2 border-[#7C3AED]/30 hover:border-[#7C3AED]/50 bg-white p-5 transition-colors">
                <span className="font-black">Find a location near you</span>
              </Link>
              <Link href="/prepare" className="rounded-2xl border-2 border-[#7C3AED]/30 hover:border-[#7C3AED]/50 bg-white p-5 transition-colors">
                <span className="font-black">How to prepare</span>
              </Link>
              {SEO_PAGES.slice(0, 2).map((p) => (
                <Link key={p.slug} href={`/answers/${p.slug}`}
                  className="rounded-2xl border-2 border-[#7C3AED]/30 hover:border-[#7C3AED]/50 bg-white p-5 transition-colors">
                  <span className="font-black">{p.h1}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </main>
      <MammoFooter />
    </>
  )
}
