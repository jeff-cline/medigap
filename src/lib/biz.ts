// 1800medigap.biz — the business-development power platform (investor / JV / advertiser / sponsor).
// A standalone, investor-grade lander that sits on the Core; every lead lands in the founder's JV CRM.
export const BIZ = {
  domain: "1800medigap.biz",
  brand: "1-800-MEDIGAP",
  tagline: "Disruption Ahead",
  tel: "18006334427",
  telDisplay: "1-800-MEDIGAP",
  calendly: "https://calendly.com/jdcline",
  founder: "jeff.cline@me.com",
  partner: "Darlin_Brown@outlook.com",
  tvYouTube: "31h208kx4L0",
  disclaimer:
    "For informational purposes only and directional guidance for conversations. Nothing herein is an offer to sell or a solicitation to buy any security, nor investment, legal, tax, or accounting advice. Figures are illustrative, forward-looking, or drawn from third-party public sources believed reliable but not independently verified, and are subject to change. Market-size, exit, and valuation references describe the broader AgeTech / senior-marketing sector, not the results of this company. Past results and comparable transactions do not guarantee future outcomes. 1-800-MEDIGAP is not affiliated with, and does not imply endorsement by, any company referenced. Trademarks belong to their respective owners.",
  colors: {
    navy: "#0a0e1a", panel: "#111a2e", panel2: "#0e1526", line: "#22304c",
    gold: "#e3b23c", goldSoft: "#f2d78a", ink: "#eef2f9", muted: "#98a4bb", white: "#ffffff",
    disrupt: "#ff5a1f", disrupt2: "#ffb020",
  },
} as const;

// The four strategic assets (the featured sections).
export const ASSETS = [
  {
    n: "01", key: "vanity", tag: "The Vanity Asset",
    title: "1-800-MEDIGAP — a priceless, category-defining vanity brand",
    lead: "A toll-free vanity number and matching domain (1-800-MEDIGAP.com) in the single largest, highest-intent corner of American healthcare: Medicare, Medigap, and Medicare Advantage.",
    body: "Vanity numbers are strategic assets that don't depreciate — they compound. The number IS the brand: it is memorized, dialed, and trusted before a website ever loads. In the senior market — where phone is the dominant channel and trust is the currency — owning the generic category name is an unfair, defensible advantage. This offer includes 1-800-MEDIGAP.com and the 1-800-MEDIGAP toll-free vanity number together.",
    bullets: ["Owns the generic category term seniors already say out loud", "Phone-first: the channel seniors actually convert on", "Non-dilutive, appreciating strategic asset — not ad spend", "Available for sponsorship, advertising, or full brand takeover"],
    link: { href: "/vanity", label: "Why vanity toll-free numbers are priceless →" },
  },
  {
    n: "02", key: "medigapplus", tag: "The Lead Engine",
    title: "Medigap.plus — lead generation & routing-optimization portal",
    lead: "A profit-optimization portal that generates, scores, and routes high-intent leads — then monetizes them multiple times.",
    body: "Medigap.plus is built to maximize revenue per lead: selling leads to the highest payer in real time, selling policies directly, and cross-marketing complementary senior products across the household. One acquisition, monetized across several revenue lines — the economics that turn a lead-gen business into a compounding platform.",
    bullets: ["Route-to-highest-payer auction on every inbound", "Sell leads, sell policies, and cross-market — three revenue lines per contact", "White-label sites stack new brands onto one backend", "Built-in CRM, attribution, and follow-up automation"],
  },
  {
    n: "03", key: "predictive", tag: "The Efficiency Layer",
    title: "predictivedata.org — predictive acquisition that lowers CPA over time",
    lead: "Predictive-data technology that identifies who is going to buy — so marketing dollars only chase the consumers most likely to convert.",
    body: "By scoring intent against real KPIs, predictivedata.org concentrates spend on high-probability buyers and suppresses the rest. The result is a cost-per-acquisition curve that bends down as the model learns — the opposite of the rising CAC that erodes most marketing organizations. This is the difference between buying traffic and buying customers.",
    bullets: ["Targets only high-intent, high-probability buyers", "KPI-driven scoring that improves with every cycle", "Structurally declining cost-per-acquisition", "Pairs with data-append to enrich every inbound lead"],
  },
  {
    n: "04", key: "moneywords", tag: "The Autonomous Workforce",
    title: "Money Words — AI + a fully autonomous team, at scale",
    lead: "An AI and fully autonomous workforce that can be enabled for customer service, triage, basic and general questions, concierge service, and dozens of other high-value roles.",
    body: "Leveraging predictive analytics, machine learning, and AI, the autonomous team is designed to run the high-volume, high-cost functions that normally cap a company's growth — unlocking scale and margin at the same time. It is powered by R0cketShip.com demand technology, so capacity expands with demand instead of headcount.",
    bullets: ["Autonomous customer service, triage, and concierge", "Predictive analytics + ML + AI at the core", "Scale and profitability without linear headcount", "Powered by R0cketShip.com demand tech"],
  },
] as const;

