// exitoptimization.com money words (primary landing pages) + supporting silo pages.
// Every supporting page links back to its money word and the others — SEO authority to the money pages.
export type ExitSub = { slug: string; title: string };
export type ExitMoney = { slug: string; name: string; a: string; group: string; blurb: string; img: string; subs: ExitSub[] };

const slugify = (s: string) => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// 5 long-tail supporting pages per money word (work for both roles and services).
function subsFor(name: string): ExitSub[] {
  const P: [string, (n: string) => string][] = [
    ["cost", (n) => `${n} — Cost & Fees`],
    ["when-to-start", (n) => `When to Hire ${n}`],
    ["how-it-works", (n) => `How ${n} Works`],
    ["checklist", (n) => `${n} — Checklist & Process`],
    ["what-to-expect", (n) => `${n} — What to Expect`],
  ];
  return P.map(([suf, f]) => ({ slug: `${slugify(name)}-${suf}`, title: f(name) }));
}

// name, indefinite article ("a"/"an"), group, blurb, pexels query
const RAW: [string, string, string, string, string][] = [
  ["Business Valuation Attorney", "a", "Legal", "A valuation-savvy attorney who defends your number in the deal.", "business attorney meeting documents"],
  ["Business Sale Attorney", "a", "Legal", "Deal counsel that protects value from LOI through closing.", "lawyer signing contract handshake"],
  ["Sell My Company Attorney", "a", "Legal", "The attorney who gets your company sold — cleanly and for more.", "business owner lawyer office"],
  ["Business Succession Attorney", "a", "Legal", "Succession and ownership-transfer counsel that preserves value.", "family business succession meeting"],
  ["M&A CPA", "an", "Financial", "Transaction-grade accounting that stands up in diligence.", "accountant financial analysis desk"],
  ["CPA Business Valuation", "a", "Financial", "A defensible, buyer-ready valuation from a specialist CPA.", "financial charts valuation report"],
  ["Business Sale Accountant", "a", "Financial", "Clean books and a recast that shows your true earnings.", "accountant reviewing financial statements"],
  ["Business Exit Consultant", "a", "Advisory", "The strategist who engineers a bigger, cleaner exit.", "business consultant strategy whiteboard"],
  ["Exit Coach", "an", "Advisory", "Your coach through the biggest transaction of your life.", "executive coaching session office"],
  ["Business Growth Consultant", "a", "Advisory", "Growth that compounds into a higher multiple, not just revenue.", "growth chart business meeting"],
  ["Business Optimization Consultant", "a", "Advisory", "Systematize operations so the company runs — and sells — for more.", "operations optimization team workflow"],
  ["Fractional CFO for Acquisition", "a", "Financial", "Deal-ready finance leadership without a full-time hire.", "cfo finance executive boardroom"],
  ["Increase EBITDA Consultant", "an", "Advisory", "Margin and earnings expansion that lifts your valuation.", "profit growth financial dashboard"],
  ["Sell-Side Readiness", "", "Readiness", "Get the company diligence-ready before you go to market.", "business readiness checklist meeting"],
  ["Quality of Earnings Preparation", "", "Readiness", "A QoE-ready earnings package that protects your price.", "financial audit quality review"],
  ["Due Diligence Preparation", "", "Readiness", "A buttoned-up data room that keeps the deal — and value — intact.", "due diligence data room documents"],
];

export const EXIT_MONEY: ExitMoney[] = RAW.map(([name, a, group, blurb, img]) => ({ slug: slugify(name), name, a, group, blurb, img, subs: subsFor(name) }));

const M = new Map(EXIT_MONEY.map((m) => [m.slug, m]));
const SUB = new Map<string, { sub: ExitSub; money: ExitMoney }>();
for (const m of EXIT_MONEY) for (const s of m.subs) SUB.set(s.slug, { sub: s, money: m });

export const exitMoney = (slug: string) => M.get(slug) || null;
export const exitSub = (slug: string) => SUB.get(slug) || null;
export const exitAllUrls = () => [...EXIT_MONEY.map((m) => m.slug), ...[...SUB.keys()]];
export const exitGroups = () => [...new Set(EXIT_MONEY.map((m) => m.group))];
