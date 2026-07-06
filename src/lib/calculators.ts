// The six calculators every owner needs for exit + valuation planning. Pure client-computable
// functions — no server deps — so the calculator UI runs them instantly.
export type CalcField = {
  key: string; label: string; kind: "money" | "percent" | "number" | "select" | "score";
  default: number; help?: string; options?: { label: string; value: number }[];
};
export type CalcRow = { label: string; value: string; key?: boolean; gated?: boolean };
export type CalcOut = { headline: string; sub: string; rows: CalcRow[]; insight: string };
export type Calc = { slug: string; title: string; short: string; desc: string; img: string; fields: CalcField[]; compute: (v: Record<string, number>) => CalcOut };

const usd = (n: number) => "$" + Math.round(n).toLocaleString();
const pct = (n: number) => Math.round(n) + "%";

const INDUSTRY: { label: string; value: number }[] = [
  { label: "Professional / B2B services", value: 4.5 },
  { label: "Software / SaaS", value: 6.5 },
  { label: "Healthcare / dental", value: 5 },
  { label: "Manufacturing", value: 4 },
  { label: "Construction / trades", value: 3.5 },
  { label: "E-commerce / retail", value: 3 },
  { label: "Home services", value: 3.8 },
  { label: "Other", value: 4 },
];

