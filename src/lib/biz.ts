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
