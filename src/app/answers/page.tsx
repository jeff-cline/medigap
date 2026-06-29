import type { Metadata } from "next";
import Link from "next/link";
import { MEDIGAP } from "@/lib/medigap-brand";
import { siloGroups, loadSilo } from "@/lib/silos";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Senior Answers — Medicare, Care, Retirement | 1-800-MEDIGAP",
  description: "Straight answers to the questions seniors ask most — Medicare, senior living, long-term care, retirement, benefits and more. America's Trusted Toll-Free Number, 1-800-MEDIGAP.",
  alternates: { canonical: `${MEDIGAP.url}/answers` },
};

// The answer-engine (AEO) map: a clean, crawlable Q&A index across every silo, with one global
// FAQPage JSON-LD so ChatGPT / Perplexity / Claude / Google AI Overviews can cite us.
export default function AnswersPage() {
  const groups = siloGroups();
  const loaded = groups.map((g) => ({ group: g.group, silos: g.silos.map((s) => ({ meta: s, silo: loadSilo(s.slug) })).filter((x) => x.silo) }));

  const faqLd = JSON.stringify({
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: loaded.flatMap((g) => g.silos.flatMap((x) => (x.silo!.pillar.faqs || []).slice(0, 4).map((f) => ({
      "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a },
    })))),
  });

  return (
    <div className="min-h-screen bg-white text-[#0b2348]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqLd }} />
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-4xl font-extrabold">Senior Answers</h1>
        <p className="mt-3 text-[#5b6b86]">Clear, direct answers across everything seniors need — then call <a href={`tel:${MEDIGAP.tel}`} className="font-semibold" style={{ color: MEDIGAP.colors.brand }}>{MEDIGAP.brand}</a>, {MEDIGAP.tagline}.</p>

        {loaded.map((g) => (
          <div key={g.group} className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#5b6b86] border-b border-[#e4e9f2] pb-1">{g.group}</h2>
            <div className="mt-4 space-y-5">
              {g.silos.map(({ meta, silo }) => (
                <div key={meta.slug}>
                  <h3 className="font-bold text-lg"><Link href={`/${meta.slug}`} className="hover:underline" style={{ color: MEDIGAP.colors.brand }}>{meta.name}</Link></h3>
                  <p className="text-sm text-[#5b6b86] mt-1 leading-relaxed">{silo!.pillar.quickAnswer}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
