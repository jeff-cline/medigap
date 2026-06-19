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

// Route a (real or simulated) inbound call through the auction and bill the winner.
export async function routeCall(input: { zip: string; state: string; leadId?: string; source?: string; moneyWord?: string }) {
  const minBid = parseInt((await db.setting.findUnique({ where: { key: "minCallBidCents" } }))?.value || "2500", 10);
  const bidRows = await db.agentBid.findMany({ where: { active: true }, include: { agent: true } });
  const bids: (BidLike & { id: string })[] = bidRows.map((b) => ({ id: b.id, agentId: b.agentId, amountCents: b.amountCents, stars: b.agent.stars, active: b.active, dailyCap: b.dailyCap, scope: b.scope, scopeValue: b.scopeValue }));
  const winner = pickWinner(bids, { zip: input.zip, state: input.state });
  const priceCents = winner ? Math.max(winner.amountCents, minBid) : 0;
  const call = await db.call.create({
    data: {
      leadId: input.leadId, zip: input.zip, state: input.state, status: "completed",
      source: input.source || "organic", moneyWord: input.moneyWord,
      bidWinnerId: winner?.agentId, priceCents,
    },
  });
  if (winner && priceCents > 0) {
    await db.ledgerEntry.create({ data: { type: "revenue", category: "call", channel: "auction", amountCents: priceCents, note: `Call ${call.id} → agent ${winner.agentId}` } });
  }
  return { call, winner, priceCents };
}

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
export async function pnl() {
  const entries = await db.ledgerEntry.findMany();
  const byChannel: Record<string, { rev: number; spend: number }> = {};
  let revenue = 0, spend = 0;
  for (const e of entries) {
    const k = e.channel || "other";
    byChannel[k] ??= { rev: 0, spend: 0 };
    if (e.type === "revenue") { revenue += e.amountCents; byChannel[k].rev += e.amountCents; }
    else { spend += e.amountCents; byChannel[k].spend += e.amountCents; }
  }
  return { revenue, spend, profit: revenue - spend, roi: spend ? revenue / spend : 0, byChannel };
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
  };
}
