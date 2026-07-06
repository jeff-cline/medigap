// 10 weekly drip emails for exitoptimization.com customers — rotate one every 10 weeks.
// Each "story" is the editable business-story header; the drip appends rotating advertiser
// blocks + CTAs. Content is original and interlinks our services (deep links to money words).
const L = (slug: string, text: string) => `<a href="https://exitoptimization.com/${slug}" style="color:#f97316;text-decoration:none;font-weight:600">${text}</a>`;

export const EXIT_EMAILS: { subject: string; story: string }[] = [
  { subject: "The number that actually pays you", story:
    `<p>Most owners obsess over revenue. But your payout is <b>earnings × a multiple</b> — and the multiple is where the leverage lives. Every full turn you add can be worth as much as a year of profit.</p>
     <p>Run the ${L("business-valuation-calculators", "Business Valuation Estimator")} to see your range, then talk to a ${L("business-valuation-attorney", "business valuation attorney")} about defending your number.</p>` },
  { subject: "Your real earnings — recast the way buyers see them", story:
    `<p>The earnings on your P&L aren't the earnings a buyer values. A clean recast adds back owner comp, one-time costs, and personal expenses — often lifting recognized earnings by six figures.</p>
     <p>Use the ${L("business-valuation-calculators", "EBITDA Add-Back Calculator")}, then have an ${L("m-and-a-cpa", "M&A CPA")} package it for diligence.</p>` },
  { subject: "The #1 reason good companies sell cheap", story:
    `<p>Owner dependence is the single biggest discount buyers apply — sometimes 20–40%, or a heavy earnout. If the business is <i>you</i>, they're buying a job, not an asset.</p>
     <p>Score it with the ${L("business-valuation-calculators", "Owner Dependence Calculator")}, then work with a ${L("business-optimization-consultant", "business optimization consultant")} to make it run without you.</p>` },
  { subject: "What you actually keep at the closing table", story:
    `<p>The headline price isn't your check. After debt, advisor fees, transaction costs, and taxes, owners are often surprised how much comes off the top.</p>
     <p>Model it with the ${L("business-valuation-calculators", "Net Proceeds Calculator")}, and let a ${L("business-sale-attorney", "business sale attorney")} help you structure the deal to keep more.</p>` },
  { subject: "Are you actually sellable?", story:
    `<p>Buyers pay premiums for a specific set of drivers: recurring revenue, diversification, growth, margins, and a real management team. Weak drivers mean a lower multiple — or no deal.</p>
     <p>Score yours with the ${L("business-valuation-calculators", "Exit Readiness score")}, then get ${L("sell-side-readiness", "sell-side ready")} before you go to market.</p>` },
  { subject: "The value gap — what you're leaving on the table", story:
    `<p>There's usually a wide gap between what you'd get selling as-is and what an optimized exit delivers. Roughly half comes from earnings growth, half from multiple expansion.</p>
     <p>See your gap with the ${L("business-valuation-calculators", "Value Gap Calculator")}, then map the plan with a ${L("business-exit-consultant", "business exit consultant")}.</p>` },
  { subject: "Get diligence-ready before a buyer asks", story:
    `<p>Deals die — or lose value — in diligence. A clean data room and a ${L("quality-of-earnings-preparation", "quality-of-earnings package")} protect your price and keep the process moving.</p>
     <p>Start your ${L("due-diligence-preparation", "due-diligence prep")} early; it's the highest-ROI work you can do 12–24 months out.</p>` },
  { subject: "Multiple expansion is the real lever", story:
    `<p>Doubling earnings at the same multiple is good. Expanding the multiple <i>and</i> growing earnings is how owners double or triple their exit.</p>
     <p>An ${L("increase-ebitda-consultant", "increase-EBITDA consultant")} and a ${L("business-growth-consultant", "business growth consultant")} attack both at once.</p>` },
  { subject: "Succession and the clean transfer", story:
    `<p>Whether you sell to a third party, your team, or family, a clean ownership transfer preserves value and avoids costly surprises.</p>
     <p>A ${L("business-succession-attorney", "business succession attorney")} and a ${L("fractional-cfo-for-acquisition", "fractional CFO")} keep the transfer — and your valuation — intact.</p>` },
  { subject: "Timing your exit (start earlier than you think)", story:
    `<p>The value-creating work compounds. Owners who start 12–24 months ahead capture the biggest gains; those who wait for a buyer leave money on the table.</p>
     <p>An ${L("exit-coach", "exit coach")} keeps you on plan. Ready to talk? <a href="https://exitoptimization.com/book" style="color:#f97316;font-weight:600;text-decoration:none">Book a free consultation</a>.</p>` },
];
