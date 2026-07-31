import { describe, it, expect, afterEach } from "vitest";
import { db } from "@/lib/db";
import { pickBuyerFor, captureCallback } from "./routing";

async function leaf(): Promise<string> {
  const n = await db.staticMoneyWord.create({ data: { word: "zzztest word", slug: `zzztest-${Date.now()}-${Math.round(Math.random() * 1e6)}` } });
  return n.id;
}
afterEach(async () => {
  await db.staticCallback.deleteMany({ where: { word: { startsWith: "zzztest" } } });
  await db.staticMoneyWord.deleteMany({ where: { slug: { startsWith: "zzztest-" } } });
});
const NOW = Date.UTC(2026, 6, 15, 18, 0, 0); // Wed 13:00 CDT — business hours

describe("pickBuyerFor", () => {
  it("returns null when the leaf has no buyers", async () => {
    expect(await pickBuyerFor(await leaf(), {}, NOW)).toBeNull();
  });

  it("routes to the only active buyer and increments its dailyCount", async () => {
    const mw = await leaf();
    const b = await db.staticBuyer.create({ data: { moneyWordId: mw, name: "Acme", defaultNumber: "+15551110000" } });
    const r = await pickBuyerFor(mw, {}, NOW);
    expect(r).toEqual({ buyerId: b.id, number: "+15551110000", payoutCents: 0, billableSeconds: 0 });
    const after = await db.staticBuyer.findUnique({ where: { id: b.id } });
    expect(after!.dailyCount).toBe(1);
    expect(after!.lastAssignedAt).not.toBeNull();
  });

  it("includes buyer payoutCents and billableSeconds in routing result", async () => {
    const mw = await leaf();
    const b = await db.staticBuyer.create({ data: { moneyWordId: mw, name: "Premium", defaultNumber: "+15551110000", payoutCents: 5000, billableSeconds: 30 } });
    const r = await pickBuyerFor(mw, {}, NOW);
    expect(r!.payoutCents).toBe(5000);
    expect(r!.billableSeconds).toBe(30);
  });

  it("honors an exact-ZIP rule over plain SWRR", async () => {
    const mw = await leaf();
    const a = await db.staticBuyer.create({ data: { moneyWordId: mw, name: "A", defaultNumber: "+15551110000", priorityWeight: 99 } });
    const b = await db.staticBuyer.create({ data: { moneyWordId: mw, name: "B", defaultNumber: "+15552220000", priorityWeight: 1 } });
    await db.staticZipRule.create({ data: { moneyWordId: mw, buyerId: b.id, zip: "75001" } });
    const r = await pickBuyerFor(mw, { zip: "75001" }, NOW);
    expect(r!.buyerId).toBe(b.id); // ZIP rule wins despite A's huge weight
  });

  it("skips a capped buyer", async () => {
    const mw = await leaf();
    await db.staticBuyer.create({ data: { moneyWordId: mw, name: "Capped", defaultNumber: "+15551110000", dailyCap: 1, dailyCount: 1 } });
    expect(await pickBuyerFor(mw, {}, NOW)).toBeNull();
  });

  it("excludes blank-number buyers before selection and never persists their state", async () => {
    const mw = await leaf();
    const blank = await db.staticBuyer.create({ data: { moneyWordId: mw, name: "BlankNum", defaultNumber: "", priorityWeight: 99 } });
    const real = await db.staticBuyer.create({ data: { moneyWordId: mw, name: "RealNum", defaultNumber: "+15551234567", priorityWeight: 1 } });
    const r = await pickBuyerFor(mw, {}, NOW);
    expect(r!.buyerId).toBe(real.id); // routes to the real-number buyer despite blank's higher weight
    const blankAfter = await db.staticBuyer.findUnique({ where: { id: blank.id } });
    expect(blankAfter!.dailyCount).toBe(0); // blank-number buyer was never selected or persisted
  });

  it("no lost updates under concurrent calls (atomic read+write)", async () => {
    const mw = await leaf();
    await db.staticBuyer.create({ data: { moneyWordId: mw, name: "Unl", defaultNumber: "+15551110000", dailyCap: 0 } }); // unlimited
    const N = 8;
    const results = await Promise.all(Array.from({ length: N }, () => pickBuyerFor(mw, {}, NOW)));
    const routed = results.filter(Boolean);
    const b = await db.staticBuyer.findFirst({ where: { moneyWordId: mw } });
    expect(routed.length).toBe(N);        // all routed (unlimited cap)
    expect(b!.dailyCount).toBe(N);        // every increment persisted — NO lost updates (this is the race the fix prevents)
  });

  it("skips a buyer with non-matching state (only buyer, returns null)", async () => {
    const mw = await leaf();
    await db.staticBuyer.create({ data: { moneyWordId: mw, name: "FL Only", defaultNumber: "+15551110000", states: JSON.stringify(["FL"]) } });
    const r = await pickBuyerFor(mw, { state: "TX" }, NOW);
    expect(r).toBeNull(); // no buyers in state, all filtered out
  });

  it("routes to a buyer with empty states array (matches any state)", async () => {
    const mw = await leaf();
    const b = await db.staticBuyer.create({ data: { moneyWordId: mw, name: "Any State", defaultNumber: "+15551110000", states: "[]" } });
    const r = await pickBuyerFor(mw, { state: "TX" }, NOW);
    expect(r!.buyerId).toBe(b.id);
  });

  it("returns billableSeconds in routing result", async () => {
    const mw = await leaf();
    const b = await db.staticBuyer.create({ data: { moneyWordId: mw, name: "Billable", defaultNumber: "+15551110000", billableSeconds: 60 } });
    const r = await pickBuyerFor(mw, {}, NOW);
    expect(r!.billableSeconds).toBe(60);
  });
});

describe("captureCallback", () => {
  it("writes a StaticCallback row", async () => {
    await captureCallback({ word: "zzztest demand", state: "TX", zip: "75001", phone: "+15550000000", note: "no buyer" });
    const rows = await db.staticCallback.findMany({ where: { word: "zzztest demand" } });
    expect(rows).toHaveLength(1);
    expect(rows[0].state).toBe("TX");
  });
});
