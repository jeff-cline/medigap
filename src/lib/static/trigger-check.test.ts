import { describe, it, expect } from "vitest";
import { triggerConflicts } from "./trigger-check";

const ctx = {
  moneyWords: ["Medicare", "Life Insurance"],
  rules: [
    { kind: "representative", trigger: "", active: true },
    { kind: "what", trigger: "", active: true },
    { kind: "custom", trigger: "reverse mortgage, cash out", active: true },
  ],
};

describe("triggerConflicts", () => {
  it("flags a trigger that overlaps a money word (shadowed)", () => {
    const c = triggerConflicts("medicare help", ctx);
    expect(c.some((m) => m.includes("money word") && m.includes("Medicare"))).toBe(true);
  });
  it("flags overlap with an existing custom rule", () => {
    const c = triggerConflicts("cash out my house", ctx);
    expect(c.some((m) => m.includes("existing rule"))).toBe(true);
  });
  it("flags a built-in representative overlap", () => {
    expect(triggerConflicts("representative", ctx).some((m) => m.includes("Representative"))).toBe(true);
    expect(triggerConflicts("agent", ctx).some((m) => m.includes("Representative"))).toBe(true);
  });
  it("no conflict for a clean, unique trigger", () => {
    expect(triggerConflicts("hearing aids", ctx)).toEqual([]);
  });
  it("handles empty / whitespace", () => {
    expect(triggerConflicts("", ctx)).toEqual([]);
    expect(triggerConflicts("  ,  ", ctx)).toEqual([]);
  });
});
