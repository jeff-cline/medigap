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

export const fmtUsd = (n: number) => {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
};
export const fmtNum = (n: number) => Math.round(n).toLocaleString("en-US");
export const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
