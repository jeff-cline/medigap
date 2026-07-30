import { describe, it, expect, afterEach } from "vitest";
import { db } from "@/lib/db";
import { moneyWordCloud } from "./hotlist";

afterEach(async () => {
  await db.staticCallback.deleteMany({ where: { word: { startsWith: "zzztest-" } } });
});

describe("hotlist", () => {
  it("aggregates callbacks by money word with demand ordering and state collection", async () => {
    // Create 3 callbacks for "zzztest-alpha" (TX, TX, FL)
    await db.staticCallback.create({ data: { word: "zzztest-alpha", state: "TX" } });
    await db.staticCallback.create({ data: { word: "zzztest-alpha", state: "TX" } });
    await db.staticCallback.create({ data: { word: "zzztest-alpha", state: "FL" } });

    // Create 1 callback for "zzztest-beta" (CA)
    await db.staticCallback.create({ data: { word: "zzztest-beta", state: "CA" } });

    const result = await moneyWordCloud();

    // Filter to our test words only
    const testWords = result.filter(e => e.word.startsWith("zzztest-"));

    // Alpha should be first (higher count)
    expect(testWords[0].word).toBe("zzztest-alpha");
    expect(testWords[0].count).toBe(3);
    expect(testWords[0].states).toContain("TX");
    expect(testWords[0].states).toContain("FL");
    expect(testWords[0].states.length).toBe(2);

    // Beta should be second
    expect(testWords[1].word).toBe("zzztest-beta");
    expect(testWords[1].count).toBe(1);
    expect(testWords[1].states).toEqual(["CA"]);
  });
});
