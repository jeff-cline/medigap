import { describe, it, expect } from "vitest";
import { ensureMedicareSubtree } from "./medicare-seed";

function fakeDb() {
  const words: any[] = [];
  const buyers: any[] = [];
  let n = 0;
  return {
    _words: words, _buyers: buyers,
    staticMoneyWord: {
      findFirst: async ({ where }: any) => words.find((w) => w.slug === where.slug) || null,
      create: async ({ data }: any) => { const row = { id: `w${++n}`, ...data }; words.push(row); return row; },
      update: async ({ where, data }: any) => { const w = words.find((x) => x.id === where.id); Object.assign(w, data); return w; },
    },
    staticBuyer: {
      findFirst: async ({ where }: any) => buyers.find((b) => b.moneyWordId === where.moneyWordId) || null,
      create: async ({ data }: any) => { const row = { id: `b${++n}`, ...data }; buyers.push(row); return row; },
    },
  };
}

describe("ensureMedicareSubtree", () => {
  it("creates Medicare (flowKey) + 3 children + 972 buyers, and is idempotent", async () => {
    const db: any = fakeDb();
    await ensureMedicareSubtree(db);
    const medicare = db._words.find((w: any) => w.slug === "medicare");
    expect(medicare.flowKey).toBe("medicare");
    expect(medicare.parentId).toBeNull();
    const slugs = db._words.map((w: any) => w.slug).sort();
    expect(slugs).toEqual(["medicare", "medicare-insurance", "retirement-planner", "reverse-mortgage"]);
    const rm = db._words.find((w: any) => w.slug === "reverse-mortgage");
    const rp = db._words.find((w: any) => w.slug === "retirement-planner");
    expect(db._buyers.find((b: any) => b.moneyWordId === rm.id).defaultNumber).toBe("972-800-6670");
    expect(db._buyers.find((b: any) => b.moneyWordId === rp.id).defaultNumber).toBe("972-800-6670");
    const wordCount = db._words.length, buyerCount = db._buyers.length;
    await ensureMedicareSubtree(db); // second run: no duplicates
    expect(db._words.length).toBe(wordCount);
    expect(db._buyers.length).toBe(buyerCount);
  });
});
