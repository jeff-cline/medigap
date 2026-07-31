import { describe, it, expect } from "vitest";
import { highlightKeywords } from "./highlight";

const join = (segs: { text: string; hit: boolean }[]) =>
  segs.map((s) => (s.hit ? `[${s.text}]` : s.text)).join("");

describe("highlightKeywords", () => {
  it("wraps a case-insensitive keyword match", () => {
    expect(join(highlightKeywords("My food card is broken", ["food card"]))).toBe("My [food card] is broken");
    expect(join(highlightKeywords("Please CALL ME back", ["call me"]))).toBe("Please [CALL ME] back");
  });
  it("preserves the original casing of the matched text", () => {
    const segs = highlightKeywords("Talk to an AGENT now", ["agent"]);
    expect(segs.find((s) => s.hit)?.text).toBe("AGENT");
  });
  it("matches the longest keyword when several overlap", () => {
    expect(join(highlightKeywords("food spending card issue", ["card", "food spending card"]))).toBe("[food spending card] issue");
  });
  it("handles multiple matches", () => {
    expect(join(highlightKeywords("agent, human please", ["agent", "human"]))).toBe("[agent], [human] please");
  });
  it("returns one non-hit segment when no keywords / no match", () => {
    expect(highlightKeywords("nothing here", [])).toEqual([{ text: "nothing here", hit: false }]);
    expect(highlightKeywords("nothing here", ["zzz"])).toEqual([{ text: "nothing here", hit: false }]);
  });
  it("ignores blank keywords", () => {
    expect(join(highlightKeywords("hello", ["", "  "]))).toBe("hello");
  });
});
