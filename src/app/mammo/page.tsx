import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { SITE, HOME_FAQS, GUIDELINES, SEO_PAGES } from '@/lib/mammo'
import FaqBlock from '@/components/mammo/FaqBlock'
import { MammoHeader, MammoFooter } from '@/components/mammo/Chrome'
import VisitorId from '@/components/mammo/VisitorId'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mammo Express — Book Your Mammogram Yourself. No Referral Needed.',
  description:
    'Schedule a screening mammogram without a doctor’s referral appointment and without a copay just to be told yes. Pick a location, pick a time, walk in and walk out.',
  alternates: { canonical: SITE },
  openGraph: {
    title: 'Book your mammogram yourself — Mammo Express',
    description: 'No referral appointment. No copay to get permission. Pick a time and go.',
    url: SITE, siteName: 'Mammo Express', type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Mammo Express' },
}

export default async function MammoHome() {
  const locationCount = await db.mammoLocation.count({ where: { active: true } }).catch(() => 0)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite', '@id': `${SITE}#website`, url: SITE, name: 'Mammo Express',
        description: 'Self-scheduled screening mammography. No referral appointment required in most states.',
      },
      {
        '@type': 'Organization', '@id': `${SITE}#org`, name: 'Mammo Express', url: SITE,
        description: 'A scheduling service connecting people directly to FDA-certified mammography facilities.',
      },
      {
        '@type': 'FAQPage', '@id': `${SITE}#faq`,
        mainEntity: HOME_FAQS.map((f) => ({
          '@type': 'Question', name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <VisitorId />
      <MammoHeader />
      <main className="bg-[#FFFFFF] text-[#2E1065]">

        {/* ---------------- hero ---------------- */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(120% 80% at 85% 0%, rgba(124,58,237,0.26) 0%, rgba(255,255,255,0) 60%), radial-gradient(90% 70% at 0% 100%, rgba(167,139,250,0.22) 0%, rgba(255,255,255,0) 60%)' }} />
          <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28 grid lg:grid-cols-[1.15fr_1fr] gap-14 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#5B21B6] bg-white border border-[#7C3AED]/25 rounded-full px-4 py-2 mb-7">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                No referral appointment · No copay to get permission
              </span>
              <h1 className="text-[2.6rem] sm:text-6xl lg:text-[4.2rem] font-black tracking-[-0.03em] leading-[0.98] mb-6">
                Book your mammogram
                <span className="block text-[#7C3AED]">yourself.</span>
              </h1>
              <p className="text-xl sm:text-2xl text-[#2E1065]/75 leading-relaxed mb-4 max-w-xl">
                You do not need permission to look after yourself in most states. With Mammo Express,
                you can schedule a screening — no referral visit, no waiting weeks for a slot someone
                else booked for you.
              </p>
              <p className="text-base text-[#2E1065]/60 mb-9 max-w-xl">
                Pick a location. Pick a time on their calendar. Walk in, walk out — the imaging itself
                takes minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/signup"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-2xl bg-[#7C3AED] hover:bg-[#5B21B6] text-white font-black px-7 sm:px-9 py-5 text-base sm:text-lg shadow-lg shadow-[#7C3AED]/25 hover:shadow-xl transition-all">
                  Create an account to get started →
                </Link>
                <Link href="/how-it-works"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-2xl border-2 border-[#2E1065]/20 hover:border-[#2E1065] text-[#2E1065] font-black px-8 py-5 text-base sm:text-lg transition-colors">
                  How it works
                </Link>
              </div>
              <p className="text-sm text-[#2E1065]/55">
                Free. Takes about a minute.{' '}
                {locationCount > 0
                  ? <>Currently <strong className="text-[#2E1065]">{locationCount}</strong> screening {locationCount === 1 ? 'location' : 'locations'}.</>
                  : <>Locations are being added now.</>}
              </p>
            </div>

            {/* the three-step card — the whole proposition in one glance */}
            <div className="relative">
              <div className="rounded-[2rem] bg-white border border-[#2E1065]/10 shadow-2xl shadow-[#2E1065]/10 p-8">
                <div className="text-xs font-black uppercase tracking-widest text-[#6D28D9] mb-6">
                  The whole process
                </div>
                <ol className="space-y-6">
                  {[
                    ['Create your account', 'Name, email, ZIP. About a minute.', '#7C3AED'],
                    ['Pick your location', 'See what is near you on the map, with addresses and phone numbers.', '#6D28D9'],
                    ['Pick your time', 'You go straight to that location’s own calendar and choose a slot.', '#5B21B6'],
                  ].map(([t, d, c], i) => (
                    <li key={t} className="flex gap-4">
                      <span className="w-9 h-9 rounded-xl grid place-items-center font-black text-white shrink-0 text-sm"
                        style={{ background: c }}>{i + 1}</span>
                      <span>
                        <span className="block font-black text-[15px] leading-tight">{t}</span>
                        <span className="block text-sm text-[#2E1065]/65 mt-1 leading-relaxed">{d}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="mt-7 pt-6 border-t border-[#2E1065]/10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-[#6D28D9] tabular-nums">~20</span>
                    <span className="text-sm font-bold text-[#2E1065]/60">minutes at the appointment</span>
                  </div>
                  <p className="text-xs text-[#2E1065]/50 mt-1.5">
                    The imaging is a few minutes. The waiting was never the exam.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- the feature: what we remove ---------------- */}
        <section className="py-24 md:py-32 bg-white border-y border-[#2E1065]/8">
          <div className="max-w-6xl mx-auto px-4">
            <p className="text-center text-sm font-black uppercase tracking-[0.2em] text-[#7C3AED] mb-5">
              Save hours, days, weeks
            </p>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] text-center mb-6 max-w-4xl mx-auto leading-[1.02]">
              We did not speed up the scan.<br />
              <span className="text-[#7C3AED]">We removed everything around it.</span>
            </h2>
            <p className="text-center text-xl md:text-2xl text-[#2E1065]/65 max-w-2xl mx-auto mb-16">
              The exam was always quick. What took months was getting permission to have it.
            </p>

            <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-4 items-center">
              {/* the usual way */}
              <div className="rounded-[2rem] bg-[#F3EEFF] border-2 border-[#2E1065]/8 p-8 md:p-10">
                <div className="text-sm font-black uppercase tracking-widest text-[#2E1065]/45 mb-2">The usual way</div>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl md:text-6xl font-black text-[#2E1065]/35 tabular-nums leading-none">6</span>
                  <span className="text-lg font-bold text-[#2E1065]/45">steps · weeks of waiting</span>
                </div>
                <ul className="space-y-5">
                  {[
                    'Call for an appointment with a clinician',
                    'Wait two to six weeks for that appointment',
                    'Pay a copay to be told yes',
                    'Wait for the referral to be sent',
                    'Call the imaging centre',
                    'Wait again for a slot',
                  ].map((s) => (
                    <li key={s} className="flex gap-4 text-lg md:text-xl text-[#2E1065]/65 leading-snug">
                      <span className="text-[#2E1065]/25 font-black shrink-0 text-2xl leading-none">✕</span>{s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* the pivot */}
              <div className="hidden lg:flex flex-col items-center justify-center px-2">
                <div className="w-14 h-14 rounded-full bg-[#7C3AED] text-white grid place-items-center text-2xl font-black shadow-lg shadow-[#7C3AED]/30">
                  →
                </div>
              </div>

              {/* with Mammo Express */}
              <div className="rounded-[2rem] bg-[#2E1065] text-white p-8 md:p-10 shadow-2xl shadow-[#2E1065]/25 relative overflow-hidden">
                <div aria-hidden className="pointer-events-none absolute inset-0"
                  style={{ background: 'radial-gradient(80% 60% at 100% 0%, rgba(124,58,237,0.55) 0%, rgba(46,16,101,0) 65%)' }} />
                <div className="relative">
                  <div className="text-sm font-black uppercase tracking-widest text-[#C4B5FD] mb-2">With Mammo Express</div>
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-5xl md:text-6xl font-black text-white tabular-nums leading-none">3</span>
                    <span className="text-lg font-bold text-white/60">steps · about a minute</span>
                  </div>
                  <ul className="space-y-5">
                    {[
                      'Create an account',
                      'Pick a location near you',
                      'Pick a time on their calendar',
                    ].map((s) => (
                      <li key={s} className="flex gap-4 text-lg md:text-xl font-semibold leading-snug">
                        <span className="text-[#C4B5FD] font-black shrink-0 text-2xl leading-none">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 pt-7 border-t border-white/15">
                    <p className="text-base text-white/70 leading-relaxed mb-6">
                      This is precision medicine doing what it should — on time, on demand, and built
                      around your day rather than a referral queue.
                    </p>
                    <Link href="/signup"
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-2xl bg-[#7C3AED] hover:bg-white hover:text-[#2E1065] text-white font-black px-7 py-4 text-lg transition-colors">
                      Start now — it takes a minute →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- the question everyone asks, collapsible ---------------- */}
        <section className="py-20 md:py-28 bg-[#F3EEFF]">
          <div className="max-w-3xl mx-auto px-4">
            <p className="text-center text-sm font-black uppercase tracking-[0.2em] text-[#7C3AED] mb-4">
              The questions everyone asks first
            </p>
            <FaqBlock faqs={HOME_FAQS} title="Start here" schema={false} />
            <div className="mt-8 rounded-2xl bg-white border-2 border-[#7C3AED]/20 p-6">
              <p className="text-sm text-[#2E1065]/80 leading-relaxed">
                <strong className="text-[#2E1065]">One important distinction.</strong> This is for
                screening — routine, no symptoms. If you have found a lump, or have pain, discharge
                or a change in your skin, you need a <em>diagnostic</em> mammogram, and that does
                need a clinician’s order. Please contact one rather than booking a screening.
              </p>
            </div>
            <p className="text-center mt-8">
              <Link href="/faq" className="font-black text-[#6D28D9] hover:underline text-lg">
                All questions and answers →
              </Link>
            </p>
          </div>
        </section>

        {/* ---------------- how often ---------------- */}
        <section className="py-20 md:py-24 bg-white border-y border-[#2E1065]/8">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-center mb-4">How often should you go?</h2>
            <p className="text-center text-lg text-[#2E1065]/65 max-w-2xl mx-auto mb-12">
              Two respected bodies give two different answers. Both are credible, so here they both are.
            </p>
            <div className="grid md:grid-cols-2 gap-5">
              {GUIDELINES.map((g, i) => (
                <div key={g.body} className="rounded-3xl border-2 p-7"
                  style={{ borderColor: i === 0 ? 'rgba(109,40,217,0.35)' : 'rgba(124,58,237,0.35)' }}>
                  <div className="text-xs font-black uppercase tracking-widest mb-3"
                    style={{ color: i === 0 ? '#6D28D9' : '#5B21B6' }}>{g.body}</div>
                  <p className="text-xl font-black leading-snug mb-3">{g.advice}</p>
                  <p className="text-sm text-[#2E1065]/65 leading-relaxed mb-4">{g.note}</p>
                  <a href={g.source.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-bold underline text-[#2E1065]/50 hover:text-[#7C3AED]">
                    {g.source.label} ↗
                  </a>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-[#2E1065]/60 mt-8 max-w-2xl mx-auto">
              Family history, a known gene variant, dense breasts or prior chest radiation can all
              change what is right for you. That is a conversation with a clinician — we will just make
              sure you can actually get an appointment when you decide to.
            </p>
          </div>
        </section>

        {/* ---------------- reminders ---------------- */}
        <section className="py-20 md:py-24">
          <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-xs font-black uppercase tracking-widest text-[#7C3AED] mb-4">
                The part people forget
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-5 leading-tight">
                We will remind you when you are due again.
              </h2>
              <p className="text-lg text-[#2E1065]/75 leading-relaxed mb-5">
                The hardest part of screening is not the first appointment. It is remembering the next
                one, a year or two later, when life is busy and nothing hurts.
              </p>
              <p className="text-base text-[#2E1065]/65 leading-relaxed mb-7">
                When you book through us we set a follow-up reminder for you. You choose the interval,
                you choose email or text, and you can turn it off in one click at any time.
              </p>
              <Link href="/signup"
                className="inline-flex rounded-2xl bg-[#2E1065] hover:bg-[#7C3AED] text-white font-black px-8 py-4 transition-colors">
                Set up my reminders
              </Link>
            </div>
            <div className="rounded-3xl bg-[#6D28D9] text-white p-8">
              <div className="text-xs font-black uppercase tracking-widest text-white/60 mb-5">Your consent, your rules</div>
              <ul className="space-y-4 text-[15px]">
                {[
                  'We never text you unless you explicitly tick the box',
                  'Reply STOP to any text and it stops immediately',
                  'Email reminders are separate and equally optional',
                  'We never sell or share your contact details',
                  'We never store anything about your health',
                ].map((s) => (
                  <li key={s} className="flex gap-3">
                    <span className="text-[#C4B5FD] font-black shrink-0">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---------------- answers ---------------- */}
        <section className="py-20 md:py-24 bg-white border-t border-[#2E1065]/8">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center mb-3">Straight answers</h2>
            <p className="text-center text-[#2E1065]/65 mb-12">Sourced from the FDA, CDC, NCI and USPSTF — with the links, so you can check.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {SEO_PAGES.map((p) => (
                <Link key={p.slug} href={`/answers/${p.slug}`}
                  className="rounded-2xl border border-[#2E1065]/12 bg-[#FFFFFF] hover:border-[#7C3AED]/50 hover:shadow-md p-6 transition-all">
                  <div className="font-black leading-snug mb-2">{p.h1}</div>
                  <p className="text-sm text-[#2E1065]/60 line-clamp-3">{p.description}</p>
                </Link>
              ))}
            </div>
            <div className="text-center">
              <Link href="/faq" className="font-black text-[#7C3AED] hover:underline text-lg">
                All questions and answers →
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------- final CTA ---------------- */}
        <section className="py-20 md:py-28 bg-[#2E1065] text-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-5 leading-tight">
              It takes a minute now.<br />It matters for years.
            </h2>
            <p className="text-lg text-white/70 mb-9 max-w-xl mx-auto">
              Create your account, pick a location near you, and choose a time that actually fits your
              week. That is the whole thing.
            </p>
            <Link href="/signup"
              className="inline-flex rounded-2xl bg-[#7C3AED] hover:bg-white hover:text-[#2E1065] text-white font-black px-10 py-5 text-lg transition-colors">
              Create an account to get started →
            </Link>
            <p className="text-sm text-white/45 mt-5">Free · No referral needed in most states · Cancel reminders any time</p>
          </div>
        </section>
      </main>
      <MammoFooter />
    </>
  )
}
