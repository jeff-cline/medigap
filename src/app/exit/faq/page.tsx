import type { Metadata } from "next";
import { EXIT, exitVars } from "@/lib/exit";
import { EXIT_MONEY } from "@/lib/exit-taxonomy";
import { exitContent } from "@/lib/exit-content";
import { CtaBand } from "@/components/exit/ExitCTA";
import ExitFooter from "@/components/exit/ExitFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Exit Optimization FAQ — Selling & Multiplying Your Business | ${EXIT.brand}`,
  description: `Answers to the most-asked questions about business valuation, selling your company, exit consultants, M&A CPAs, sell-side readiness, QoE and due-diligence prep.`,
};

export default function ExitFaq() {
  const groups = EXIT_MONEY.map((m) => ({ money: m, faqs: exitContent(m.name, m.a, true).faqs.slice(0, 2) }));
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: groups.flatMap((g) => g.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))) };
  return (
    <div style={exitVars} className="text-white"><div style={{ background: EXIT.colors.bg }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: EXIT.colors.orange3 }}>Answer Engine · AEO</div>
        <h1 className="mt-2 text-5xl font-black tracking-tight">Exit optimization — answered.</h1>
        <p className="mt-3 text-slate-300 max-w-2xl">Straight answers on valuation, selling, and multiplying your exit — built for Google, Bing, ChatGPT, and Perplexity.</p>
        <div className="mt-10 space-y-8">
          {groups.map(({ money, faqs }) => (
            <div key={money.slug}>
              <a href={`/${money.slug}`} className="text-2xl font-black tracking-tight hover:opacity-80">{money.name} →</a>
              <div className="mt-3">
                {faqs.map((f, i) => (
                  <details key={i} className="py-3 border-t" style={{ borderColor: EXIT.colors.border }}><summary className="cursor-pointer font-bold">{f.q}</summary><p className="mt-2 text-slate-400 leading-relaxed">{f.a}</p></details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <CtaBand />
      <ExitFooter />
    </div></div>
  );
}