// AgeTech thesis — real, publicly-reported sector figures (illustrative / directional).
export const AGETECH = {
  headline: "The macro: a demographic tidal wave meeting a market that is finally investable",
  stats: [
    { big: "$77.1B", label: "Projected global AgeTech market by 2034", note: "technology for older adults & senior living" },
    { big: "121+", label: "AgeTech acquisitions globally", note: "an active, liquid M&A market" },
    { big: "25", label: "AgeTech IPOs globally", note: "public-market validation of the category" },
    { big: "$8B", label: "Signify Health exit to CVS Health", note: "tech-enabled care networks for seniors" },
  ],
  exits: [
    { name: "Signify Health", note: "Tech-enabled care networks for seniors — acquired by CVS Health for ~$8B." },
    { name: "SafelyYou", note: "AI video technology that prevents and explains falls in senior-living facilities." },
    { name: "Lively", note: "Consumer-friendly emergency response and health-monitoring plans for older adults." },
    { name: "ElliQ (Intuition Robotics)", note: "An AI companion robot built specifically for older adults." },
  ],
  thesis: "AgeTech companies frequently command higher exit multiples and larger valuation step-ups than general tech startups. They solve critical, high-stakes problems — healthcare, senior safety, longevity — and lock in lucrative, sticky B2B enterprise contracts with care networks, payers, and providers. When a strategic asset sits at the front door of that market, it stops being a line item and becomes a control point.",
};

// Form: "select all that apply" (exact wording requested).
export const INTERESTS = [
  { key: "bid_calls", label: "I would like to bid on high-intent, consumer-generated inbound calls." },
  { key: "sponsor_state", label: "I am interested in sponsoring a state." },
  { key: "advertiser", label: "I'm interested in being an advertiser." },
  { key: "brand_takeover", label: "I'm interested in doing an entire brand takeover, nationwide." },
  { key: "investing", label: "I'm interested in investing." },
] as const;

export const INVESTOR_TYPES = [
  "I am an accredited investor",
  "I am an insurance carrier",
  "I am a private equity fund",
  "I am a strategic partner",
  "I am a marketing fund",
] as const;

// Footer roles → pre-selected interest on the form.
export const FOOTER_ROLES: { label: string; role: string; preselect: string; investorType?: string }[] = [
  { label: "Investor", role: "investor", preselect: "investing" },
  { label: "Press", role: "press", preselect: "advertiser" },
  { label: "Carriers", role: "carrier", preselect: "investing", investorType: "I am an insurance carrier" },
  { label: "Agents", role: "agent", preselect: "bid_calls" },
  { label: "Brokerage", role: "brokerage", preselect: "sponsor_state" },
  { label: "IMO-FMO", role: "imo_fmo", preselect: "brand_takeover" },
];

