import { describe, it, expect } from "vitest";
import { matchCanned, type Canned } from "./canned";
const C = (id: string, kws: string[], sortOrder = 0, active = true): Canned => ({ id, keywords: JSON.stringify(kws), reply: id, active, sortOrder });
describe("matchCanned", () => {
  const list = [C("agent", ["agent", "human"], 3), C("call", ["please call", "call me"], 1)];
  it("matches a keyword substring, case-insensitive", () => {
    expect(matchCanned("Can you PLEASE CALL me back", list)?.id).toBe("call");
    expect(matchCanned("I want to talk to an Agent", list)?.id).toBe("agent");
  });
  it("respects sortOrder when multiple match (lowest wins)", () => {
    expect(matchCanned("please call an agent", list)?.id).toBe("call"); // sortOrder 1 < 3
  });
  it("skips inactive and returns null on no match", () => {
    expect(matchCanned("agent", [C("agent", ["agent"], 1, false)])).toBeNull();
    expect(matchCanned("random text", list)).toBeNull();
  });
  it("ignores empty-keyword canneds", () => {
    expect(matchCanned("anything", [C("empty", [], 0)])).toBeNull();
  });
});
