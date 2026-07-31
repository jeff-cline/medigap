import { db } from "@/lib/db";

export type BuyerRow = Awaited<ReturnType<typeof db.staticBuyer.findFirstOrThrow>>;
export type ZipRuleRow = Awaited<ReturnType<typeof db.staticZipRule.findFirstOrThrow>>;

const EDITABLE_BUYER = new Set([
  "name", "defaultNumber", "afterHoursNumber", "backupNumber",
  "afterHoursDays", "afterHoursStart", "afterHoursEnd",
  "active", "dailyCap", "priorityWeight", "payoutCents",
  "states", "billableSeconds",
]);

export async function listBuyers(moneyWordId: string): Promise<BuyerRow[]> {
  return db.staticBuyer.findMany({ where: { moneyWordId }, orderBy: [{ createdAt: "asc" }] });
}

export async function createBuyer(input: { moneyWordId: string; name?: string; defaultNumber?: string }): Promise<BuyerRow> {
  return db.staticBuyer.create({
    data: {
      moneyWordId: input.moneyWordId,
      name: (input.name ?? "New buyer").trim() || "New buyer",
      defaultNumber: (input.defaultNumber ?? "").trim(),
    },
  });
}

export async function updateBuyer(id: string, patch: Record<string, unknown>): Promise<BuyerRow> {
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) if (EDITABLE_BUYER.has(k)) data[k] = v;
  if (typeof data.name === "string") {
    const t = data.name.trim();
    if (t) data.name = t; else delete data.name; // never blank a buyer name
  }
  if (Array.isArray(data.afterHoursDays)) data.afterHoursDays = JSON.stringify(data.afterHoursDays);
  if (Array.isArray(data.states)) data.states = JSON.stringify(data.states);
  return db.staticBuyer.update({ where: { id }, data });
}

export async function deleteBuyer(id: string): Promise<void> {
  // ZIP rules reference a buyer by plain id (no FK per spec §4.2) — clean them up
  // so routing (Phase 2B) never resolves a ZIP to a deleted buyer.
  await db.staticZipRule.deleteMany({ where: { buyerId: id } });
  await db.staticBuyer.delete({ where: { id } });
}

export async function listZipRules(moneyWordId: string): Promise<ZipRuleRow[]> {
  return db.staticZipRule.findMany({ where: { moneyWordId }, orderBy: [{ createdAt: "asc" }] });
}

export async function createZipRule(input: { moneyWordId: string; buyerId: string; zip: string; radiusMiles?: number }): Promise<ZipRuleRow> {
  return db.staticZipRule.create({
    data: {
      moneyWordId: input.moneyWordId,
      buyerId: input.buyerId,
      zip: input.zip.trim(),
      radiusMiles: Math.max(0, Math.round(input.radiusMiles ?? 0)),
    },
  });
}

export async function deleteZipRule(id: string): Promise<void> {
  await db.staticZipRule.delete({ where: { id } });
}

export async function hasActiveBuyers(moneyWordId: string): Promise<boolean> {
  const n = await db.staticBuyer.count({ where: { moneyWordId, active: true, NOT: { defaultNumber: "" } } });
  return n > 0;
}
