import { MEDIGAPP } from "@/lib/medigapp";

export type PageContent = {
  title: string; metaDescription: string; headline: string; intro: string;
  sections: { h2: string; body: string }[];
  faqs: { q: string; a: string }[];
};

// Deterministic AEO/SEO content + long-tail Q&A for any category/subcategory. Keyword-rich,
// answer-engine friendly (clear question→answer), with a toll-free CTA on phone verticals.
export function pageContent(name: string, catName: string, phone: boolean): PageContent {
  const n = name;
  const nl = name.toLowerCase();
  const cta = phone ? ` Prefer to talk it through? Call ${MEDIGAPP.brand} — free, and no pressure.` : "";
  const callLine = phone ? ` You can also call ${MEDIGAPP.brand} (${MEDIGAPP.telDisplay}) to speak with a specialist at no cost.` : "";

  return {
    title: `${n} — Compare the Best Offers & Save | ${MEDIGAPP.brand}`,
    metaDescription: `Compare the best ${nl} offers, deals and providers in ${catName.toLowerCase()}. Independent, up-to-date picks and real savings${phone ? ", plus free phone help" : ""}.`,
    headline: `The best ${n} offers, in one place.`,
    intro: `Shopping for ${nl}? We track the top-rated ${nl} offers and deals so you can compare providers side by side, see today's promotions, and choose what fits your needs and budget — without the guesswork.${cta}`,
    sections: [
      { h2: `What to look for in ${n}`, body: `The right ${nl} comes down to value, trust, and fit. Compare pricing and any current promotions, read the fine print on terms and coverage, and favor established, well-reviewed providers. The offers below are curated from vetted advertisers in the ${catName.toLowerCase()} space, so you're starting from a shortlist of reputable options rather than the entire internet.` },
      { h2: `How to save on ${n}`, body: `The biggest savings on ${nl} usually come from three moves: comparing at least three offers before you commit, timing your purchase around seasonal promotions, and stacking any available coupons or member discounts. We surface the strongest live offers first so the best value is right at the top of the page.${callLine}` },
      { h2: `Why compare ${n} here`, body: `Instead of visiting a dozen sites, you get the top ${nl} offers in a single, easy-to-scan list — updated as new deals go live. Every offer links straight to the provider, and there's no cost to you to browse or compare. It's the fastest way to find a strong ${nl} deal and move on with your day.` },
    ],
    faqs: [
      { q: `What is the best ${nl}?`, a: `The best ${nl} depends on your budget and priorities, but a strong choice combines competitive pricing, clear terms, and a trusted provider. Start with the curated offers above — they're pulled from vetted ${catName.toLowerCase()} advertisers${phone ? `, or call ${MEDIGAPP.brand} for a free recommendation` : ""}.` },
      { q: `How much does ${nl} cost?`, a: `Pricing for ${nl} varies by provider, plan, and any current promotions. Comparing several offers side by side — as you can above — is the quickest way to see the real range and find the best value for you.` },
      { q: `How do I compare ${nl} offers?`, a: `Look at price, what's included, the provider's reputation, and any promotional terms. We put the top ${nl} offers first so you can compare the strongest options at a glance and click through to whichever fits.` },
      { q: `Is ${nl} worth it?`, a: `For most people, yes — when you choose an offer that matches your needs at a fair price. Comparing a few ${nl} options first ensures you're not overpaying and that you get the features that matter to you.` },
      { q: `What should I look for when choosing ${nl}?`, a: `Prioritize total value over the lowest sticker price: factor in what's included, the provider's track record and reviews, and the fine print. The offers above are from reputable ${catName.toLowerCase()} advertisers to keep your shortlist trustworthy.` },
      { q: `Are these ${nl} offers legitimate?`, a: `Yes — every offer comes from a vetted advertiser in the Rakuten Advertising network and links directly to that provider. We may earn a commission if you purchase, at no extra cost to you${phone ? `. Questions? Call ${MEDIGAPP.brand}, free` : ""}.` },
    ],
  };
}
