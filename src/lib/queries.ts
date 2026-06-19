import { db } from "./db";

// Central money math used across dashboards. Respects the showUnrealized toggle.
export async function getMoneySnapshot() {
  const [realizedAgg, unrealizedAgg, spendAgg, calls, defaultCalls, leads, agents, advertisers, investors, showU] = await Promise.all([
    db.ledgerEntry.aggregate({ where: { type: "revenue", realized: true }, _sum: { amountCents: true } }),
    db.ledgerEntry.aggregate({ where: { type: "revenue", realized: false }, _sum: { amountCents: true } }),
    db.ledgerEntry.aggregate({ where: { type: "spend" }, _sum: { amountCents: true } }),
    db.call.count(),
    db.call.count({ where: { disposition: "default" } }),
    db.lead.count(),
    db.user.count({ where: { role: "agent" } }),
    db.user.count({ where: { role: "advertiser" } }),
    db.investor.count(),
    getSetting("showUnrealized", "true"),
  ]);
  const realized = realizedAgg._sum.amountCents ?? 0;
  const unrealized = unrealizedAgg._sum.amountCents ?? 0;
  const showUnrealized = showU === "true";
  const revenue = realized + (showUnrealized ? unrealized : 0);
  const spend = spendAgg._sum.amountCents ?? 0;
  const profit = revenue - spend;
  const roi = spend > 0 ? revenue / spend : 0;
  return { revenue, realized, unrealized, showUnrealized, spend, profit, roi, calls, defaultCalls, leads, agents, advertisers, investors };
}

export async function getSetting(key: string, fallback = "") {
  const s = await db.setting.findUnique({ where: { key } });
  return s?.value ?? fallback;
}

export async function recentLedger(limit = 12) {
  return db.ledgerEntry.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}
