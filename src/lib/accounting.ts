import { db } from "./db";

// ---------------------------------------------------------------------------
// PARTNER PAYOUT ACCOUNTING
//
// Partners are paid on the 21st of each month for the revenue/commission
// rev-share they earned in the PRIOR calendar month (which ended on the last
// day of that month). Their statement nets:
//
//   affiliate rev-share earned       (credit — money we owe them)
//   − monthly territory seat fees     (debit)
//   − pay-per-call / lead charges     (debit)
//   + manual credits                  (credit)
//   ----------------------------------------------------------------
//   = NET PAYABLE on the 21st         (positive => we pay them; negative => they owe)
//
// Every number is itemized so it's spelled out in the partner's portal and in
// the God account.
// ---------------------------------------------------------------------------

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export type StatementLine = { label: string; amountCents: number; kind: "credit" | "debit" };

export type Statement = {
  userId: string;
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date; // last instant of the period (exclusive bound used internally)
  payDate: string; // YYYY-MM-DD — the 21st of the following month
  earnedCents: number;
  seatFeeCents: number;
  callSpendCents: number;
  creditCents: number;
  netCents: number;
  affiliateCount: number;
  lines: StatementLine[];
};

// Bounds of the calendar month that is `monthsAgo` months before `ref` (default: prior month).
export function monthBounds(ref: Date, monthsAgo = 1) {
  const y = ref.getFullYear();
  const m = ref.getMonth() - monthsAgo;
  const start = new Date(y, m, 1, 0, 0, 0, 0);
  const end = new Date(y, m + 1, 1, 0, 0, 0, 0); // exclusive
  return { start, end };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

// The 21st of the month AFTER the period ends.
export function payDateFor(periodEndExclusive: Date): string {
  const y = periodEndExclusive.getFullYear();
  const m = periodEndExclusive.getMonth(); // periodEnd is the 1st of the following month
  return `${y}-${pad(m + 1)}-21`;
}

export async function buildStatement(userId: string, start: Date, end: Date): Promise<Statement> {
  const [affLeads, seats, charges] = await Promise.all([
    db.affiliateLead.findMany({ where: { ownerId: userId, createdAt: { gte: start, lt: end } } }),
    db.agentSeat.findMany({ where: { agentId: userId, active: true } }),
    db.transaction.findMany({ where: { userId, createdAt: { gte: start, lt: end }, kind: { in: ["charge", "fee"] } } }),
  ]);

  const earnedCents = affLeads.reduce((s, a) => s + a.revShareCents, 0);
  const seatFeeCents = seats.reduce((s, x) => s + x.monthlyFeeCents, 0);
  const callSpendCents = charges.reduce((s, t) => s + Math.abs(t.amountCents), 0);

  // Manual credits explicitly granted to this partner in the period.
  const credits = await db.transaction.findMany({ where: { userId, createdAt: { gte: start, lt: end }, kind: "credit" } });
  const creditCents = credits.reduce((s, t) => s + Math.abs(t.amountCents), 0);

  const netCents = earnedCents + creditCents - seatFeeCents - callSpendCents;

  const lines: StatementLine[] = [
    { label: `Affiliate rev-share earned (${affLeads.length} lead${affLeads.length === 1 ? "" : "s"})`, amountCents: earnedCents, kind: "credit" },
  ];
  if (creditCents) lines.push({ label: "Account credits", amountCents: creditCents, kind: "credit" });
  if (seatFeeCents) lines.push({ label: `Territory seat fees (${seats.length} seat${seats.length === 1 ? "" : "s"})`, amountCents: seatFeeCents, kind: "debit" });
  if (callSpendCents) lines.push({ label: `Pay-per-call & lead charges (${charges.length})`, amountCents: callSpendCents, kind: "debit" });

  return {
    userId,
    periodLabel: `${MONTHS[start.getMonth()]} ${start.getFullYear()}`,
    periodStart: start,
    periodEnd: end,
    payDate: payDateFor(end),
    earnedCents,
    seatFeeCents,
    callSpendCents,
    creditCents,
    netCents,
    affiliateCount: affLeads.length,
    lines,
  };
}

// The statement for the prior calendar month, payable on the upcoming 21st.
export async function currentStatement(userId: string, ref: Date = new Date()): Promise<Statement> {
  const { start, end } = monthBounds(ref, 1);
  return buildStatement(userId, start, end);
}

// Prior-month statements for every partner-type account that has activity, for the God payouts page.
export async function allPartnerStatements(ref: Date = new Date()): Promise<(Statement & { name: string; email: string })[]> {
  const partners = await db.user.findMany({
    where: { role: { in: ["marketing_partner", "agent"] } },
    orderBy: { createdAt: "asc" },
  });
  const { start, end } = monthBounds(ref, 1);
  const out: (Statement & { name: string; email: string })[] = [];
  for (const p of partners) {
    const st = await buildStatement(p.id, start, end);
    // Only surface accounts with something to settle.
    if (st.earnedCents || st.seatFeeCents || st.callSpendCents || st.creditCents) {
      out.push({ ...st, name: p.name || p.email, email: p.email });
    }
  }
  return out;
}
