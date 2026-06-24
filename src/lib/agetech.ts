// Illustrative economic model for the Rocketship AgeTech investor experience.
// IMPORTANT: every number here is an ILLUSTRATIVE ASSUMPTION the investor can edit —
// not historical performance and not a forecast. The UI labels it as such.

// ---- Demographics (Section 1) — U.S. Census-style cohort sizes (approx, illustrative) ----
export const COHORTS = [
  { key: "55-64", label: "Age 55–64", millions: 42, blurb: "Pre-retirement planning & wealth peak" },
  { key: "65-74", label: "Age 65–74", millions: 38, blurb: "Medicare onboarding & active retirement" },
  { key: "75-84", label: "Age 75–84", millions: 24, blurb: "Healthcare intensity & housing decisions" },
  { key: "85+", label: "Age 85+", millions: 7, blurb: "Care, longevity & estate transition" },
] as const;

export const TURNING_65_PER_DAY = 10000;

// ---- Ecosystem nodes (Section 2) ----
export type EcoNode = { id: string; label: string; group: "core" | "health" | "finance" | "living" | "platform"; revenue: string };
export const ECOSYSTEM: EcoNode[] = [
  { id: "rocketship", label: "Rocketship", group: "core", revenue: "The trusted relationship layer connecting every pathway." },
  { id: "medicare", label: "Medicare", group: "health", revenue: "Lead-gen + per-call + carrier partnerships at the #1 entry point." },
  { id: "insurance", label: "Insurance", group: "health", revenue: "Supplemental, life & final-expense commissions." },
  { id: "housing", label: "Senior Housing", group: "living", revenue: "Placement fees & sponsored inventory." },
  { id: "ltc", label: "Long-Term Care", group: "health", revenue: "Care matching & referral economics." },
  { id: "biotech", label: "Biotech", group: "health", revenue: "Longevity & therapeutics partner channels." },
  { id: "genetic", label: "Genetic Testing", group: "health", revenue: "Screening partnerships & data enrichment." },
  { id: "regen", label: "Regenerative Medicine", group: "health", revenue: "High-value longevity service referrals." },
  { id: "financial", label: "Financial Services", group: "finance", revenue: "Annuities, planning & estate referrals." },
  { id: "caregiving", label: "Caregiving", group: "living", revenue: "In-home & family caregiver marketplaces." },
  { id: "travel", label: "Travel", group: "living", revenue: "Active-retiree travel & experiences." },
  { id: "realestate", label: "Real Estate", group: "living", revenue: "Downsizing, reverse-mortgage & relocation." },
  { id: "ecommerce", label: "E-Commerce", group: "living", revenue: "Recurring senior-essentials commerce." },
  { id: "acquisitions", label: "Acquisitions", group: "platform", revenue: "Accretive roll-ups feeding the whole ecosystem." },
  { id: "data", label: "Data Platform", group: "platform", revenue: "First-party data & predictive scoring moat." },
  { id: "demand", label: "Demand Engine", group: "platform", revenue: "Owned acquisition & re-monetization machine." },
];

// ---- Lifetime value journey (Section 4) — illustrative per-stage gross profit ($) ----
export const LTV_JOURNEY = [
  { age: 64, stage: "Researching Medicare", value: 180 },
  { age: 66, stage: "Insurance products", value: 420 },
  { age: 68, stage: "Financial services", value: 900 },
  { age: 70, stage: "Genetic testing", value: 1300 },
  { age: 72, stage: "Longevity services", value: 2100 },
  { age: 75, stage: "Housing decisions", value: 3400 },
  { age: 80, stage: "Caregiving", value: 5200 },
  { age: 85, stage: "Estate planning", value: 6400 },
] as const;

export function cumulativeLtv() {
  let sum = 0;
  return LTV_JOURNEY.map((s) => { sum += s.value; return { ...s, cumulative: sum }; });
}

// ---- Value Creation Calculator (Section 5) ----
export type CalcInputs = { customers: number; acquisitions: number; partners: number; avgLtv: number; crossSellRate: number; partnerRevPerCustomer: number };
export const CALC_DEFAULTS: CalcInputs = { customers: 500000, acquisitions: 4, partners: 12, avgLtv: 1400, crossSellRate: 0.28, partnerRevPerCustomer: 22 };

export type CalcOutputs = { projectedRevenue: number; projectedCustomerValue: number; crossSell: number; partnerRevenue: number; portfolioImpact: number; enterpriseValue: number };

// Pure, transparent math so assumptions are explainable to institutional investors.
export function runCalc(i: CalcInputs): CalcOutputs {
  const acqCustomerMultiplier = 1 + i.acquisitions * 0.12;        // each acquisition expands the base
  const effectiveCustomers = i.customers * acqCustomerMultiplier;
  const baseRevenue = effectiveCustomers * i.avgLtv;
  const crossSell = baseRevenue * i.crossSellRate;
  const partnerRevenue = effectiveCustomers * i.partnerRevPerCustomer * (1 + i.partners * 0.03);
  const projectedRevenue = baseRevenue + crossSell + partnerRevenue;
  const projectedCustomerValue = projectedRevenue / Math.max(1, effectiveCustomers);
  const portfolioImpact = projectedRevenue * (i.acquisitions > 0 ? 0.18 + i.acquisitions * 0.02 : 0);
  const enterpriseValue = (projectedRevenue + portfolioImpact) * REV_MULTIPLE;
  return { projectedRevenue, projectedCustomerValue, crossSell, partnerRevenue, portfolioImpact, enterpriseValue };
}
export const REV_MULTIPLE = 4.5; // illustrative EV / revenue multiple for an AgeTech platform

