// Live bid auction. Advertisers bid on their money word; higher bids win premium ad placement
// (shown more often) and a higher rank on the stack. The highest bid is the winning bid.
import { db } from "./db";
export type StackEntry = { agentId: string; amountCents: number };

export async function getStacks(): Promise<Map<string, StackEntry[]>> {
  const bids = await db.agentBid.findMany({ where: { active: true }, select: { agentId: true, keyword: true, amountCents: true } }).catch(() => []);
  const m = new Map<string, StackEntry[]>();
  for (const b of bids) { const k = (b.keyword || "").toLowerCase(); if (!k) continue; if (!m.has(k)) m.set(k, []); m.get(k)!.push({ agentId: b.agentId, amountCents: b.amountCents }); }
  for (const [, arr] of m) arr.sort((a, b) => b.amountCents - a.amountCents);
  return m;
}
// keyword -> highest active bid (cents). Used to weight ad placement.
export async function bidMap(): Promise<Record<string, number>> {
  const stacks = await getStacks();
  const out: Record<string, number> = {};
  for (const [k, arr] of stacks) out[k] = arr[0]?.amountCents || 0;
  return out;
}
export async function rankFor(agentId: string, keyword: string): Promise<{ rank: number; total: number; topCents: number; yourCents: number }> {
  const arr = (await getStacks()).get((keyword || "").toLowerCase()) || [];
  const idx = arr.findIndex((e) => e.agentId === agentId);
  return { rank: idx >= 0 ? idx + 1 : 0, total: arr.length, topCents: arr[0]?.amountCents || 0, yourCents: idx >= 0 ? arr[idx].amountCents : 0 };
}
