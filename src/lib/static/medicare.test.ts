import { describe, it, expect, vi } from "vitest";
import { classifyMedicareIntent, detectYesNo, medicareInterrupt, classifyMedicareIntentAI } from "./medicare";

describe("classifyMedicareIntent", () => {
  it("gov: card / bill phrasing", () => {
    expect(classifyMedicareIntent("I need to replace my Medicare card")).toBe("gov");
    expect(classifyMedicareIntent("I didn't get a bill paid")).toBe("gov");
  });
  it("buy: quote / advantage / drug", () => {
    expect(classifyMedicareIntent("I want a quote")).toBe("buy");
    expect(classifyMedicareIntent("how much insurance do I need")).toBe("buy");
    expect(classifyMedicareIntent("tell me about Medicare Advantage")).toBe("buy");
  });
  it("plan: retire / part b / social security beats generic insurance", () => {
    expect(classifyMedicareIntent("I'm ready to retire")).toBe("plan");
    expect(classifyMedicareIntent("how do I sign up for Part B")).toBe("plan");
    expect(classifyMedicareIntent("I need to start social security")).toBe("plan");
  });
  it("strong BUY tokens win over broad gov/plan words (no lost sales)", () => {
    expect(classifyMedicareIntent("I want to buy insurance, put it on my card")).toBe("buy");
    expect(classifyMedicareIntent("sign up for Medicare Advantage")).toBe("buy");
    expect(classifyMedicareIntent("I want to enroll in a Medigap plan")).toBe("buy");
  });
  it("returns null on ambiguous/no strong keyword (defers to AI)", () => {
    expect(classifyMedicareIntent("the weather is nice")).toBeNull();
    expect(classifyMedicareIntent("I want to sign up")).toBeNull();
    expect(classifyMedicareIntent("")).toBeNull();
  });
});

describe("detectYesNo", () => {
  it("yes words + DTMF 1", () => {
    expect(detectYesNo("yes please", "")).toBe("yes");
    expect(detectYesNo("let me join", "")).toBe("yes");
    expect(detectYesNo("", "1")).toBe("yes");
  });
  it("no words + DTMF 2", () => {
    expect(detectYesNo("no thanks", "")).toBe("no");
    expect(detectYesNo("", "2")).toBe("no");
  });
  it("null on unclear", () => {
    expect(detectYesNo("maybe later", "")).toBeNull();
  });
});

describe("medicareInterrupt", () => {
  it("detects 'what' with no other intent", () => {
    expect(medicareInterrupt("what?")).toBe("what");
    expect(medicareInterrupt("wait, what")).toBe("what");
  });
  it("detects customer service / human requests", () => {
    expect(medicareInterrupt("I want customer service")).toBe("service");
    expect(medicareInterrupt("give me a representative")).toBe("service");
    expect(medicareInterrupt("let me speak to a person")).toBe("service");
  });
  it("null on a normal intent utterance", () => {
    expect(medicareInterrupt("I want a quote")).toBeNull();
  });
  it("does not treat 'agent' as service when there's a buy intent", () => {
    expect(medicareInterrupt("I want an agent to give me a quote")).toBeNull();
  });
});

describe("classifyMedicareIntentAI", () => {
  it("maps a clean AI answer to the intent", async () => {
    const aiReply = vi.fn().mockResolvedValue("gov");
    expect(await classifyMedicareIntentAI("my card is lost", { aiReply })).toBe("gov");
  });
  it("returns null when AI is unavailable or garbage", async () => {
    expect(await classifyMedicareIntentAI("x", { aiReply: vi.fn().mockResolvedValue(null) })).toBeNull();
    expect(await classifyMedicareIntentAI("x", { aiReply: vi.fn().mockResolvedValue("banana") })).toBeNull();
  });
});
