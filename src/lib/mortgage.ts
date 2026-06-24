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
export const LEADS_BY_YEAR = [48000, 72000, 108000, 156000, 216000]; // annual qualified leads
export const CAC_PER_LEAD = 12;
export const FIXED_OPEX = [7000000, 8000000, 9000000, 10000000, 11000000];

export type PnlRow = { label: string; kind: "rev" | "cost" | "total" | "metric"; values: number[]; indent?: boolean };

// Build the full 5-year P&L (years as columns).
export function fullProforma(): { rows: PnlRow[]; byProduct: { name: string; units: number; volume: number; revenue: number; ebitdaContribution: number }[] } {
  const yrs = YEARS.length;
  const z = () => new Array(yrs).fill(0);

  const rows: PnlRow[] = [];
  // revenue by product
  const totalRev = z();
  for (const p of PRODUCTS) {
    const rev = p.units.map((u) => u * p.revPerLoan);
    rev.forEach((v, i) => (totalRev[i] += v));
    rows.push({ label: `${p.name} revenue`, kind: "rev", indent: true, values: rev });
  }
  rows.push({ label: "Total revenue", kind: "total", values: totalRev });

  // cost lines
  const cac = LEADS_BY_YEAR.map((l) => l * CAC_PER_LEAD);
  const fulfill = z();
  for (const p of PRODUCTS) p.units.forEach((u, i) => (fulfill[i] += u * p.fulfillPerLoan));
  rows.push({ label: "Borrower acquisition (CAC)", kind: "cost", indent: true, values: cac });
  rows.push({ label: "Loan fulfillment", kind: "cost", indent: true, values: fulfill });
  rows.push({ label: "Fixed operating expense", kind: "cost", indent: true, values: FIXED_OPEX.slice(0, yrs) });
  const totalCost = z().map((_, i) => cac[i] + fulfill[i] + FIXED_OPEX[i]);
  rows.push({ label: "Total cost", kind: "total", values: totalCost });

  // EBITDA + metrics
  const ebitda = totalRev.map((r, i) => r - totalCost[i]);
  rows.push({ label: "EBITDA", kind: "total", values: ebitda });
  rows.push({ label: "EBITDA margin", kind: "metric", values: totalRev.map((r, i) => (r > 0 ? ebitda[i] / r : 0)) });

  const totalUnits = z();
  const totalVol = z();
  for (const p of PRODUCTS) p.units.forEach((u, i) => { totalUnits[i] += u; totalVol[i] += u * p.avgLoan; });
  rows.push({ label: "Funded loans", kind: "metric", values: totalUnits });
  rows.push({ label: "Origination volume", kind: "metric", values: totalVol });

  // pivot: by product (5-yr totals)
  const totalEbitda = ebitda.reduce((a, b) => a + b, 0);
  const grossRevAll = totalRev.reduce((a, b) => a + b, 0);
  const byProduct = PRODUCTS.map((p) => {
    const units = p.units.reduce((a, b) => a + b, 0);
    const revenue = p.units.reduce((a, u) => a + u * p.revPerLoan, 0);
    const volume = p.units.reduce((a, u) => a + u * p.avgLoan, 0);
    // contribution = product gross margin share of total EBITDA (illustrative attribution)
    const ebitdaContribution = grossRevAll > 0 ? (revenue / grossRevAll) * totalEbitda : 0;
    return { name: p.name, units, volume, revenue, ebitdaContribution };
  });

  return { rows, byProduct };
}

export const fmtUsd = (n: number) => {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
};
export const fmtNum = (n: number) => Math.round(n).toLocaleString("en-US");
export const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
