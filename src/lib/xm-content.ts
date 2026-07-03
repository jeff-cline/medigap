import { XM } from "@/lib/xm";

export type XmContent = {
  metaTitle: string; metaDescription: string; headline: string; intro: string;
  sections: { h2: string; body: string }[];
  faqs: { q: string; a: string }[];
};

// Deterministic, original AEO/SEO content + long-tail Q&A for any silo or supporting page.
export function xmContent(name: string, isSilo: boolean): XmContent {
  const n = name;
  const nl = name.toLowerCase();
  return {
    metaTitle: `${n} | ${XM.full} for Top Brands`,
    metaDescription: `${n} built for national brands — strategy, production, and measurable reach. Get a custom plan and see projected eyeballs at $${XM.cpmDollars}/1,000.`,
    headline: isSilo ? `${n} that brands remember.` : `${n} — what to know before you activate.`,
    intro: `${n} is how leading brands turn attention into affinity and affinity into revenue. We design, produce, and run ${nl} nationwide — engineered for reach, built for the feed, and measured to the last impression. Below: how it works, what it costs, and the ideas that perform.`,
    sections: [
      { h2: `What great ${n.toLowerCase()} looks like`, body: `The best ${nl} starts with a single, ownable idea and executes it flawlessly in the real world. It is somatic — it engages sight, sound, and touch — and it is built to be filmed, shared, and remembered. We combine sharp strategy, world-class production, and disciplined logistics so the moment lands in every market, on schedule, on brand.` },
      { h2: `How ${n.toLowerCase()} drives measurable reach`, body: `Every activation is instrumented. We plan against a target number of eyeballs, capture on-site engagement and data, and amplify each moment across social and creator channels so paid, earned, and owned reach compound. Reach is planned at roughly $${XM.cpmDollars} per 1,000 eyeballs, then verified against real impressions, so the program is accountable from day one.` },
      { h2: `Why national brands choose us for ${n.toLowerCase()}`, body: `We run ${nl} at national scale — one team, many markets, one standard. From glass box trucks and pop-ups to festivals, stadiums, and immersive XR, we own strategy, fabrication, staffing, routing, and measurement end to end, so brand and agency partners get a single accountable partner instead of a dozen vendors.` },
    ],
    faqs: [
      { q: `What is ${nl}?`, a: `${n} is a form of experiential marketing that creates live, in-person brand moments — engaging audiences directly to build memory, affection, and action. Done well, it earns social reach far beyond the people physically present.` },
      { q: `How much does ${nl} cost?`, a: `Cost depends on scope, markets, and target reach. As a planning anchor we price experiential reach at about $${XM.cpmDollars} per 1,000 eyeballs; use our calculator to model your budget, markets, and desired reach and get a custom estimate.` },
      { q: `How do you measure ${nl} ROI?`, a: `We track reach, engagement, data capture, and downstream action — planned eyeballs versus verified impressions, on-site interactions, sampling or lead volume, and social amplification — so every dollar maps to measurable outcomes.` },
      { q: `How many markets can ${nl} cover?`, a: `From a single flagship city to a full national tour. Our logistics, staffing, and routing are built to run many markets to one standard simultaneously.` },
      { q: `What makes ${nl} go viral?`, a: `A single ownable idea, a somatic build that begs to be filmed, and a creator-and-social amplification plan wired in from the start — so the moment travels far beyond the footprint.` },
      { q: `How do we start a ${nl} project?`, a: `Start a project with us or download our white paper. Tell us your budget, target markets, and the reach you want; we return a custom plan and a projected-reach estimate.` },
    ],
  };
}
