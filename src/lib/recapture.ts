import { db } from "./db";
import { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// MISSED-CALL RECAPTURE
//
// Old, expensive inbound-call data that never monetized. The model: cold
// outreach (SMS + email) bubbles these numbers back into the funnel —
//   missed → engaged (we messaged them) → clicked (CTA) → opted_in (form) → revenue.
// Every recaptured contact is notionally worth ACCESSIBLE_RECAPTURE_CENTS ($25)
// until it produces real revenue. We track that recapture value against the real
// cost of working the list (Twilio call cost + SMS + email sends).
// ---------------------------------------------------------------------------

export const ACCESSIBLE_RECAPTURE_CENTS = 2500; // $25 per recoverable contact
export const SMS_COST_CENTS = 1; // per outbound SMS (matches comms/send)
export const STAGES = ["missed", "engaged", "clicked", "opted_in", "revenue"] as const;
export type Stage = (typeof STAGES)[number];

const ORDER: Record<string, number> = { "": 0, missed: 1, engaged: 2, clicked: 3, opted_in: 4, revenue: 5 };

// A lead is "in the recapture program" if it carries a recaptureStage OR is tagged.
// We also treat any lead with a missed/short call as recapture-eligible.
export const RECAPTURE_WHERE: Prisma.LeadWhereInput = {
  OR: [
    { recaptureStage: { not: "" } },
    { tags: { contains: "chapter" } },
    { calls: { some: { OR: [{ status: { in: ["missed", "no-answer", "busy", "failed", "canceled"] } }, { durationSec: { lt: 20 } }] } } },
  ],
};

// Only advance forward — never demote a lead that already progressed.
export async function promoteStage(leadId: string, stage: Stage) {
  const lead = await db.lead.findUnique({ where: { id: leadId }, select: { recaptureStage: true } });
  if (!lead) return;
  if ((ORDER[stage] ?? 0) <= (ORDER[lead.recaptureStage] ?? 0)) return;
  const data: Prisma.LeadUpdateInput = { recaptureStage: stage };
  if (stage === "engaged") data.engagedAt = new Date();
  if (stage === "clicked") data.clickedAt = new Date();
  if (stage === "opted_in") data.optedInAt = new Date();
  await db.lead.update({ where: { id: leadId }, data }).catch(() => {});
}

export function parseTags(json: string): string[] {
  try { const a = JSON.parse(json || "[]"); return Array.isArray(a) ? a.map(String) : []; } catch { return []; }
}

export type Funnel = { total: number; missed: number; engaged: number; clicked: number; optedIn: number; revenue: number };

// Funnel counts are cumulative-at-or-past each stage (a clicked lead also counts as engaged).
export async function recaptureFunnel(where: Prisma.LeadWhereInput = RECAPTURE_WHERE): Promise<Funnel> {
  const leads = await db.lead.findMany({ where, select: { recaptureStage: true, valueCents: true } });
  const at = (s: string) => ORDER[s] ?? 0;
  const f: Funnel = { total: leads.length, missed: 0, engaged: 0, clicked: 0, optedIn: 0, revenue: 0 };
  for (const l of leads) {
    const o = at(l.recaptureStage || "missed");
    if (o >= 1) f.missed++;
    if (o >= 2) f.engaged++;
    if (o >= 3) f.clicked++;
    if (o >= 4) f.optedIn++;
    if (o >= 5 || l.valueCents > 0) f.revenue++;
  }
  return f;
}

export type Economics = {
  leads: number;
  accessibleRecaptureCents: number; // $25 × leads
  twilioCostCents: number; // historical call cost of this data
  outreachCostCents: number; // SMS + email sends spent recapturing
  totalCostCents: number;
  revenueCents: number; // real revenue booked on these leads
  netCents: number; // revenue − total cost
  recoupPct: number; // revenue / total cost
};

export async function recaptureEconomics(where: Prisma.LeadWhereInput = RECAPTURE_WHERE): Promise<Economics> {
  const leads = await db.lead.findMany({
    where,
    select: { id: true, valueCents: true, calls: { select: { costCents: true } } },
  });
  const leadIds = leads.map((l) => l.id);
  const twilioCostCents = leads.reduce((s, l) => s + l.calls.reduce((a, c) => a + c.costCents, 0), 0);
  const revenueCents = leads.reduce((s, l) => s + l.valueCents, 0);

  // Outreach spend: SMS messages + email messages sent to these leads.
  const [smsCount, emailCount] = leadIds.length
    ? await Promise.all([
        db.smsMessage.count({ where: { leadId: { in: leadIds }, status: "sent" } }),
        db.emailMessage.count({ where: { leadId: { in: leadIds }, status: "sent" } }),
      ])
    : [0, 0];
  const outreachCostCents = smsCount * SMS_COST_CENTS; // email via Zapmail mailboxes = sunk cost
  const totalCostCents = twilioCostCents + outreachCostCents;

  return {
    leads: leads.length,
    accessibleRecaptureCents: leads.length * ACCESSIBLE_RECAPTURE_CENTS,
    twilioCostCents,
    outreachCostCents,
    totalCostCents,
    revenueCents,
    netCents: revenueCents - totalCostCents,
    recoupPct: totalCostCents > 0 ? Math.round((revenueCents / totalCostCents) * 100) : 0,
  };
}
