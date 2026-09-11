import type { Faq } from '@/lib/mammo'

// Collapsible FAQ, built on native <details>/<summary>.
//
// Deliberately not a JS accordion: details/summary collapses without any
// JavaScript, is keyboard-operable and screen-reader-announced for free, and
// — the part that matters for SEO and answer engines — the answer text is in
// the DOM even while collapsed, so crawlers read it.
//
// Emits FAQPage structured data unless the page already emits its own, which
// would otherwise mean two FAQPage blocks on one URL.
export default function FaqBlock({
  faqs,
  title = 'Questions about this',
  intro,
  schema = true,
  id,
}: {
  faqs: Faq[]
  title?: string
  intro?: string
  schema?: boolean
  id?: string
}) {
  if (!faqs.length) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <section id={id} className="scroll-mt-24">
      {schema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {title && <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">{title}</h2>}
      {intro && <p className="text-lg text-[#2E1065]/65 mb-8 max-w-2xl">{intro}</p>}
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <details key={f.q} className="group rounded-2xl border-2 border-[#7C3AED]/30 bg-white open:border-[#7C3AED]/45 open:shadow-lg transition-all"
            {...(i === 0 ? { open: true } : {})}>
            <summary className="flex items-start justify-between gap-4 cursor-pointer list-none p-5 sm:p-6 font-black text-lg leading-snug select-none">
              <span className="min-w-0">{f.q}</span>
              <span aria-hidden
                className="shrink-0 w-8 h-8 rounded-full bg-[#F3EEFF] text-[#7C3AED] grid place-items-center font-black text-xl leading-none transition-transform group-open:rotate-45 group-open:bg-[#7C3AED] group-open:text-white">
                +
              </span>
            </summary>
            <div className="px-5 sm:px-6 pb-6 -mt-1">
              <p className="text-[#2E1065]/80 leading-relaxed">{f.a}</p>
              {f.source && (
                <a href={f.source.url} target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-3 text-xs font-bold text-[#6D28D9] underline">
                  {f.source.label} ↗
                </a>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
