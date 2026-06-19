import { db } from "./db";

// Central money math used across dashboards.
export async function getMoneySnapshot() {
  const [revAgg, spendAgg, calls, leads, agents, advertisers, investors] = await Promise.all([
    db.ledgerEntry.aggregate({ where: { type: "revenue" }, _sum: { amountCents: true } }),
    db.ledgerEntry.aggregate({ where: { type: "spend" }, _sum: { amountCents: true } }),
    db.call.count(),
    db.lead.count(),
    db.user.count({ where: { role: "agent" } }),
    db.user.count({ where: { role: "advertiser" } }),
    db.investor.count(),
  ]);
  const revenue = revAgg._sum.amountCents ?? 0;
  const spend = spendAgg._sum.amountCents ?? 0;
  const profit = revenue - spend;
  const roi = spend > 0 ? revenue / spend : 0;
  return { revenue, spend, profit, roi, calls, leads, agents, advertisers, investors };
}

export async function getSetting(key: string, fallback = "") {
  const s = await db.setting.findUnique({ where: { key } });
  return s?.value ?? fallback;
}

export async function recentLedger(limit = 12) {
  return db.ledgerEntry.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}
