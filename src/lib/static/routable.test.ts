import { describe, it, expect } from "vitest";
import { routableIds, type RoutableNode } from "./routable";

describe("routableIds", () => {
  it("a parent whose only child is an empty placeholder is routable only if IT has buyers; the placeholder is not routable", () => {
    // "Save Money" -> ["New Sub-Word" placeholder, no buyers, no kids]
    const tree: RoutableNode[] = [
      { id: "save", active: true, children: [{ id: "sub", active: true, children: [] }] },
    ];
    const r = routableIds(tree, new Set()); // no buyers anywhere
    expect(r.has("sub")).toBe(false); // placeholder never routable -> never offered/spoken
    expect(r.has("save")).toBe(false); // save has no buyers and no routable kids
  });
  it("a child with buyers is routable and bubbles routability up to its parent", () => {
    const tree: RoutableNode[] = [
      { id: "save", active: true, children: [{ id: "sub", active: true, children: [] }] },
    ];
    const r = routableIds(tree, new Set(["sub"]));
    expect(r.has("sub")).toBe(true);
    expect(r.has("save")).toBe(true);
  });
  it("a flowKey node is routable even without buyers (custom flow handles routing)", () => {
    const tree: RoutableNode[] = [{ id: "medicare", active: true, flowKey: "medicare", children: [] }];
    expect(routableIds(tree, new Set()).has("medicare")).toBe(true);
  });
  it("routability bubbles up through a deep chain and ignores inactive nodes", () => {
    const tree: RoutableNode[] = [
      {
        id: "a", active: true,
        children: [
          { id: "b", active: true, children: [{ id: "c", active: true, children: [] }] },
          { id: "dead", active: false, children: [{ id: "x", active: true, children: [] }] },
        ],
      },
    ];
    const r = routableIds(tree, new Set(["c"]));
    expect(r.has("a")).toBe(true);
    expect(r.has("b")).toBe(true);
    expect(r.has("c")).toBe(true);
    expect(r.has("dead")).toBe(false); // inactive branch not walked for its own routability marker
  });
});
