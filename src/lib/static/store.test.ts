import { describe, it, expect, afterEach } from "vitest";
import { db } from "@/lib/db";
import { createNode, updateNode, deleteNode, moveNode, listNodes, toFlat } from "./store";

const MARK = "zzztest-"; // slugs of test rows start with this; cleaned up after each test

afterEach(async () => {
  const rows = await db.staticMoneyWord.findMany({ where: { slug: { startsWith: MARK } } });
  for (const r of rows) await db.staticMoneyWord.delete({ where: { id: r.id } }).catch(() => {});
});

async function mk(word: string, parentId: string | null = null) {
  const n = await createNode({ word, parentId });
  await db.staticMoneyWord.update({ where: { id: n.id }, data: { slug: MARK + n.slug } });
  return (await db.staticMoneyWord.findUnique({ where: { id: n.id } }))!;
}

describe("store", () => {
  it("creates with incrementing sortOrder among siblings", async () => {
    const a = await mk("Test Alpha");
    const b = await mk("Test Bravo");
    expect(b.sortOrder).toBeGreaterThan(a.sortOrder);
  });

  it("updates whitelisted fields and ignores others", async () => {
    const a = await mk("Test Ctx");
    const up = await updateNode(a.id, { contextPrompt: "hello", valueCents: 7500, id: "HACK" });
    expect(up.contextPrompt).toBe("hello");
    expect(up.valueCents).toBe(7500);
    expect(up.id).toBe(a.id); // id was NOT overwritten
  });

  it("moveNode swaps order with the adjacent sibling", async () => {
    const a = await mk("Test M1");
    const b = await mk("Test M2");
    await moveNode(b.id, "up");
    const flat = toFlat(await listNodes()).filter((n) => n.id === a.id || n.id === b.id).sort((x, y) => x.sortOrder - y.sortOrder);
    expect(flat[0].id).toBe(b.id);
  });

  it("deleteNode cascades to children", async () => {
    const p = await mk("Test Parent");
    const c = await mk("Test Child", p.id);
    await deleteNode(p.id);
    expect(await db.staticMoneyWord.findUnique({ where: { id: c.id } })).toBeNull();
  });
});
