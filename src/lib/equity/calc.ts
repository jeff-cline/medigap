// The maths behind the account-area calculators.
//
// Pure functions, no rounding games, and every assumption named. The point of
// these tools is that a homeowner can see what each option actually costs —
// including the case where the equity agreement is the more expensive one.
// A comparison that always favours the product being sold is not a tool, it is
// a brochure, and nobody trusts it twice.

export type LoanQuote = {
  /** Amount borrowed, in cents. */
  principalCents: number;
  /** Annual rate as a percentage, e.g. 8.5 */
  annualRatePct: number;
  /** Term in years. */
  years: number;
};

export type LoanResult = {
  monthlyPaymentCents: number;
  totalPaidCents: number;
  totalInterestCents: number;
};

/** Standard amortising payment. Zero-rate handled so it does not divide by zero. */
export function amortise(q: LoanQuote): LoanResult {
  const n = Math.max(1, Math.round(q.years * 12));
  const r = q.annualRatePct / 100 / 12;
  const p = Math.max(0, q.principalCents);

  const monthly = r === 0 ? p / n : (p * r) / (1 - Math.pow(1 + r, -n));
  const monthlyPaymentCents = Math.round(monthly);
  const totalPaidCents = monthlyPaymentCents * n;
  return {
    monthlyPaymentCents,
    totalPaidCents,
    totalInterestCents: Math.max(0, totalPaidCents - p),
  };
}

export type AgreementQuote = {
  /** Cash received today, in cents. */
  advanceCents: number;
  /** Home value at the start, in cents. */
  homeValueCents: number;
  /** The investor's share of value at settlement, as a percentage. */
  sharePct: number;
  /** Assumed annual home appreciation, as a percentage. */
  appreciationPct: number;
  /** Years until settlement. */
  years: number;
  /**
   * Many agreements set the share against an agreed starting value below the
   * appraisal — a "risk adjustment" — which increases what is owed. Expressed
   * as a percentage discount applied to the starting value. 0 = none.
   */
  riskAdjustmentPct?: number;
};

export type AgreementResult = {
  futureHomeValueCents: number;
  /** The value the investor's share is calculated against. */
  basisCents: number;
  settlementCents: number;
  /** Settlement minus the cash received — the cost of the money. */
  costCents: number;
  /** That cost expressed as a simple annualised rate, for comparison only. */
  impliedAnnualPct: number;
};

export function agreementCost(q: AgreementQuote): AgreementResult {
  const years = Math.max(0, q.years);
  const growth = Math.pow(1 + q.appreciationPct / 100, years);
  const futureHomeValueCents = Math.round(q.homeValueCents * growth);

  // The risk adjustment lowers the starting value, which raises the investor's
  // share of the finish. It is the single least-understood term in these
  // agreements, which is exactly why it is a visible input here.
  const adj = Math.max(0, Math.min(90, q.riskAdjustmentPct ?? 0));
  const adjustedStart = q.homeValueCents * (1 - adj / 100);
  const basisCents = Math.round(adjustedStart * growth);

  const settlementCents = Math.round(basisCents * (q.sharePct / 100));
  const costCents = settlementCents - q.advanceCents;

  // Simple annualised equivalent so the two options can be put side by side.
  // Not an APR and not a regulated figure — labelled as an approximation
  // wherever it is displayed.
  let impliedAnnualPct = 0;
  if (q.advanceCents > 0 && years > 0 && settlementCents > 0) {
    impliedAnnualPct = (Math.pow(settlementCents / q.advanceCents, 1 / years) - 1) * 100;
  }

  return {
    futureHomeValueCents,
    basisCents,
    settlementCents,
    costCents,
    impliedAnnualPct: Math.round(impliedAnnualPct * 100) / 100,
  };
}

/**
 * How much equity is theoretically reachable while keeping a cushion.
 *
 * Providers almost always require the homeowner to retain a meaningful stake.
 * 20% retained is the common convention and matches how "tappable equity" is
 * defined in the industry data.
 */
export function accessibleEquity(opts: {
  homeValueCents: number;
  mortgageBalanceCents: number;
  retainedPct?: number;
}) {
  const retained = opts.retainedPct ?? 20;
  const ceiling = opts.homeValueCents * (1 - retained / 100);
  const raw = ceiling - opts.mortgageBalanceCents;
  return {
    totalEquityCents: Math.max(0, opts.homeValueCents - opts.mortgageBalanceCents),
    accessibleCents: Math.max(0, Math.round(raw)),
    retainedPct: retained,
    /** Loan-to-value as things stand today. */
    currentLtvPct: opts.homeValueCents > 0
      ? Math.round((opts.mortgageBalanceCents / opts.homeValueCents) * 1000) / 10
      : 0,
  };
}

/** Break-even appreciation: above this, the agreement costs more than the loan. */
export function breakEvenAppreciation(opts: {
  advanceCents: number; homeValueCents: number; sharePct: number;
  years: number; riskAdjustmentPct?: number; loanTotalPaidCents: number;
}): number | null {
  const { advanceCents, homeValueCents, sharePct, years } = opts;
  if (advanceCents <= 0 || homeValueCents <= 0 || sharePct <= 0 || years <= 0) return null;

  const adj = Math.max(0, Math.min(90, opts.riskAdjustmentPct ?? 0));
  const start = homeValueCents * (1 - adj / 100);
  // Settlement equals what the loan would have cost in total.
  const targetSettlement = opts.loanTotalPaidCents;
  const requiredBasis = targetSettlement / (sharePct / 100);
  const growthNeeded = requiredBasis / start;
  if (growthNeeded <= 0) return null;

  const annual = (Math.pow(growthNeeded, 1 / years) - 1) * 100;
  return Math.round(annual * 100) / 100;
}