export const FAQ = [
  { q: "What exactly is being offered?", a: "Strategic access to four assets — the 1-800-MEDIGAP vanity brand (number + 1-800-MEDIGAP.com), the Medigap.plus lead & routing portal, predictivedata.org predictive acquisition, and an AI autonomous workforce — via sponsorship, advertising, investment, or a full nationwide brand takeover." },
  { q: "Why is a toll-free vanity number a strategic asset and not just a phone number?", a: "Because in a phone-first, trust-driven market the generic category name is a control point competitors cannot buy their way around. It is memorable, brandable, and appreciating. See our deep-dive on why vanity numbers are priceless." },
  { q: "How big is the opportunity?", a: "The global AgeTech market is projected to reach $77.1B by 2034, with 121+ acquisitions and 25 IPOs already recorded — and Medicare sits at the center of it. This is a large, liquid, investable market." },
  { q: "Who is this for?", a: "Accredited investors, insurance carriers, private-equity funds, strategic partners, marketing funds, IMOs/FMOs, brokerages, agents, and advertisers who want a defensible position in the senior / Medicare space." },
  { q: "What happens after I submit?", a: "Your inquiry routes directly to the founder, you're enriched with our data-append tools, and you'll be invited to book a confidential conversation." },
  { q: "Is this an offer to invest?", a: "No. This is informational and directional guidance for conversations only. See the disclaimer below." },
];

// Why-vanity citations (public, well-known examples — directional).
export const VANITY_EXAMPLES = [
  { name: "1-800-FLOWERS (NASDAQ: FLWS)", note: "A public company whose brand, ticker culture, and recall were built directly on its vanity number — the number is the brand." },
  { name: "1-800-CONTACTS", note: "A category-owning vanity brand that has changed hands in transactions reported in the billion-dollar range." },
  { name: "1-800-GOT-JUNK?", note: "A franchise empire built on a single memorable vanity number — proof the number can BE the business model." },
  { name: "1-800-PetMeds (PETS)", note: "Another public brand anchored by the generic category vanity number in its vertical." },
];
export const VANITY_POINTS = [
  { h: "Memory is market share", p: "Vanity numbers are dramatically easier to recall than a string of digits. Industry research (e.g., 800response and AT&T-era studies) has long shown vanity numbers materially lift recall and response versus numeric numbers — recall is the first, cheapest conversion." },
  { h: "The number is the moat", p: "There is exactly one 1-800-MEDIGAP. Competitors can outspend you on ads; they cannot buy the generic category name once it is owned. Scarcity plus category-definition equals pricing power." },
  { h: "Phone-first seniors", p: "Medicare's core demographic still converts by phone. A trusted, spoken, category-defining number meets the buyer exactly where the decision happens." },
  { h: "Appreciating, non-dilutive", p: "Unlike ad budgets that vanish, a category vanity asset compounds in value as the brand and market grow — a balance-sheet asset, not an expense line." },
  { h: "Priceless where it matters", p: "In healthcare and senior care — high-stakes, high-trust, high-LTV — a front-door control point in the Medicare category is, by any strategic measure, priceless." },
];

// ---------------------------------------------------------------------------
// Investor comparables (deep research) — real, cited figures. Estimates labeled.
// The senior/Medicare customer's lifetime value vs. these vanity-brand customers.
// ---------------------------------------------------------------------------
export const SENIOR_LTV = {
  spendHeadline: "$15,000–$26,000",     // Medigap premium over ~8–10 yrs (conservative, apples-to-apples customer spend)
  spendUpside: "$50,000–$90,000",       // Medicare Advantage gross revenue per member over tenure
  mid: 18000,                            // conservative midpoint used for illustrative multiples
  agentBasis: "$1,500–$2,500",           // like-for-like agent/agency commission LTV per policyholder
  multipleHeadline: "10×–100×+",
  note: "Illustrative lifetime economic value per customer. Senior figures reflect Medigap premium dollars over a typical 8–10-year hold (guaranteed-renewable, high-persistency), with Medicare Advantage gross revenue reaching $50k–$90k per member. Retail figures reflect customer lifetime value/spend to each business. Not apples-to-apples across every basis; directional guidance for conversations.",
};

export type Comp = {
  slug: string; name: string; ticker: string; isPublic: boolean;
  tenK?: string; tenKLabel?: string; ownership?: string;
  marketCap: string; marketCapNote: string; revenue: string; revenueNote: string;
  aov: string; customerLtv: string; customerLtvMid: number; ltvBasis: string;
  tagline: string; narrative: string; facts: string[]; sources: { label: string; url: string }[];
};

