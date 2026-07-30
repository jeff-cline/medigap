import { describe, it, expect, afterEach } from "vitest";
import { db } from "@/lib/db";
import { listBuyers, createBuyer, updateBuyer, deleteBuyer, listZipRules, createZipRule, deleteZipRule } from "./buyers";

// self-cleaning: every test money word uses a zzztest- slug; cascade removes its buyers/zip rules
async function makeLeaf(): Promise<string> {
  const n = await db.staticMoneyWord.create({ data: { word: "zzztest leaf", slug: `zzztest-${Date.now()}-${Math.round(Math.random() * 1e6)}` } });
  return n.id;
}
afterEach(async () => {
  await db.staticMoneyWord.deleteMany({ where: { slug: { startsWith: "zzztest-" } } });
});

describe("buyers store", () => {
  it("creates, lists, updates and deletes a buyer", async () => {
    const mw = await makeLeaf();
    const b = await createBuyer({ moneyWordId: mw, name: "Acme", defaultNumber: "+15551230000" });
    expect(b.name).toBe("Acme");
    expect(b.priorityWeight).toBe(1);

    const listed = await listBuyers(mw);
    expect(listed.map((x) => x.id)).toContain(b.id);

    const up = await updateBuyer(b.id, { priorityWeight: 9, dailyCap: 50, active: false, afterHoursDays: [0, 6], id: "HACK" });
    expect(up.priorityWeight).toBe(9);
    expect(up.dailyCap).toBe(50);
    expect(up.active).toBe(false);
    expect(JSON.parse(up.afterHoursDays)).toEqual([0, 6]);
    expect(up.id).toBe(b.id); // whitelist ignored the id override

    await deleteBuyer(b.id);
    expect((await listBuyers(mw)).map((x) => x.id)).not.toContain(b.id);
  });

  it("creates, lists and deletes a zip rule scoped to the money word", async () => {
    const mw = await makeLeaf();
    const b = await createBuyer({ moneyWordId: mw, name: "Acme", defaultNumber: "+15551230000" });
    const z = await createZipRule({ moneyWordId: mw, buyerId: b.id, zip: "75001", radiusMiles: 10 });
    expect(z.zip).toBe("75001");
    expect(z.radiusMiles).toBe(10);

    const rules = await listZipRules(mw);
    expect(rules.map((r) => r.id)).toEqual([z.id]);

    await deleteZipRule(z.id);
    expect(await listZipRules(mw)).toHaveLength(0);
  });

  it("deletes a buyer's zip rules when the buyer is removed (no orphans)", async () => {
    const mw = await makeLeaf();
    const b = await createBuyer({ moneyWordId: mw, name: "Acme", defaultNumber: "+15551230000" });
    await createZipRule({ moneyWordId: mw, buyerId: b.id, zip: "75001" });
    expect(await listZipRules(mw)).toHaveLength(1);
    await deleteBuyer(b.id);
    expect(await listZipRules(mw)).toHaveLength(0);
  });

});