// ---- Acquisition targets (Section 9 portfolio simulator) ----
export type Target = { id: string; name: string; sector: string; customers: number; revenue: number; dataScore: number; partners: number };
export const TARGETS: Target[] = [
  { id: "medsupp", name: "MedSupp Direct", sector: "Insurance", customers: 220000, revenue: 38_000_000, dataScore: 8, partners: 5 },
  { id: "havenliving", name: "Haven Senior Living", sector: "Housing", customers: 60000, revenue: 52_000_000, dataScore: 6, partners: 9 },
  { id: "genelong", name: "GeneLong Labs", sector: "Genetic/Longevity", customers: 95000, revenue: 24_000_000, dataScore: 10, partners: 4 },
  { id: "carebridge", name: "CareBridge Network", sector: "Caregiving", customers: 140000, revenue: 30_000_000, dataScore: 7, partners: 12 },
  { id: "silverwealth", name: "SilverWealth Advisors", sector: "Financial", customers: 80000, revenue: 46_000_000, dataScore: 9, partners: 6 },
  { id: "wanderwell", name: "WanderWell Travel", sector: "Travel", customers: 110000, revenue: 18_000_000, dataScore: 5, partners: 8 },
];

export type PortfolioInputs = { baseCustomers: number; baseRevenue: number; selected: string[] };
export function runPortfolio(input: PortfolioInputs) {
  const picks = TARGETS.filter((t) => input.selected.includes(t.id));
  const addedCustomers = picks.reduce((s, t) => s + t.customers, 0);
  const directRevenue = picks.reduce((s, t) => s + t.revenue, 0);
  const totalCustomers = input.baseCustomers + addedCustomers;
  // Cross-sell synergy: existing + acquired customers become reachable across all sectors.
  const sectors = new Set(picks.map((t) => t.sector)).size;
  const crossSell = totalCustomers * 14 * sectors * 0.5;
  const dataAsset = picks.reduce((s, t) => s + t.dataScore, 0);
  const partnerRevenue = picks.reduce((s, t) => s + t.partners, 0) * totalCustomers * 0.4;
  const synergy = (directRevenue + crossSell) * (picks.length > 1 ? 0.08 * picks.length : 0);
  const totalRevenue = input.baseRevenue + directRevenue + crossSell + partnerRevenue + synergy;
  const enterpriseValue = totalRevenue * REV_MULTIPLE;
  return { picks: picks.length, addedCustomers, totalCustomers, directRevenue, crossSell, dataAsset, partnerRevenue, synergy, totalRevenue, enterpriseValue };
}

// ---- "What If?" investor simulator (special feature) ----
export type WhatIfInputs = { acquisitions: number; customerGrowthPct: number; partnerGrowthPct: number; revenuePerCustomer: number };
export const WHATIF_DEFAULTS: WhatIfInputs = { acquisitions: 6, customerGrowthPct: 35, partnerGrowthPct: 50, revenuePerCustomer: 1400 };
export function runWhatIf(i: WhatIfInputs, baseCustomers = 500000) {
  const customers = Math.round(baseCustomers * (1 + i.customerGrowthPct / 100) * (1 + i.acquisitions * 0.1));
  const partners = Math.round(12 * (1 + i.partnerGrowthPct / 100) + i.acquisitions);
  const revenue = customers * i.revenuePerCustomer * (1 + partners * 0.01);
  const portfolio = revenue * (0.15 + i.acquisitions * 0.03);
  const enterpriseValue = (revenue + portfolio) * REV_MULTIPLE;
  return { customers, partners, revenue, portfolio, enterpriseValue };
}

// ---- Roadmap (Section 11) ----
export const ROADMAP = [
  { horizon: "1 Year", points: ["Consolidate the Medicare demand engine", "Launch the unified data platform", "First 2–3 accretive acquisitions", "Institutional data governance"] },
  { horizon: "3 Year", points: ["10+ ecosystem verticals live", "Predictive lifecycle scoring at scale", "Partner revenue becomes a primary line", "Repeatable acquisition playbook"] },
  { horizon: "5 Year", points: ["Category-defining AgeTech platform", "Cross-sell across the full lifetime journey", "Portfolio compounding flywheel proven", "Strategic / private-credit optionality"] },
  { horizon: "10 Year", points: ["The trusted infrastructure for the aging economy", "Decades-long monetized relationships", "Durable data & distribution moat", "Multiple exit / continuation pathways"] },
] as const;

export const fmtUsd = (n: number) => {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
};
export const fmtNum = (n: number) => Math.round(n).toLocaleString("en-US");