export const COMPS: Comp[] = [
  {
    slug: "flowers", name: "1-800-FLOWERS.COM, Inc.", ticker: "NASDAQ: FLWS", isPublic: true,
    tenK: "https://www.sec.gov/Archives/edgar/data/1084869/000108486925000017/flws-20250629.htm", tenKLabel: "FY2025 Form 10-K (SEC EDGAR)",
    marketCap: "~$250M", marketCapNote: "micro-cap (mid-2026); de-rated from a multi-billion-dollar cap in 2020–21",
    revenue: "$1.69B", revenueNote: "FY2025 (ended June 29, 2025) — a down year: $200M net loss incl. a $143.8M non-cash impairment",
    aov: "~$89", customerLtv: "~$150–$400", customerLtvMid: 275, ltvBasis: "occasion-driven gifting; >10M customers, ~74% of revenue from repeat customers",
    tagline: "The number that became a brand — then a whole gifting empire.",
    narrative: "1-800-FLOWERS is the textbook case that a vanity phone number becomes a durable, self-marketing consumer brand. The mnemonic drove unaided recall and free brand equity, was ported to the web domain, and now anchors a house of brands — Harry & David, Cheryl's Cookies, Shari's Berries, PersonalizationMall, and more.",
    facts: [
      "The entire brand was built on the memorable toll-free number — the number IS the brand.",
      ">10 million customers served; ~74% of revenue from existing customers — a strong repeat base.",
      "Anchors a >$1.5B-revenue public company across three segments and a dozen+ brands.",
      "Proof a vanity number can scale into a multi-brand, publicly-traded gifting platform.",
    ],
    sources: [
      { label: "SEC — FY2025 10-K", url: "https://www.sec.gov/Archives/edgar/data/1084869/000108486925000017/flws-20250629.htm" },
      { label: "BusinessWire — FY2025 results", url: "https://www.businesswire.com/news/home/20250904202543/en/1-800-FLOWERS.COM-Inc.-Reports-Fiscal-2025-Fourth-Quarter-and-Year-End-Results" },
      { label: "Macrotrends — FLWS market cap", url: "https://www.macrotrends.net/stocks/charts/FLWS/1-800-flowerscom/market-cap" },
    ],
  },
  {
    slug: "contacts", name: "1-800 Contacts", ticker: "Private (KKR-owned)", isPublic: false,
    ownership: "Privately held — acquired by KKR in 2020 from AEA Investors. No public filings / no 10-K.",
    marketCap: ">$3.0B", marketCapNote: "enterprise value at the 2020 KKR acquisition (Bloomberg: '$3B-plus')",
    revenue: "~$700M–$1B+", revenueNote: "estimated at the 2020 transaction (private; low public data). Largest U.S. contact-lens retailer",
    aov: "~$250/yr spend", customerLtv: "~$1,000–$3,000", customerLtvMid: 2000, ltvBasis: "prescription-locked recurring consumable; 20M+ customers, high retention",
    tagline: "A category-owning vanity brand that changed hands in billion-dollar deals.",
    narrative: "The name IS the category and the purchase instruction. '1-800-CONTACTS' delivers near-zero-cost brand recall and direct-response memorability — customers don't search, they already know who to call. A prescription-locked, repeat-consumable model with in-house telemedicine keeps customers inside the funnel.",
    facts: [
      "Serial billion-dollar step-ups: ~$340M (2007) → ~$900M (WellPoint, 2012) → $3B+ (KKR, 2020).",
      "Changed hands five times, each at a higher valuation — with blue-chip owners (WellPoint, THL, AEA, KKR).",
      "Largest U.S. contact-lens retailer; 20M+ customers; top-100 U.S. e-commerce player.",
      "The vanity number is the moat — a marketing asset that compounds and can't be replicated.",
    ],
    sources: [
      { label: "KKR / PRNewswire — 2020 acquisition (20M+ customers)", url: "https://www.prnewswire.com/news-releases/kkr-to-acquire-dtc-pioneer-1-800-contacts-from-aea-investors-301136355.html" },
      { label: "Bloomberg — KKR buys 1-800 Contacts, $3B+", url: "https://www.bloomberg.com/news/articles/2020-09-23/kkr-buys-1-800-contacts-from-aea-in-3-billion-plus-deal" },
      { label: "ValueWalk — 2012 WellPoint $900M; 2007 Fenway $340M", url: "https://www.valuewalk.com/2012/06/1-800-contacts-sold-to-wellpoint-for-900-million/" },
    ],
  },
  {
    slug: "got-junk", name: "1-800-GOT-JUNK? (O2E Brands)", ticker: "Private", isPublic: false,
    ownership: "Privately held by founder Brian Scudamore via O2E Brands. No public filings / no 10-K.",
    marketCap: "n/a (private)", marketCapNote: "no disclosed enterprise valuation; press has framed it as a potential billion-dollar business",
    revenue: "~$300M+", revenueNote: "system-wide (reported ~2018–2020); founder has referenced approaching ~$600M (mixed CAD/aspirational)",
    aov: "~$240/job", customerLtv: "~$300–$600", customerLtvMid: 450, ltvBasis: "episodic, event-driven jobs (moves, cleanouts); low repeat frequency",
    tagline: "Proof the number can BE the business model.",
    narrative: "Founded as 'The Rubbish Boys' in 1989; the pivotal move was acquiring the vanity number 1-800-GOT-JUNK? in 1998 and renaming the company after it. Painted on every truck, the fleet became rolling billboards and the memorable number became the entire top-of-funnel — franchising to other cities began within a year of the rename.",
    facts: [
      "A single vanity number + truck-as-billboard is the whole marketing engine — near-zero marginal cost, decades durable.",
      "~120–160 franchise locations across the U.S., Canada, and Australia; 1,000+ trucks.",
      "'World's largest junk removal service' — 4.98★ across 724,000+ reviews (brand trust as the asset).",
      "The 1998 number purchase is directly credited with unlocking franchising and national scale.",
    ],
    sources: [
      { label: "RingCentral — the vanity number pays off", url: "https://www.ringcentral.com/us/en/blog/800-vanity-number-pays-off-for-1-800-got-junk/" },
      { label: "CNBC — eyeing a billion-dollar business", url: "https://www.cnbc.com/2020/08/01/how-the-1-800-got-junk-founder-became-a-multimillionaire.html" },
      { label: "Wikipedia — 1-800-GOT-JUNK?", url: "https://en.wikipedia.org/wiki/1-800-GOT-JUNK%3F" },
    ],
  },
  {
    slug: "petmeds", name: "PetMed Express, Inc. (1-800-PetMeds)", ticker: "NASDAQ: PETS", isPublic: true,
    tenK: "https://www.sec.gov/Archives/edgar/data/0001040130/000104013026000019/pets-20260331.htm", tenKLabel: "FY2026 Form 10-K (SEC EDGAR)",
    marketCap: "~$40M", marketCapNote: "distressed micro-cap (mid-2026); going-concern flag, dividend suspended",
    revenue: "$179.0M", revenueNote: "FY2026 (ended March 31, 2026), down ~21% YoY; $57.3M net loss; heavy pressure from Chewy & Amazon",
    aov: "~$97", customerLtv: "~$850–$1,700", customerLtvMid: 1100, ltvBasis: "subscription-heavy (~56% AutoShip); LTV pressured by falling reorders",
    tagline: "The original 'call for pet meds' — a cautionary legacy of the model.",
    narrative: "The vanity number 1-800-PetMeds made it the category-defining pet-pharmacy name before Chewy or Amazon existed — free, permanent top-of-funnel recall. Today it's a distressed micro-cap, which is precisely why it matters as a comparable: the number is still the durable asset even as the business contracts.",
    facts: [
      "The vanity number remains the moat — legacy brand equity and mnemonic recall — even in decline.",
      "~56% of sales are recurring (AutoShip) — a genuine subscription base built off the number.",
      "FY2026 carries a going-concern disclosure; dividend suspended — a cautionary benchmark, not a healthy one.",
      "Shows both the power and the fragility of a vanity brand without a defensible, high-LTV market underneath it.",
    ],
    sources: [
      { label: "SEC — FY2026 10-K", url: "https://www.sec.gov/Archives/edgar/data/0001040130/000104013026000019/pets-20260331.htm" },
      { label: "GlobeNewswire — FY2026 results", url: "https://www.globenewswire.com/news-release/2026/06/02/3305585/10002/en/petmeds-announces-fourth-quarter-and-fiscal-year-2026-financial-results.html" },
    ],
  },
];
export const compBySlug = (s: string) => COMPS.find((c) => c.slug === s) || null;
