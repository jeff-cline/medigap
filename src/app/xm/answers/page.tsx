import type { Metadata } from "next";
import { XM, xmVars } from "@/lib/xm";
import { XM_SILOS } from "@/lib/xm-taxonomy";
import { xmContent } from "@/lib/xm-content";
import { searchPhotos } from "@/lib/pexels";
import XmFooter from "@/components/xm/XmFooter";

export const dynamic = "force-dynamic";
const R = XM.colors.red;

export const metadata: Metadata = {
  title: `Experiential Marketing — Answers & FAQ | ${XM.brand}`,
  description: `Straight answers about experiential marketing: cost, ROI, ideas, glass box trucks, brand activations, and how national programs work.`,
};

export default async function XmAnswers() {
  const hero = await searchPhotos("experiential marketing brand event audience", 1).then((p) => p[0]?.url || "").catch(() => "");
  const groups = XM_SILOS.map((s) => ({ silo: s, faqs: xmContent(s.name, true).faqs.slice(0, 3) }));
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: groups.flatMap((g) => g.faqs.slice(0, 2).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))) };

  return (
    <div style={xmVars} className="bg-black text-white min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <div className="mx-auto max-w-4xl px-6 py-16">
        {hero && /* eslint-disable-next-line @next/next/no-img-element */ <img src={hero} alt="Experiential marketing questions and answers — brand activation event audience | XM Marketing image" className="w-full h-56 object-cover rounded-2xl border border-white/10 mb-8" />}
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: R }}>Answer Engine · AEO</div>
        <h1 className="mt-2 text-5xl font-black tracking-tight">Experiential marketing, answered.</h1>
        <p className="mt-3 text-white/60 max-w-2xl">Straight answers across every discipline — built for Google, Yahoo, ChatGPT, and Perplexity.</p>
        <div className="mt-10 space-y-10">
          {groups.map(({ silo, faqs }) => (
            <div key={silo.slug}>
              <a href={`/${silo.slug}`} className="text-2xl font-black tracking-tight hover:opacity-80">{silo.name} →</a>
              <div className="mt-3 divide-y divide-white/10 border-y border-white/10">
                {faqs.map((f, i) => (
                  <details key={i} className="py-3"><summary className="cursor-pointer font-bold text-white/85">{f.q}</summary><p className="mt-2 text-white/60 leading-relaxed">{f.a}</p></details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <XmFooter />
    </div>
  );
}