export const CALCULATORS: Calc[] = [
  {
    slug: "business-valuation-estimator", title: "Business Valuation Estimator", short: "What's my company worth?",
    desc: "Estimate your company's enterprise value from earnings, industry, and growth — the number a buyer starts from.",
    img: "business valuation financial charts meeting",
    fields: [
      { key: "industry", label: "Industry", kind: "select", default: 4.5, options: INDUSTRY },
      { key: "revenue", label: "Annual revenue", kind: "money", default: 3000000 },
      { key: "ebitda", label: "EBITDA (annual earnings)", kind: "money", default: 600000 },
      { key: "growth", label: "Annual growth rate", kind: "percent", default: 12 },
    ],
    compute: (v) => {
      const adj = v.growth >= 25 ? 1.5 : v.growth >= 15 ? 1 : v.growth >= 8 ? 0.5 : v.growth < 0 ? -1 : 0;
      const mult = Math.max(1.5, v.industry + adj);
      const mid = v.ebitda * mult, low = v.ebitda * Math.max(1, mult - 1), high = v.ebitda * (mult + 1.5);
      return {
        headline: `${usd(low)} – ${usd(high)}`, sub: `Estimated enterprise value · ~${mult.toFixed(1)}× EBITDA`,
        rows: [
          { label: "Applied multiple", value: `${mult.toFixed(1)}× EBITDA`, key: true },
          { label: "Midpoint valuation", value: usd(mid), key: true },
          { label: "Revenue multiple (sanity)", value: `${(mid / v.revenue).toFixed(2)}× revenue`, gated: true },
          { label: "Value per 1× multiple gained", value: usd(v.ebitda), gated: true },
        ],
        insight: `Every full turn of multiple you add is worth ~${usd(v.ebitda)}. That's the leverage exit optimization targets.`,
      };
    },
  },
  {
    slug: "ebitda-addback-normalizer", title: "EBITDA / SDE Add-Back Calculator", short: "Your real, recast earnings",
    desc: "Recast your financials the way a buyer will — add back owner and one-time expenses to reveal your true earnings.",
    img: "accountant financial statements recast desk",
    fields: [
      { key: "netIncome", label: "Net income", kind: "money", default: 350000 },
      { key: "interest", label: "Interest", kind: "money", default: 40000 },
      { key: "taxes", label: "Taxes", kind: "money", default: 90000 },
      { key: "da", label: "Depreciation + amortization", kind: "money", default: 60000 },
      { key: "ownerAddback", label: "Owner comp above market", kind: "money", default: 120000 },
      { key: "oneTime", label: "One-time / non-recurring", kind: "money", default: 45000 },
      { key: "personal", label: "Personal expenses run through", kind: "money", default: 35000 },
    ],
    compute: (v) => {
      const ebitda = v.netIncome + v.interest + v.taxes + v.da;
      const adj = ebitda + v.ownerAddback + v.oneTime + v.personal;
      const lift = adj - ebitda;
      return {
        headline: usd(adj), sub: "Adjusted (normalized) EBITDA — what buyers value",
        rows: [
          { label: "Reported EBITDA", value: usd(ebitda), key: true },
          { label: "Total add-backs", value: usd(lift), key: true },
          { label: "Value of add-backs at 5× multiple", value: usd(lift * 5), gated: true },
          { label: "Add-back uplift", value: pct(ebitda ? (lift / ebitda) * 100 : 0), gated: true },
        ],
        insight: `A clean recast adds ${usd(lift)} in recognized earnings — worth roughly ${usd(lift * 5)} of enterprise value at a 5× multiple. Most owners leave this on the table.`,
      };
    },
  },
  {
    slug: "exit-readiness-score", title: "Exit Readiness & Value-Driver Score", short: "How sellable are you?",
    desc: "Score the drivers buyers pay for. Your score maps to the multiple you can realistically command.",
    img: "business readiness scorecard team meeting",
    fields: [
      { key: "owner", label: "Runs without the owner (1–5)", kind: "score", default: 3 },
      { key: "recurring", label: "Recurring / predictable revenue (1–5)", kind: "score", default: 3 },
      { key: "diversification", label: "Customer diversification (1–5)", kind: "score", default: 3 },
      { key: "growth", label: "Growth trajectory (1–5)", kind: "score", default: 3 },
      { key: "margins", label: "Margins vs. peers (1–5)", kind: "score", default: 3 },
      { key: "team", label: "Management team depth (1–5)", kind: "score", default: 3 },
    ],
    compute: (v) => {
      const total = v.owner + v.recurring + v.diversification + v.growth + v.margins + v.team;
      const pctScore = (total / 30) * 100;
      const multLow = 3 + (total - 6) * 0.12, multHigh = multLow + 1.5;
      return {
        headline: `${Math.round(pctScore)} / 100`, sub: pctScore >= 75 ? "Institutionally attractive" : pctScore >= 50 ? "Sellable — with upside" : "High-risk in a buyer's eyes",
        rows: [
          { label: "Driver score", value: `${total} / 30`, key: true },
          { label: "Estimated multiple range", value: `${multLow.toFixed(1)}× – ${multHigh.toFixed(1)}×`, key: true },
          { label: "Weakest driver", value: [["owner", v.owner], ["recurring", v.recurring], ["diversification", v.diversification], ["growth", v.growth], ["margins", v.margins], ["team", v.team]].sort((a, b) => (a[1] as number) - (b[1] as number))[0][0] as string, gated: true },
          { label: "Points to close for +1 bracket", value: `${Math.max(0, Math.ceil((0.75 * 30) - total))} pts`, gated: true },
        ],
        insight: `Move your weakest drivers up and you re-rate into the ${multHigh.toFixed(1)}× bracket — the difference between a good sale and a premium exit.`,
      };
    },
  },
  {
    slug: "net-proceeds", title: "Net Sale Proceeds Calculator", short: "What you actually keep",
    desc: "The headline price isn't your check. See what's left after debt, advisor fees, transaction costs, and taxes.",
    img: "business owner reviewing sale proceeds documents",
    fields: [
      { key: "price", label: "Sale price", kind: "money", default: 5000000 },
      { key: "debt", label: "Debt & liabilities paid off", kind: "money", default: 600000 },
      { key: "advisorPct", label: "Advisor / broker fee", kind: "percent", default: 6 },
      { key: "legal", label: "Legal & transaction costs", kind: "money", default: 120000 },
      { key: "taxPct", label: "Effective tax on gain", kind: "percent", default: 24 },
    ],
    compute: (v) => {
      const fees = v.price * (v.advisorPct / 100);
      const preTax = v.price - v.debt - fees - v.legal;
      const tax = Math.max(0, preTax) * (v.taxPct / 100);
      const net = preTax - tax;
      return {
        headline: usd(net), sub: `Net cash to you · ${pct((net / v.price) * 100)} of the headline price`,
        rows: [
          { label: "Advisor / broker fees", value: "-" + usd(fees), key: true },
          { label: "Debt + legal", value: "-" + usd(v.debt + v.legal), key: true },
          { label: "Taxes", value: "-" + usd(tax), gated: true },
          { label: "Gap vs. headline price", value: usd(v.price - net), gated: true },
        ],
        insight: `You keep about ${pct((net / v.price) * 100)} of the sticker price. Structuring the deal and the readiness work ahead of it can meaningfully shrink that gap.`,
      };
    },
  },
  {
    slug: "owner-dependence", title: "Owner Dependence Score", short: "What your involvement costs you",
    desc: "The #1 discount buyers apply. Measure how much the business depends on you — and what it's costing your valuation.",
    img: "business owner working alone office late",
    fields: [
      { key: "hours", label: "Owner hours / week", kind: "number", default: 55 },
      { key: "relationships", label: "% revenue tied to owner relationships", kind: "percent", default: 40 },
      { key: "decisions", label: "Decisions that need the owner (1–5)", kind: "score", default: 4 },
      { key: "processes", label: "Documented processes (1–5)", kind: "score", default: 2 },
      { key: "team", label: "Management can run it (1–5)", kind: "score", default: 2 },
    ],
    compute: (v) => {
      // higher = more dependent
      const dep = (Math.min(60, v.hours) / 60) * 25 + (v.relationships / 100) * 25 + (v.decisions / 5) * 20 + ((6 - v.processes) / 5) * 15 + ((6 - v.team) / 5) * 15;
      const discount = dep >= 70 ? 35 : dep >= 50 ? 22 : dep >= 30 ? 12 : 5;
      return {
        headline: `${Math.round(dep)} / 100`, sub: dep >= 70 ? "Severe owner dependence" : dep >= 50 ? "High dependence" : dep >= 30 ? "Moderate" : "Transferable",
        rows: [
          { label: "Estimated valuation discount", value: `~${discount}%`, key: true },
          { label: "Risk to a buyer", value: dep >= 50 ? "High — expect earnouts" : "Manageable", key: true },
          { label: "Biggest fix", value: v.processes <= 2 ? "Document processes" : v.team <= 2 ? "Build the team" : "Reduce owner decisions", gated: true },
          { label: "Value recoverable (on a $5M sale)", value: usd(5000000 * (discount / 100)), gated: true },
        ],
        insight: `At this level, a buyer discounts you ~${discount}% or loads the deal with earnouts. Transferring the company off yourself is the single biggest lever on your multiple.`,
      };
    },
  },
  {
    slug: "value-gap", title: "Value Gap Calculator", short: "Today vs. an optimized exit",
    desc: "See the difference between what you'd get today and what an optimized exit could deliver — the gap we close.",
    img: "growth gap chart upward arrow business",
    fields: [
      { key: "ebitda", label: "Current EBITDA", kind: "money", default: 600000 },
      { key: "mult", label: "Current likely multiple", kind: "number", default: 4 },
      { key: "growthPct", label: "Achievable EBITDA growth", kind: "percent", default: 40 },
      { key: "uplift", label: "Achievable multiple uplift (turns)", kind: "number", default: 2 },
    ],
    compute: (v) => {
      const today = v.ebitda * v.mult;
      const optEbitda = v.ebitda * (1 + v.growthPct / 100);
      const optMult = v.mult + v.uplift;
      const optimized = optEbitda * optMult;
      const gap = optimized - today;
      return {
        headline: usd(gap), sub: `Additional value on the table · ${(optimized / today).toFixed(1)}× your current exit`,
        rows: [
          { label: "Value today", value: usd(today), key: true },
          { label: "Optimized value", value: usd(optimized), key: true },
          { label: "From earnings growth", value: usd((optEbitda - v.ebitda) * v.mult), gated: true },
          { label: "From multiple expansion", value: usd(optEbitda * v.uplift), gated: true },
        ],
        insight: `That's ${usd(gap)} you leave behind by selling as-is. Roughly half comes from earnings and half from multiple expansion — exactly what our program is built to do.`,
      };
    },
  },
];

export const calcBySlug = (s: string) => CALCULATORS.find((c) => c.slug === s) || null;
