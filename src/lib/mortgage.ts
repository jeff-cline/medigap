// Illustrative mortgage proforma for "Mortgage Plus" — the R0cketShip lending engine.
// THESIS: R0cketShip already owns the trusted 65+ relationship + data, so it originates
// mortgage volume (reverse/HECM, refi, purchase) at a structural CAC advantage. Every
// number here is an EDITABLE ILLUSTRATIVE assumption — not historical and not a forecast.

export type ProformaInputs = {
  monthlyLeads: number;      // qualified mortgage leads from the owned audience
  conversionPct: number;     // lead → funded loan
  avgLoanSize: number;       // $ per loan (drives origination volume)
  revenuePerLoan: number;    // $ gain-on-sale + lender fees + ancillary per funded loan
  cacPerLead: number;        // $ acquisition cost per lead (low — owned audience)
  fulfillmentPerLoan: number;// $ processing / fulfillment per funded loan
  fixedOpexAnnual: number;   // $ fixed annual opex (platform, compliance, staff)
};

export const PROFORMA_DEFAULTS: ProformaInputs = {
  monthlyLeads: 4000,
  conversionPct: 0.04,
  avgLoanSize: 340000,
  revenuePerLoan: 9500,
  cacPerLead: 12,
  fulfillmentPerLoan: 3800,
  fixedOpexAnnual: 7000000,
};

export type ProformaOutputs = {
  fundedLoans: number;
  originationVolume: number;
  grossRevenue: number;
  acquisitionCost: number;
  fulfillmentCost: number;
  totalCost: number;
  ebitda: number;
  ebitdaMargin: number;
  revenuePerLead: number;
};

// Transparent, explainable math (institutional readers will check it).
export function runProforma(i: ProformaInputs): ProformaOutputs {
  const annualLeads = i.monthlyLeads * 12;
  const fundedLoans = Math.round(annualLeads * i.conversionPct);
  const originationVolume = fundedLoans * i.avgLoanSize;
  const grossRevenue = fundedLoans * i.revenuePerLoan;
  const acquisitionCost = annualLeads * i.cacPerLead;
  const fulfillmentCost = fundedLoans * i.fulfillmentPerLoan;
  const totalCost = acquisitionCost + fulfillmentCost + i.fixedOpexAnnual;
  const ebitda = grossRevenue - totalCost;
  return {
    fundedLoans, originationVolume, grossRevenue, acquisitionCost, fulfillmentCost, totalCost,
    ebitda, ebitdaMargin: grossRevenue > 0 ? ebitda / grossRevenue : 0,
    revenuePerLead: annualLeads > 0 ? grossRevenue / annualLeads : 0,
  };
}

// 5-year ramp — leads + conversion scale as the owned audience + data engine matures.
export const RAMP_PLAN: { year: string; monthlyLeads: number; conversionPct: number; fixedOpexAnnual: number }[] = [
  { year: "Year 1", monthlyLeads: 4000, conversionPct: 0.04, fixedOpexAnnual: 7000000 },
  { year: "Year 2", monthlyLeads: 6000, conversionPct: 0.045, fixedOpexAnnual: 8000000 },
  { year: "Year 3", monthlyLeads: 9000, conversionPct: 0.05, fixedOpexAnnual: 9000000 },
  { year: "Year 4", monthlyLeads: 13000, conversionPct: 0.055, fixedOpexAnnual: 10000000 },
  { year: "Year 5", monthlyLeads: 18000, conversionPct: 0.06, fixedOpexAnnual: 11000000 },
];

export function rampProjection(base: ProformaInputs = PROFORMA_DEFAULTS) {
  return RAMP_PLAN.map((r) => {
    const o = runProforma({ ...base, monthlyLeads: r.monthlyLeads, conversionPct: r.conversionPct, fixedOpexAnnual: r.fixedOpexAnnual });
    return { year: r.year, fundedLoans: o.fundedLoans, volume: o.originationVolume, revenue: o.grossRevenue, ebitda: o.ebitda };
  });
}

