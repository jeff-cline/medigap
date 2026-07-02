import type { Metadata } from "next";
import { headers } from "next/headers";
import { MEDIGAPP } from "@/lib/medigapp";
import { TAXONOMY, isPhoneVertical } from "@/lib/rak-taxonomy";
import { pageContent } from "@/lib/rak-content";
import MedigappSearch from "@/components/MedigappSearch";
import MedigappFooter from "@/components/MedigappFooter";

export const dynamic = "force-dynamic";
const C = MEDIGAPP.colors;
const vars = { "--bg": C.bg, "--ink": C.ink, "--brand": C.brand, "--green": C.green, "--gold": C.gold, "--soft": C.soft, "--border": C.border, "--muted": C.muted } as React.CSSProperties;

export const metadata: Metadata = {
  title: `Answers — Questions & Answers | ${MEDIGAPP.brand}`,
  description: `Straight answers to common questions across insurance, financial, travel, home and more. ${MEDIGAPP.tagline}.`,
};

export default async function Answers() {
  const base = ((await headers()).get("x-pathname") || "").startsWith("/r") ? "/r" : "";
  // build the visible index + a FAQPage JSON-LD (top verticals, 2 Qs each, to keep it crawl-friendly)
  const ldQs: { q: string; a: string }[] = [];
  const groups = TAXONOMY.map((cat) => ({
    cat,
    subs: cat.subs.map((s) => {
      const faqs = pageContent(s.name, cat.name, isPhoneVertical(cat.slug)).faqs;
      if (cat.tier >= 3) ldQs.push(...faqs.slice(0, 2));
      return { sub: s, qs: faqs.slice(0, 2) };
    }),
  }));
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: ldQs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div style={vars} className="min-h-screen bg-white text-[var(--ink)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <div className="mx-auto max-w-3xl px-5 py-7">
        <a href={`tel:${MEDIGAPP.tel}`} className="block w-full text-center text-white font-extrabold py-4 rounded-2xl text-2xl" style={{ background: `linear-gradient(110deg, ${C.brand}, ${C.green})` }}>📞 Call {MEDIGAPP.brand} — {MEDIGAPP.telDisplay}</a>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Answers</h1>
        <p className="mt-2 text-[15px] text-[var(--muted)]">Straight answers to the questions people ask most — across every category we cover.</p>
        <div className="mt-5"><MedigappSearch base={base} /></div>

        <div className="mt-7 space-y-8">
          {groups.map(({ cat, subs }) => (
            <div key={cat.slug}>
              <a href={`${base}/${cat.slug}`} className="text-lg font-bold tracking-tight hover:text-[var(--brand)]">{cat.icon} {cat.name}</a>
              <div className="mt-2 space-y-3">
                {subs.map(({ sub, qs }) => (
                  <div key={sub.slug} className="rounded-xl border border-[var(--border)] p-3">
                    <a href={`${base}/${sub.slug}`} className="font-semibold text-[var(--brand)]">{sub.name} →</a>
                    <ul className="mt-1 space-y-0.5">
                      {qs.map((f, i) => <li key={i}><a href={`${base}/${sub.slug}`} className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">• {f.q}</a></li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <MedigappFooter base={base} />
      </div>
    </div>
  );
}
