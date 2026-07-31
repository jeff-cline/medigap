import { describe, it, expect, afterEach } from "vitest";
import { db } from "@/lib/db";
import { callerDetail, parseTranscript } from "./caller";

// Tracked ids created by this test file only — cleanup deletes ONLY these rows,
// never a broad deleteMany, and in FK-safe order: LeadAnswer -> Call -> Lead.
const answerIds: string[] = [];
const callIds: string[] = [];
const leadIds: string[] = [];

afterEach(async () => {
  if (answerIds.length) await db.leadAnswer.deleteMany({ where: { id: { in: answerIds.splice(0) } } });
  if (callIds.length) await db.call.deleteMany({ where: { id: { in: callIds.splice(0) } } });
  if (leadIds.length) await db.lead.deleteMany({ where: { id: { in: leadIds.splice(0) } } });
});

describe("callerDetail", () => {
  it("returns the lead, its answers, a parsed transcript, and other static calls from the same number", async () => {
    const fromNumber = "zzztest-5551230001";

    const lead = await db.lead.create({
      data: { name: "Zzztest Caller", phone: fromNumber, email: "zzztest@example.com", state: "TX", zip: "75001", source: "organic" },
    });
    leadIds.push(lead.id);

    const answer = await db.leadAnswer.create({
      data: { leadId: lead.id, question: "Are you on Medicare?", answer: "Yes" },
    });
    answerIds.push(answer.id);

    const call = await db.call.create({
      data: {
        leadId: lead.id,
        fromNumber,
        disposition: "static",
        moneyWord: "zzztest-word",
        state: "TX",
        durationSec: 120,
        connectSec: 90,
        transcript: JSON.stringify([{ role: "bot", text: "hi" }]),
        recordingUrl: "http://x",
      },
    });
    callIds.push(call.id);

    const otherCall = await db.call.create({
      data: { fromNumber, disposition: "static", moneyWord: "zzztest-word-2", durationSec: 30, connectSec: 10 },
    });
    callIds.push(otherCall.id);

    const data = await callerDetail(call.id);

    expect(data).not.toBeNull();
    expect(data!.call.id).toBe(call.id);

    expect(data!.lead?.id).toBe(lead.id);
    expect(data!.lead?.phone).toBe(fromNumber);

    expect(data!.answers).toHaveLength(1);
    expect(data!.answers[0].id).toBe(answer.id);
    expect(data!.answers[0].answer).toBe("Yes");

    const turns = parseTranscript(data!.call.transcript);
    expect(turns).toEqual([{ role: "bot", text: "hi" }]);

    expect(data!.otherCalls.map((c) => c.id)).toContain(otherCall.id);
    expect(data!.otherCalls.map((c) => c.id)).not.toContain(call.id);
  });

  it("returns null for a call id that does not exist", async () => {
    expect(await callerDetail("zzztest-nonexistent-id")).toBeNull();
  });
});

describe("parseTranscript", () => {
  it("parses a JSON array of turns", () => {
    expect(parseTranscript('[{"role":"bot","text":"hi"}]')).toEqual([{ role: "bot", text: "hi" }]);
  });

  it("returns [] for null, malformed JSON, or a non-array value", () => {
    expect(parseTranscript(null)).toEqual([]);
    expect(parseTranscript("not json")).toEqual([]);
    expect(parseTranscript('{"role":"bot"}')).toEqual([]);
  });
});
