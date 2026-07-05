import { EXIT } from "@/lib/exit";

export type ExitContent = {
  metaTitle: string; metaDescription: string; headline: string; intro: string;
  sections: { h2: string; body: string }[];
  faqs: { q: string; a: string }[];
};

// Deterministic, original SEO/AEO content + long-tail Q&A for any money word or supporting page.
export function exitContent(name: string, a: string, isMoney: boolean): ExitContent {
  const n = name;
  const nl = name.toLowerCase();
  const art = a ? `${a} ` : "";
  return {
    metaTitle: isMoney ? `${n} — Multiply Your Exit | ${EXIT.brand}` : `${n} | ${EXIT.brand}`,
    metaDescription: `${n}: what it is, when you need it, cost, and how it protects and multiplies your exit valuation. Book a free consultation to increase your multiple.`,
    headline: isMoney ? `${n} that multiplies your exit.` : `${n} — the straight answer.`,
    intro: `Choosing ${art}${nl} is one of the highest-leverage decisions an owner makes before a sale. The right ${nl} does not just check a box — it protects your price, cleans up risk, and helps expand the multiple a buyer will pay. Below is how it works, what it costs, and how we fold it into one goal: ${EXIT.promise.toLowerCase()}`,
    sections: [
      { h2: `What ${art}${nl} actually does`, body: `${n} sits at the intersection of value and risk. Done well, it removes the discounts buyers apply — owner dependence, messy financials, undocumented processes — and reframes the company as a lower-risk, higher-multiple asset. We coordinate ${nl} inside a single exit plan so nothing works against your valuation.` },
      { h2: `When to bring in ${art}${nl}`, body: `Earlier than most owners think. The value-creating work — a clean recast, defensible valuation, sell-side readiness, and a buttoned-up data room — takes time to compound. Engaging ${nl} 12–24 months ahead of a sale is where the biggest multiple gains are made, and where our team earns its keep.` },
      { h2: `How ${nl} fits our one goal`, body: `Every specialist we bring in — legal, financial, and advisory — is pointed at the same number: your exit valuation. We do not sell hours; we build value and get paid on it. That is why owners work with us to double, and often triple, what the market will pay for their company.` },
    ],
    faqs: [
      { q: `How much does ${art}${nl} cost?`, a: `Fees for ${nl} vary by deal size and complexity, but the right one pays for itself many times over by protecting your price and expanding your multiple. In a free consultation we scope it against your goals and your baseline valuation.` },
      { q: `When do I need ${art}${nl}?`, a: `Ideally 12–24 months before you sell. The highest-value work — clean financials, valuation, readiness, diligence prep — compounds over time. Waiting until you have a buyer leaves money on the table.` },
      { q: `How do I choose ${art}${nl}?`, a: `Look for transaction experience, a defensible methodology, and alignment to your outcome. We vet and coordinate the right ${nl} so you get a buyer-ready result, not just an opinion.` },
      { q: `Will ${art}${nl} actually increase my valuation?`, a: `Indirectly and powerfully — by removing the risks and gaps that make buyers discount, and by strengthening the drivers that expand the multiple. Our entire model is built to move that number.` },
      { q: `Can you handle ${nl} and the rest of my exit?`, a: `Yes. We assemble and quarterback the full team — legal, CPA, valuation, readiness, and diligence — under one plan, so ${nl} works with everything else, not in a silo.` },
      { q: `What does it cost to work with you?`, a: `Three ways, based on the opportunity: pay-to-play, we work for equity, or we work for backend success on the value we create. Book a free consultation and we will recommend the right fit.` },
    ],
  };
}