// ---------------------------------------------------------------------------
// FULL PROFORMA — 3 product lines × 5 years, for the detailed P&L + pivot tables.
// Illustrative; product mix & economics are editable assumptions.
// ---------------------------------------------------------------------------
export type Product = { key: string; name: string; avgLoan: number; revPerLoan: number; fulfillPerLoan: number; units: number[] };
export const PRODUCTS: Product[] = [
  { key: "reverse", name: "Reverse / HECM", avgLoan: 200000, revPerLoan: 12000, fulfillPerLoan: 4200, units: [600, 1100, 2000, 3300, 5200] },
  { key: "refi", name: "Refinance", avgLoan: 320000, revPerLoan: 8000, fulfillPerLoan: 3600, units: [720, 1200, 1900, 2900, 4200] },
  { key: "purchase", name: "Purchase", avgLoan: 410000, revPerLoan: 9000, fulfillPerLoan: 3900, units: [600, 940, 1500, 2380, 3560] },
];
export const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];
export const LEADS_BY_YEAR = [48000, 72000, 108000, 156000, 216000]; // annual qualified mortgage leads
export const CAC_PER_LEAD = 12;

// Accidental Mortgage Protection (AMP) — insurance sold 1:1 with each mortgage.
export const AMP_ATTACH = 0.6;            // share of mortgages that also buy AMP
export const AMP_ANNUAL_PREMIUM = 600;    // $ premium / yr (illustrative — price TBD by carrier)
export const AMP_COMMISSION = 0.35;       // founder's commission share
export const AMP_LIFE_YEARS = 7;          // policy stays in force ~5–10 yrs → recurring commission
export const STIPEND_PER_LOAN = 250;      // $ marketing stipend earned per funded mortgage (1:1)

// SaaS operating-expense rates (% of revenue), declining as the platform scales.
export const SM_RATE = [0.20, 0.18, 0.16, 0.14, 0.12];   // Sales & Marketing (traditional rate)
export const RND_RATE = [0.14, 0.12, 0.11, 0.10, 0.09];  // Research & Development
export const GA_RATE = [0.12, 0.11, 0.10, 0.09, 0.08];   // General & Administrative

export type PnlRow = { label: string; kind: "rev" | "subtotal" | "cost" | "total" | "metric" | "section"; values: number[]; indent?: boolean };
export type Series = { years: string[]; mortgageIncome: number[]; insuranceIncome: number[]; totalRevenue: number[]; ebitda: number[]; mortgageUnits: number[]; insuranceUnits: number[] };

