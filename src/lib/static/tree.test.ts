import { describe, it, expect } from "vitest";
import { buildTree, moneyWordsList, slugify, reorder, type FlatNode } from "./tree";

const N = (id: string, word: string, sortOrder: number, parentId: string | null = null, active = true): FlatNode =>
  ({ id, word, sortOrder, parentId, active });

describe("slugify", () => {
  it("lowercases and dashes", () => {
    expect(slugify("Precision Medicine")).toBe("precision-medicine");
    expect(slugify("Air-Conditioning!! ")).toBe("air-conditioning");
  });
});

describe("buildTree", () => {
  it("nests children under parents, both sorted by sortOrder", () => {
    const rows = [
      N("a", "Alpha", 1), N("b", "Bravo", 0),
      N("b1", "Bravo One", 1, "b"), N("b0", "Bravo Zero", 0, "b"),
    ];
    const t = buildTree(rows);
    expect(t.map((n) => n.id)).toEqual(["b", "a"]);
    expect(t[0].children.map((c) => c.id)).toEqual(["b0", "b1"]);
  });
});

describe("moneyWordsList", () => {
  it("returns active top-level words left-to-right, skipping inactive and children", () => {
    const rows = [
      N("a", "Alpha", 0), N("b", "Bravo", 1, null, false), N("c", "Charlie", 2),
      N("a1", "Alpha One", 0, "a"),
    ];
    expect(moneyWordsList(buildTree(rows))).toEqual(["Alpha", "Charlie"]);
  });
});

describe("reorder", () => {
  it("moves a node up one slot", () => {
    const sibs = [N("a", "A", 0), N("b", "B", 1), N("c", "C", 2)];
    const out = reorder(sibs, "c", "up");
    const order = [...out].sort((x, y) => x.sortOrder - y.sortOrder).map((o) => o.id);
    expect(order).toEqual(["a", "c", "b"]);
  });
  it("is a no-op at the top edge", () => {
    const sibs = [N("a", "A", 0), N("b", "B", 1)];
    const out = reorder(sibs, "a", "up");
    const order = [...out].sort((x, y) => x.sortOrder - y.sortOrder).map((o) => o.id);
    expect(order).toEqual(["a", "b"]);
  });
});
