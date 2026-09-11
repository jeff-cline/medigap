import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE, PREP_STEPS, PREPARE_FAQS, SEO_PAGES } from '@/lib/mammo'
import FaqBlock from '@/components/mammo/FaqBlock'
import { MammoHeader, MammoFooter } from '@/components/mammo/Chrome'
import VisitorId from '@/components/mammo/VisitorId'

export const metadata: Metadata = {
  title: 'How to Prepare for Your Mammogram — Mammo Express',
  description: 'No deodorant, time it after your period, wear two pieces, bring your prior images. Practical preparation drawn from CDC, FDA and NCI guidance. Printable checklist included.',
  alternates: { canonical: `${SITE}/prepare` },
}

export default function Prepare() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to prepare for a mammogram',
    description: 'Practical preparation for a screening mammogram, drawn from CDC, FDA and National Cancer Institute guidance.',
    step: PREP_STEPS.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title, text: s.body })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <VisitorId />
      <MammoHeader />
      <main className="bg-[#FFFFFF] text-[#2E1065]">
        <div className="max-w-3xl mx-auto px-4 py-14 md:py-20">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-5">Getting ready</h1>
          <p className="text-xl text-[#2E1065]/75 leading-relaxed mb-4">
            Two minutes of preparation makes the appointment quicker and a good deal more comfortable.
            Everything here comes from the CDC, FDA and National Cancer Institute — with the links.
          </p>
          <div className="flex flex-wrap gap-3 mb-12">
            <a href="/prepare/checklist.pdf"
              className="inline-flex rounded-2xl bg-[#2E1065] hover:bg-[#7C3AED] text-white font-black px-6 py-3.5 transition-colors">
              Print the checklist (PDF) ↓
            </a>
            <Link href="/schedule"
              className="inline-flex rounded-2xl border-2 border-[#2E1065]/20 hover:border-[#2E1065] font-black px-6 py-3.5 transition-colors">
              Pick a time
            </Link>
          </div>

          <ol className="space-y-8">
            {PREP_STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-5">
                <span className="w-11 h-11 rounded-2xl bg-[#7C3AED] text-white grid place-items-center font-black shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-black leading-snug mb-2">{s.title}</h2>
                  <p className="text-[#2E1065]/80 leading-relaxed mb-2">{s.body}</p>
                  <a href={s.source.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-bold text-[#2E1065]/45 hover:text-[#7C3AED] underline">
                    {s.source.label} ↗
                  </a>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-14 rounded-3xl bg-white border-2 border-[#7C3AED]/35 p-7">
            <h2 className="font-black text-lg mb-3">If you have noticed a change</h2>
            <p className="text-[#2E1065]/80 leading-relaxed">
              A lump, pain, discharge, or a change in the skin or nipple means you need a{' '}
              <strong>diagnostic</strong> mammogram rather than a screening one — and that does need a
              clinician’s order. Please contact a clinician. It is not a reason to panic, and it is a
              reason not to wait.
            </p>
          </div>

          <div className="mt-8 rounded-3xl border-2 border-[#6D28D9]/25 p-7">
            <h2 className="font-black text-lg mb-3">After: your results letter</h2>
            <p className="text-[#2E1065]/80 leading-relaxed mb-3">
              The facility sends your results directly to you in plain language — that is a federal
              requirement, not a courtesy. Since 10 September 2024 the letter must also tell you
              whether your breasts are dense.
            </p>
            <Link href="/answers/dense-breasts-what-it-means" className="font-bold text-[#6D28D9] underline">
              What dense breasts actually mean →
            </Link>
          </div>

          <div className="mt-16 pt-14 border-t border-[#2E1065]/10">
            <FaqBlock faqs={PREPARE_FAQS} title="Questions about the appointment" />
          </div>

          <nav className="mt-14 pt-10 border-t border-[#2E1065]/10">
            <h2 className="text-xl font-black mb-5">Read next</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link href="/locations" className="rounded-2xl border-2 border-[#7C3AED]/30 hover:border-[#7C3AED]/50 bg-white p-5 transition-colors">
                <span className="font-black">Find a location and book</span>
              </Link>
              {SEO_PAGES.filter((p) => ['how-to-prepare-for-a-mammogram', 'dense-breasts-what-it-means', 'walk-in-mammogram-near-me'].includes(p.slug)).slice(0, 3).map((p) => (
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