// Build the full 5-year SaaS-style P&L (years as columns) + chart series + product pivot.
export function fullProforma(): { rows: PnlRow[]; byProduct: { name: string; units: number; volume: number; revenue: number; ebitdaContribution: number }[]; series: Series } {
  const yrs = YEARS.length;
  const z = () => new Array(yrs).fill(0);

  // --- units ---
  const fundedLoans = z(), originationVol = z(), fulfill = z();
  for (const p of PRODUCTS) p.units.forEach((u, i) => { fundedLoans[i] += u; originationVol[i] += u * p.avgLoan; fulfill[i] += u * p.fulfillPerLoan; });
  const ampNew = fundedLoans.map((f) => Math.round(f * AMP_ATTACH));
  let inForce = 0; const ampActive = ampNew.map((n) => { inForce += n; return inForce; }); // 7-yr life > 5-yr window → accumulates

  // --- revenue lines ---
  const stipend = fundedLoans.map((f) => f * STIPEND_PER_LOAN);
  const ampRev = ampActive.map((a) => a * AMP_ANNUAL_PREMIUM * AMP_COMMISSION);
  const prodRev = PRODUCTS.map((p) => p.units.map((u) => u * p.revPerLoan));
  const mortgageIncome = z().map((_, i) => prodRev.reduce((a, r) => a + r[i], 0) + stipend[i]);
  const insuranceIncome = ampRev.slice();
  const totalRev = z().map((_, i) => mortgageIncome[i] + insuranceIncome[i]);

  // --- expenses (SaaS) ---
  const cac = LEADS_BY_YEAR.map((l) => l * CAC_PER_LEAD);
  const sm = totalRev.map((r, i) => r * SM_RATE[i] + cac[i]); // marketing + borrower acquisition
  const rnd = totalRev.map((r, i) => r * RND_RATE[i]);
  const ga = totalRev.map((r, i) => r * GA_RATE[i]);
  const grossProfit = totalRev.map((r, i) => r - fulfill[i]);
  const totalOpex = z().map((_, i) => sm[i] + rnd[i] + ga[i]);
  const ebitda = grossProfit.map((g, i) => g - totalOpex[i]);

  const rows: PnlRow[] = [
    { label: "INCOME", kind: "section", values: z() },
    ...PRODUCTS.map((p, idx) => ({ label: `${p.name} revenue`, kind: "rev" as const, indent: true, values: prodRev[idx] })),
    { label: `Marketing stipend ($${STIPEND_PER_LOAN} × loans)`, kind: "rev", indent: true, values: stipend },
    { label: "Mortgage income", kind: "subtotal", values: mortgageIncome },
    { label: `Accidental Mortgage Protection (${Math.round(AMP_COMMISSION * 100)}% comm.)`, kind: "rev", indent: true, values: ampRev },
    { label: "Insurance income", kind: "subtotal", values: insuranceIncome },
    { label: "Total revenue", kind: "total", values: totalRev },

    { label: "COST OF REVENUE", kind: "section", values: z() },
    { label: "Loan fulfillment", kind: "cost", indent: true, values: fulfill },
    { label: "Gross profit", kind: "total", values: grossProfit },
    { label: "Gross margin", kind: "metric", values: totalRev.map((r, i) => (r ? grossProfit[i] / r : 0)) },

    { label: "OPERATING EXPENSES", kind: "section", values: z() },
    { label: "Sales & Marketing (incl. CAC)", kind: "cost", indent: true, values: sm },
    { label: "Research & Development", kind: "cost", indent: true, values: rnd },
    { label: "General & Administrative", kind: "cost", indent: true, values: ga },
    { label: "Total operating expense", kind: "total", values: totalOpex },

    { label: "EBITDA", kind: "total", values: ebitda },
    { label: "EBITDA margin", kind: "metric", values: totalRev.map((r, i) => (r ? ebitda[i] / r : 0)) },

    { label: "UNITS", kind: "section", values: z() },
    { label: "Mortgage units (funded loans)", kind: "metric", values: fundedLoans },
    { label: "Insurance units — AMP sold", kind: "metric", values: ampNew },
    { label: "Insurance units — AMP in force", kind: "metric", values: ampActive },
    { label: "Origination volume", kind: "metric", values: originationVol },
  ];

  // pivot by line: 3 mortgage products + the stipend + AMP insurance (5-yr totals)
  const grossRevAll = totalRev.reduce((a, b) => a + b, 0);
  const totalEbitda = ebitda.reduce((a, b) => a + b, 0);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const byProduct = [
    ...PRODUCTS.map((p, idx) => ({ name: p.name, units: sum(p.units), volume: sum(p.units.map((u) => u * p.avgLoan)), revenue: sum(prodRev[idx]), ebitdaContribution: (sum(prodRev[idx]) / grossRevAll) * totalEbitda })),
    { name: "Marketing stipend", units: sum(fundedLoans), volume: 0, revenue: sum(stipend), ebitdaContribution: (sum(stipend) / grossRevAll) * totalEbitda },
    { name: "Insurance — AMP", units: ampActive[yrs - 1], volume: 0, revenue: sum(ampRev), ebitdaContribution: (sum(ampRev) / grossRevAll) * totalEbitda },
  ];

  const series: Series = { years: YEARS, mortgageIncome, insuranceIncome, totalRevenue: totalRev, ebitda, mortgageUnits: fundedLoans, insuranceUnits: ampActive };
  return { rows, byProduct, series };
}

export const fmtUsd = (n: number) => {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
};
export const fmtNum = (n: number) => Math.round(n).toLocaleString("en-US");
export const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
