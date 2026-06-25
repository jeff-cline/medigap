// THE SECRET WEAPON — Krystalore's executive advisory + Jeff's growth tech, as one package.
// PRICING: every price point is TRIPLED (Krystalore 1/3 · Jeff 1/3 · the business 1/3).

export type Audience = { key: string; label: string; headline: string; lead: string; pains: string[]; wins: string[] };

export const AUDIENCES: Audience[] = [
  {
    key: "executives", label: "For Executives",
    headline: "The man running the empire needs someone managing the man.",
    lead: "For the high-performing leader whose greatest competitive advantage — and greatest liability — is himself.",
    pains: ["You're the bottleneck and you know it", "The conversations that can't go through HR", "Drift between the man and the mission"],
    wins: ["A private advisor for your highest-stakes calls", "Command-level visibility over every asset", "A demand engine that compounds while you lead"],
  },
  {
    key: "politicians", label: "For Politicians",
    headline: "Your platform is only as strong as the operation behind it.",
    lead: "Message discipline, relationship intelligence, and reach — run with military precision.",
    pains: ["Reach that doesn't convert to support", "Relationships scattered, not tracked", "Optics and message drift under pressure"],
    wins: ["Relationship rolodex tied to strategy", "Predictive outreach that finds your people first", "A war-room dashboard over every metric that matters"],
  },
  {
    key: "startups", label: "For Startups",
    headline: "Move like a company 10× your size.",
    lead: "Founder performance plus proprietary growth tech that manufactures demand from day one.",
    pains: ["Founder is the single point of failure", "Burning cash for leads that don't convert", "No system — everything lives in your head"],
    wins: ["Founder clarity + decision pattern coaching", "12,000+ high-intent leads/month engine", "Your operating system, built around your KPIs"],
  },
  {
    key: "hnw", label: "For High Net Worth",
    headline: "Your time and reputation are the scarce assets.",
    lead: "Protect them, compound them, and optimize the person behind the portfolio.",
    pains: ["Too many ventures, not enough command visibility", "Privacy and discretion are non-negotiable", "The person is under-optimized vs. the portfolio"],
    wins: ["One dashboard across every venture & relationship", "Trauma-informed physical & mental performance", "Quiet, by-application-only, fully discreet"],
  },
  {
    key: "divorce", label: "For Divorce",
    headline: "Come out stronger, clearer, and in command.",
    lead: "A high-stakes life transition handled with strategy, somatic resilience, and protection of what matters.",
    pains: ["The most consequential decisions under the most stress", "Mind, body and business all taking the hit", "No trusted, neutral operator in your corner"],
    wins: ["Trauma-informed somatic support through it", "Clear-headed strategy for the decisions that count", "Protect your assets, relationships and momentum"],
  },
];

export const PILLARS = [
  ["01", "Team & Relationships", "People strategy, hiring, firing, culture, conflict — the conversations that can't go through HR."],
  ["02", "Mindset & Decisions", "Pattern recognition, blind spots, and mental clarity for your highest-stakes calls."],
  ["03", "Vision Architecture", "Quarterly recalibration that reconnects you to the mission before drift compounds."],
  ["04", "Physical Performance", "Somatic, trauma-informed body optimization — sleep, stress, energy, resilience."],
] as const;

export type Tier = { name: string; price: string; note: string; star?: boolean; group: string };
// All monthly/setup prices TRIPLED from the source rate card.
export const TIERS: Tier[] = [
  { group: "Inner Circle Retainer", name: "The Advisor", price: "$10,500/mo", note: "3-mo min · 2 sessions/month, async support" },
  { group: "Inner Circle Retainer", name: "The Inner Circle", price: "$22,500/mo", note: "3-mo min · weekly sessions, unlimited async, quarterly deep-dive", star: true },
  { group: "Inner Circle Retainer", name: "Executive Partner", price: "$54,000/mo", note: "6-mo min · unlimited + on-call, on-site, embedded advisory" },
  { group: "Growth Architecture", name: "Architecture Build", price: "$15,000", note: "one-time setup + 90-day onboarding" },
  { group: "Growth Architecture", name: "Architecture + Inner Circle", price: "$28,500/mo", note: "full integration — human performance + systems", star: true },
  { group: "Entry Points", name: "The Half-Day Intensive", price: "$7,500", note: "3.5-hr private session · fully credited toward any retainer" },
  { group: "Entry Points", name: "The 3-Day Immersion", price: "Custom", note: "Puerto Rico or on-site · all travel covered · credited toward retainer", star: true },
  { group: "Amplify", name: "Amplify Standalone", price: "Custom", note: "scoped to your growth objectives" },
  { group: "Amplify", name: "Inner Circle + Amplify", price: "$37,500/mo", note: "human performance + market amplification" },
  { group: "Amplify", name: "Full Stack — All Three", price: "$55,500/mo", note: "Inner Circle + Growth Architecture + Amplify", star: true },
];

export const TECH = [
  ["R0CKETSHIP", "12,000+ high-intent leads/month, ZIP-exclusive, 40+ verticals"],
  ["VRTCLS", "2.4B behavioral signals · 148M identity nodes · 92.4% conversion probability"],
  ["JEFF CLINE", "#1 growth dashboard — SEO, AEO, paid media · 4 dot-com exits · 30+ years"],
] as const;

export const PROOF = [
  ["12K+", "high-intent leads / month"],
  ["2.4B", "behavioral signals"],
  ["3.1×", "average ROAS lift"],
  ["58%", "lower cost per acquisition"],
  ["92.4%", "in-window conversion probability"],
  ["97.4%", "identity resolution accuracy"],
] as const;

export const CREDENTIALS = [
  "22-Yr U.S. Air Force Veteran", "200K+ Personnel Trained", "Pentagon Curriculum Author",
  "Certified Leadership + Somatic Coach", "Trauma-Informed", "28× Marathon + 50-Mile Ultra",
  "$4M+ Federal Programs Delivered", "Four Lenses Facilitator · PhD Candidate",
] as const;

// Full Stack monthly is the default investment in the calculator.
export const FULL_STACK_MONTHLY = 55500;
