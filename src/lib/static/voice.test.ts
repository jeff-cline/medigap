import { describe, it, expect } from "vitest";
import { buildMenuPrompt, matchSelection, isAfterHours, normalizeState } from "./voice";

const NODES = [{ id: "a", word: "Precision Medicine" }, { id: "b", word: "Weight Loss" }, { id: "c", word: "Peptides" }];

describe("buildMenuPrompt", () => {
  it("numbers each option and offers say-or-press", () => {
    const p = buildMenuPrompt(NODES);
    expect(p).toContain("Precision Medicine");
    expect(p).toContain("press 1");
    expect(p).toContain("press 3");
  });
});

describe("matchSelection", () => {
  it("matches a pressed digit to the 1-indexed node", () => {
    expect(matchSelection("", "2", NODES)).toBe("b");
    expect(matchSelection("", "3", NODES)).toBe("c");
  });
  it("matches spoken text case-insensitively by contains", () => {
    expect(matchSelection("i want weight loss please", "", NODES)).toBe("b");
    expect(matchSelection("PEPTIDES", "", NODES)).toBe("c");
  });
  it("returns null on no match or out-of-range digit", () => {
    expect(matchSelection("nonsense", "", NODES)).toBeNull();
    expect(matchSelection("", "9", NODES)).toBeNull();
  });
});

describe("isAfterHours", () => {
  const buyer = { afterHoursDays: "[2]", afterHoursStart: 0, afterHoursEnd: 8 * 60 }; // Tue, midnight–8am CST
  it("true inside the window on the listed weekday", () => {
    // 2026-07-14 is a Tuesday. 07:00 CDT = 12:00 UTC.
    expect(isAfterHours(buyer, Date.UTC(2026, 6, 14, 12, 0, 0))).toBe(true);
  });
  it("false outside the window", () => {
    // 10:00 CDT = 15:00 UTC (after 8am)
    expect(isAfterHours(buyer, Date.UTC(2026, 6, 14, 15, 0, 0))).toBe(false);
  });
  it("false when days empty", () => {
    expect(isAfterHours({ afterHoursDays: "[]", afterHoursStart: 0, afterHoursEnd: 480 }, Date.UTC(2026, 6, 14, 12, 0, 0))).toBe(false);
  });
});

describe("normalizeState", () => {
  it("maps full state names to 2-letter codes", () => {
    expect(normalizeState("texas")).toBe("TX");
    expect(normalizeState("New York")).toBe("NY");
    expect(normalizeState("CALIFORNIA")).toBe("CA");
  });
  it("handles compound state names", () => {
    expect(normalizeState("north carolina")).toBe("NC");
    expect(normalizeState("District of Columbia")).toBe("DC");
  });
  it("matches state name within longer text", () => {
    expect(normalizeState("I'm in California")).toBe("CA");
    expect(normalizeState("I'm calling from Texas")).toBe("TX");
  });
  it("accepts valid 2-letter codes case-insensitively", () => {
    expect(normalizeState("tx")).toBe("TX");
    expect(normalizeState("TX")).toBe("TX");
    expect(normalizeState("ny")).toBe("NY");
  });
  it("handles DC variations", () => {
    expect(normalizeState("washington dc")).toBe("DC");
    expect(normalizeState("dc")).toBe("DC");
  });
  it("returns empty string for unrecognized input", () => {
    expect(normalizeState("gibberish")).toBe("");
    expect(normalizeState("zz")).toBe("");
    expect(normalizeState("")).toBe("");
  });
  it("returns empty string for invalid 2-letter codes", () => {
    expect(normalizeState("xx")).toBe("");
  });
});
