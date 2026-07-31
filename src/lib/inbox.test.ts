import { describe, it, expect, afterEach, afterAll } from "vitest";
import { db } from "@/lib/db";
import { unifiedThreads, cannedCreate, cannedList, cannedDelete, markHandled } from "@/lib/inbox";

// Distinctive test consumer number — unlikely to collide with real data.
const SENDER = "+19995550123";
const OUR = "+18006334427";

// Track everything we create so cleanup only ever touches our own rows (never a broad deleteMany).
const smsIds: string[] = [];
const cannedIds: string[] = [];

afterEach(async () => {
  if (smsIds.length) { await db.smsMessage.deleteMany({ where: { id: { in: smsIds } } }); smsIds.length = 0; }
  if (cannedIds.length) { await db.cannedResponse.deleteMany({ where: { id: { in: cannedIds } } }); cannedIds.length = 0; }
});
afterAll(async () => {
  if (smsIds.length) await db.smsMessage.deleteMany({ where: { id: { in: smsIds } } });
  if (cannedIds.length) await db.cannedResponse.deleteMany({ where: { id: { in: cannedIds } } });
});

describe("unifiedThreads", () => {
  it("groups a consumer's inbound messages into one thread that needs a human, then clears on markHandled", async () => {
    const m1 = await db.smsMessage.create({ data: { to: SENDER, body: "hello there", direction: "inbound", status: "received", readAt: null, fromLabel: OUR } });
    const m2 = await db.smsMessage.create({ data: { to: SENDER, body: "you there?", direction: "inbound", status: "received", readAt: null, fromLabel: OUR } });
    smsIds.push(m1.id, m2.id);

    const { threads, numbers } = await unifiedThreads();
    const t = threads.find((x) => x.sender === SENDER);
    expect(t).toBeTruthy();
    expect(t!.needsHuman).toBe(true);
    expect(t!.ourNumber).toBe(OUR);
    expect(t!.messages.length).toBe(2);
    expect(numbers).toContain(OUR);

    // Mark handled → the thread should no longer need a human.
    await markHandled(SENDER);
    const after = await unifiedThreads();
    const t2 = after.threads.find((x) => x.sender === SENDER);
    expect(t2).toBeTruthy();
    expect(t2!.needsHuman).toBe(false);
  });
});

describe("canned CRUD", () => {
  it("creates a canned response, lists it with JSON-stringified lowercased keywords, then deletes it", async () => {
    const c = await cannedCreate({ label: "zzztest", keywords: ["zzzkw"], reply: "hi" });
    cannedIds.push(c.id);

    const list = await cannedList();
    const found = list.find((x) => x.id === c.id);
    expect(found).toBeTruthy();
    expect(found!.label).toBe("zzztest");
    expect(found!.keywords).toBe('["zzzkw"]');
    expect(found!.reply).toBe("hi");

    await cannedDelete(c.id);
    cannedIds.length = 0; // deleted already; nothing left to clean
    const after = await cannedList();
    expect(after.find((x) => x.id === c.id)).toBeUndefined();
  });
});
