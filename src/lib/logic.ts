// Core business logic — pure functions reused by pages & API routes.
import { db } from "./db";

// ---- Agent call auction: highest bid wins; ties broken by star rating ----
export type BidLike = { agentId: string; amountCents: number; stars: number; active: boolean; dailyCap: number; scope: string; scopeValue: string };

export function pickWinner(bids: BidLike[], ctx: { zip?: string; state?: string }): BidLike | null {
  const eligible = bids.filter((b) => {
    if (!b.active) return false;
    if (b.scope === "national") return true;
    if (b.scope === "zip") return b.scopeValue === ctx.zip;
    if (b.scope === "state") return b.scopeValue === ctx.state;
    return false;
  });
  if (!eligible.length) return null;
  return eligible.sort((a, b) => b.amountCents - a.amountCents || b.stars - a.stars)[0];
}

// Route a (real or simulated) inbound call through the auction.
// If an agent wins → SOLD call (realized revenue at the bid price).
// If nobody wins → DEFAULT/house call → forward to the house number, book the house
// default price as UNREALIZED revenue to the God account, and flag it.
export async function routeCall(input: { zip: string; state: string; leadId?: string; source?: string; moneyWord?: string; providerSid?: string; fromNumber?: string }) {
  const s = await getSettings();
  const bidRows = await db.agentBid.findMany({ where: { active: true }, include: { agent: true } });
  // Only agents who are AVAILABLE and have enough prepaid balance compete; optional keyword filter.
  const bids: (BidLike & { id: string; phone: string })[] = bidRows
    .filter((b) => b.agent.available && b.agent.balanceCents >= b.amountCents && (!b.keyword || (input.moneyWord ? b.keyword === input.moneyWord.toLowerCase() : true)))
    .map((b) => ({ id: b.id, agentId: b.agentId, amountCents: b.amountCents, stars: b.agent.stars, active: b.active, dailyCap: b.dailyCap, scope: b.scope, scopeValue: b.scopeValue, phone: b.agent.phone }));
  const winner = pickWinner(bids, { zip: input.zip, state: input.state }) as (BidLike & { phone: string }) | null;

  let disposition: "sold" | "default";
  let priceCents: number;
  let realized: boolean;
  let forwardedTo: string;
  let channel: string;

  if (winner) {
    disposition = "sold";
    priceCents = Math.max(winner.amountCents, s.minCallBidCents);
    realized = true;
    forwardedTo = winner.phone || "";
    channel = "auction";
  } else {
    disposition = "default";
    priceCents = s.defaultCallPriceCents; // house default, e.g. $77.44
    realized = false; // UNREALIZED until collected
    forwardedTo = s.defaultForwardNumber; // e.g. 972-800-6670
    channel = "house";
  }

  const call = await db.call.create({
    data: {
      leadId: input.leadId, zip: input.zip, state: input.state, status: "completed",
      source: input.source || (winner ? "paid" : "house"), moneyWord: input.moneyWord,
      bidWinnerId: winner?.agentId, priceCents, disposition, realized, forwardedTo,
      providerSid: input.providerSid || "", fromNumber: input.fromNumber || "",
    },
  });
  if (priceCents > 0) {
    await db.ledgerEntry.create({ data: {
      type: "revenue", category: winner ? "call" : "default_call", channel,
      amountCents: priceCents, realized,
      note: winner ? `Call ${call.id} → agent ${winner.agentId}` : `Default/house call ${call.id} → ${forwardedTo} (unrealized)`,
    } });
  }
  // Deduct the call price from the winning agent's prepaid balance.
  if (winner) {
    await db.user.update({ where: { id: winner.agentId }, data: { balanceCents: { decrement: priceCents } } }).catch(() => {});
    await db.transaction.create({ data: { kind: "charge", userId: winner.agentId, amountCents: priceCents, status: "settled", note: `Call charge — ${call.id}` } }).catch(() => {});
  }
  return { call, winner, priceCents, disposition, realized, forwardedTo };
}

