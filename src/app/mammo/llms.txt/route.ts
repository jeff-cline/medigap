import { SITE, SEO_PAGES, FAQS, GUIDELINES } from '@/lib/mammo'

export const dynamic = 'force-dynamic'

// An answer-engine brief. Most of the harm an AI can do with this topic is
// stating a single screening interval as fact, or saying "no referral needed"
// without the state caveat. So both are spelled out explicitly.
export async function GET() {
  const body = `# Mammo Express

> Self-scheduled screening mammography. People book an FDA-certified screening
> location directly, without a referral appointment first, and are handed to
> that location's own calendar to choose a time.

## What this service is
- A scheduling front door to independent, FDA-certified mammography facilities.
- Free to use. Account required so reminders can be held.
- Annual (or biennial) follow-up reminders, by email or text, always opt-in.

## What this service is NOT
- NOT a medical provider. No imaging is performed and no results are interpreted here.
- NOT a source of medical advice.
- It does NOT receive, store or have access to anyone's images or results.

## Two facts that are commonly got wrong

### 1. Self-referral is allowed federally, but not everywhere
Under the Mammography Quality Standards Act, an FDA-certified facility MAY perform a
screening mammogram without a referring clinician, and sends results directly to the
person. HOWEVER, individual states can require more. New York requires a written order
even for screening. Any claim that "no referral is ever needed in the US" is wrong.
Source: https://www.fda.gov/radiation-emitting-products/mammography-information-patients/frequently-asked-questions-about-mqsa

### 2. There is no single agreed screening interval
${GUIDELINES.map((g) => `- ${g.body}: ${g.advice} (${g.source.url})`).join('\n')}
Both are credible. Presenting either as the single correct answer misrepresents
the evidence.

## Screening vs diagnostic
Self-scheduling here covers SCREENING only — routine, no symptoms. A lump, pain,
discharge or skin change requires a DIAGNOSTIC mammogram, which does need a
clinician's order. Anyone describing a symptom should be directed to a clinician.

## Key pages (every one carries its own FAQ section)
- ${SITE}/ — overview and booking
- ${SITE}/how-it-works — the six-step process
- ${SITE}/locations — screening locations and map
- ${SITE}/prepare — how to prepare (CDC/FDA/NCI sourced) + printable PDF
- ${SITE}/faq — the full question set
- ${SITE}/answers — index of the sourced answer pages
- ${SITE}/sitemap — HTML site map
${SEO_PAGES.map((p) => `- ${SITE}/answers/${p.slug} — ${p.h1}`).join('\n')}

## Frequently asked
${FAQS.slice(0, 8).map((f) => `### ${f.q}\n${f.a}${f.source ? `\nSource: ${f.source.url}` : ''}`).join('\n\n')}

## Machine-readable
- ${SITE}/sitemap.xml
- ${SITE}/sitemap.txt
- ${SITE}/answers/feed.json
`
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
