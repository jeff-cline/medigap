// AD&D Mortgage (Accident Life Insurance for Mortgages) — monthly proforma, 10 years.
// Ramp 0 → 1,000 new policies/month over 24 months, then steady. Each policy: $100/yr
// premium, 35% commission/yr (recurring), 6-year (72-month) life, plus a one-time $250
// marketing fee per new policy (partner-paid). Commission is the profit. Illustrative.

export const RAMP_MONTHS = 24;
export const PEAK_PER_MONTH = 1000;
// Bootstrapped Q1/Q2: low early volume (months 1–6), then profits fund systematic scaling to peak.
export const EARLY_RAMP = [2, 15, 30, 50, 70, 100];
export const ANNUAL_PREMIUM = 100;
export const COMMISSION_RATE = 0.35;          // → $35 / yr per active policy
export const POLICY_LIFE_MONTHS = 72;         // 6 years
export const MARKETING_FEE = 250;             // one-time per new policy (partner pays)
export const PROJECTION_MONTHS = 120;         // 10 years

export const monthlyCommissionPerPolicy = (ANNUAL_PREMIUM * COMMISSION_RATE) / 12; // ~$2.917

// New policies sold in a 1-based month. Months 1–6 are the explicit bootstrapped ramp
// (funded from cash); from month 7 we scale systematically from 100 → 1,000 by month 24
// (using business profits), then hold steady at the peak.
export function newPoliciesInMonth(m: number): number {
  if (m <= 0) return 0;
  if (m <= EARLY_RAMP.length) return EARLY_RAMP[m - 1];
  if (m >= RAMP_MONTHS) return PEAK_PER_MONTH;
  const last = EARLY_RAMP[EARLY_RAMP.length - 1]; // 100 at month 6
  const step = (PEAK_PER_MONTH - last) / (RAMP_MONTHS - EARLY_RAMP.length); // (1000-100)/18 = 50
  return Math.min(PEAK_PER_MONTH, Math.round(last + step * (m - EARLY_RAMP.length)));
}

export type MonthRow = {
  month: number; year: number; monthOfYear: number;
  newPolicies: number; activePolicies: number; cumPolicies: number;
  marketingFee: number; commission: number; totalIncome: number;
};

export function monthlyModel(months = PROJECTION_MONTHS): MonthRow[] {
  const newByMonth: number[] = [];
  for (let m = 1; m <= months; m++) newByMonth.push(newPoliciesInMonth(m));

  const rows: MonthRow[] = [];
  let cum = 0;
  for (let m = 1; m <= months; m++) {
    const nw = newByMonth[m - 1];
    cum += nw;
    // active = policies sold within the last POLICY_LIFE_MONTHS (inclusive of this month)
    let active = 0;
    for (let k = Math.max(1, m - POLICY_LIFE_MONTHS + 1); k <= m; k++) active += newByMonth[k - 1];
    const marketingFee = nw * MARKETING_FEE;
    const commission = active * monthlyCommissionPerPolicy;
    rows.push({
      month: m, year: Math.ceil(m / 12), monthOfYear: ((m - 1) % 12) + 1,
      newPolicies: nw, activePolicies: active, cumPolicies: cum,
      marketingFee, commission, totalIncome: marketingFee + commission,
    });
  }
  return rows;
}

export type YearRow = {
  year: number; newPolicies: number; activeEnd: number;
  marketingFee: number; commission: number; totalIncome: number; cumIncome: number;
};

// Pivot the monthly model to a 10-year annual projection.
export function annualModel(months = PROJECTION_MONTHS): YearRow[] {
  const rows = monthlyModel(months);
  const years = Math.ceil(months / 12);
  const out: YearRow[] = [];
  let cumIncome = 0;
  for (let y = 1; y <= years; y++) {
    const yr = rows.filter((r) => r.year === y);
    const marketingFee = yr.reduce((a, r) => a + r.marketingFee, 0);
    const commission = yr.reduce((a, r) => a + r.commission, 0);
    const totalIncome = marketingFee + commission;
    cumIncome += totalIncome;
    out.push({
      year: y,
      newPolicies: yr.reduce((a, r) => a + r.newPolicies, 0),
      activeEnd: yr[yr.length - 1]?.activePolicies ?? 0,
      marketingFee, commission, totalIncome, cumIncome,
    });
  }
  return out;
}

export const fmtUsd = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
};
export const fmtUsd0 = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const fmtNum = (n: number) => Math.round(n).toLocaleString("en-US");