// Assign a (web-form or imported) lead to the best agent by ZIP/state and charge the lead price.
// Same auction rules as calls: available + funded agents only, highest bid wins, ties by stars.
export async function assignLead(leadId: string) {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.agentId) return { assigned: false };
  const s = await getSettings();
  const price = s.leadPriceCents;
  const bidRows = await db.agentBid.findMany({ where: { active: true }, include: { agent: true } });
  const pool: BidLike[] = bidRows
    .filter((b) => b.agent.available && b.agent.balanceCents >= price && (!b.keyword || b.keyword === lead.vertical.toLowerCase()))
    .map((b) => ({ agentId: b.agentId, amountCents: b.amountCents, stars: b.agent.stars, active: b.active, dailyCap: b.dailyCap, scope: b.scope, scopeValue: b.scopeValue }));
  const winner = pickWinner(pool, { zip: lead.zip, state: lead.state });
  if (!winner) return { assigned: false };
  await db.lead.update({ where: { id: leadId }, data: { agentId: winner.agentId, status: "contacted", valueCents: price } });
  await db.user.update({ where: { id: winner.agentId }, data: { balanceCents: { decrement: price } } }).catch(() => {});
  await db.ledgerEntry.create({ data: { type: "revenue", category: "lead", channel: "webform", amountCents: price, realized: true, note: `Web lead ${leadId} → agent ${winner.agentId}` } }).catch(() => {});
  await db.transaction.create({ data: { kind: "charge", userId: winner.agentId, amountCents: price, status: "settled", note: `Lead charge — ${leadId}` } }).catch(() => {});
  return { assigned: true, agentId: winner.agentId };
}
export function assignLeadBackground(leadId: string) { assignLead(leadId).catch(() => {}); }

// ---- Investor profit waterfall ----
export type WaterfallInput = { depositCents: number; grossProfitCents: number; mgmtFeePct: number; profitSharePct: number; futureProofingPct: number; aiFeePct: number; expenseCents?: number };
export function waterfall(i: WaterfallInput) {
  const mgmtFee = Math.round(i.depositCents * (i.mgmtFeePct / 100));
  const deployed = i.depositCents - mgmtFee;
  const expenses = i.expenseCents ?? 0;
  const aiFee = Math.round(i.grossProfitCents * (i.aiFeePct / 100));
  const futureProofing = Math.round(i.grossProfitCents * (i.futureProofingPct / 100));
  const distributable = Math.max(0, i.grossProfitCents - expenses - aiFee - futureProofing);
  const investorShare = Math.round(distributable * (i.profitSharePct / 100));
  const houseShare = distributable - investorShare;
  return { mgmtFee, deployed, expenses, aiFee, futureProofing, distributable, investorShare, houseShare };
}

// ---- Network P&L from the ledger ----
// Respects the global showUnrealized toggle: when OFF, unrealized revenue is excluded
// from every total (forwards AND backwards, since it's recomputed from the ledger).
export async function pnl() {
  const [entries, s] = await Promise.all([db.ledgerEntry.findMany(), getSettings()]);
  const byChannel: Record<string, { rev: number; spend: number }> = {};
  let revRealized = 0, revUnrealized = 0, spend = 0;
  for (const e of entries) {
    const k = e.channel || "other";
    byChannel[k] ??= { rev: 0, spend: 0 };
    if (e.type === "revenue") {
      if (e.realized) revRealized += e.amountCents; else revUnrealized += e.amountCents;
      if (e.realized || s.showUnrealized) byChannel[k].rev += e.amountCents;
    } else { spend += e.amountCents; byChannel[k].spend += e.amountCents; }
  }
  const revenue = revRealized + (s.showUnrealized ? revUnrealized : 0);
  return { revenue, revRealized, revUnrealized, spend, profit: revenue - spend, roi: spend ? revenue / spend : 0, byChannel, showUnrealized: s.showUnrealized };
}

export async function getSettings() {
  const rows = await db.setting.findMany();
  const m: Record<string, string> = {};
  rows.forEach((r) => (m[r.key] = r.value));
  const n = (k: string, d: number) => (m[k] !== undefined ? parseFloat(m[k]) : d);
  return {
    raw: m,
    minCallBidCents: n("minCallBidCents", 2500),
    mgmtFeePct: n("mgmtFeePct", 2),
    profitSharePct: n("profitSharePct", 50),
    aiFeePct: n("aiFeePct", 0),
    futureProofingPct: n("futureProofingPct", 5),
    investorPct: n("investorPct", 100),
    arbitrageTarget: n("arbitrageTarget", 3),
    autonomousMode: m["autonomousMode"] || "learning",
    defaultCallPriceCents: n("defaultCallPriceCents", 7744), // house price for unsold/default calls ($77.44)
    defaultForwardNumber: m["defaultForwardNumber"] || "9728006670",
    seatZipCents: n("seatZipCents", 9900), // $99/mo per ZIP
    seatStateCents: n("seatStateCents", 49900), // $499/mo per state
    seatNationalCents: n("seatNationalCents", 199900), // $1,999/mo nationwide
    leadPriceCents: n("leadPriceCents", 1500), // price charged to an agent for a routed web lead ($15)
    webLeadFallbackNumber: m["webLeadFallbackNumber"] || m["defaultForwardNumber"] || "9728006670",
    showUnrealized: (m["showUnrealized"] ?? "true") === "true", // include unrealized revenue in totals
    callWhisper: (m["callWhisper"] ?? "true") === "true",
  };
}
