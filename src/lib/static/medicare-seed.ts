type AnyDb = any;

async function upsertWord(db: AnyDb, slug: string, data: Record<string, unknown>) {
  const existing = await db.staticMoneyWord.findFirst({ where: { slug } });
  if (existing) {
    // keep it current on flowKey/parent without disturbing user edits to value/states/prompts
    await db.staticMoneyWord.update({ where: { id: existing.id }, data: { flowKey: data.flowKey ?? existing.flowKey } });
    return existing;
  }
  return db.staticMoneyWord.create({ data: { slug, ...data } });
}

async function ensureBuyer(db: AnyDb, moneyWordId: string, name: string, number: string) {
  const existing = await db.staticBuyer.findFirst({ where: { moneyWordId } });
  if (existing) return existing;
  return db.staticBuyer.create({
    data: { moneyWordId, name, defaultNumber: number, active: true, dailyCap: 0, priorityWeight: 1, payoutCents: 0, states: "[]", billableSeconds: 0 },
  });
}

// Idempotent: add the Medicare custom-flow subtree without disturbing the rest of the tree.
export async function ensureMedicareSubtree(db: AnyDb): Promise<void> {
  const medicare = await upsertWord(db, "medicare", {
    word: "Medicare", parentId: null, flowKey: "medicare", active: true, sortOrder: 100,
    valueCents: 0, states: "[]", ageRule: "{}",
  });
  const insurance = await upsertWord(db, "medicare-insurance", {
    word: "Medicare Insurance", parentId: medicare.id, flowKey: "", active: true, sortOrder: 1,
    valueCents: 0, states: "[]", ageRule: "{}",
  });
  const reverse = await upsertWord(db, "reverse-mortgage", {
    word: "Reverse Mortgage", parentId: medicare.id, flowKey: "", active: true, sortOrder: 2,
    valueCents: 0, states: "[]", ageRule: "{}",
  });
  const retire = await upsertWord(db, "retirement-planner", {
    word: "Retirement Planner", parentId: medicare.id, flowKey: "", active: true, sortOrder: 3,
    valueCents: 0, states: "[]", ageRule: "{}",
  });
  void insurance;
  await ensureBuyer(db, reverse.id, "Reverse Mortgage Desk", "972-800-6670");
  await ensureBuyer(db, retire.id, "Retirement Planner Desk", "972-800-6670");
}
