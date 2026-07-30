export type FlatNode = { id: string; parentId: string | null; sortOrder: number; active: boolean; word: string };
export type TreeNode = FlatNode & { children: TreeNode[] };

export function slugify(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function buildTree(rows: FlatNode[]): TreeNode[] {
  const byParent = new Map<string | null, FlatNode[]>();
  for (const r of rows) {
    const key = r.parentId ?? null;
    (byParent.get(key) ?? byParent.set(key, []).get(key)!).push(r);
  }
  const build = (parentId: string | null): TreeNode[] =>
    (byParent.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((n) => ({ ...n, children: build(n.id) }));
  return build(null);
}

export function moneyWordsList(tree: TreeNode[]): string[] {
  return tree.filter((n) => n.active).map((n) => n.word);
}

export function reorder(siblings: FlatNode[], id: string, dir: "up" | "down"): { id: string; sortOrder: number }[] {
  const ordered = siblings.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const i = ordered.findIndex((n) => n.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ordered.length) return ordered.map((n) => ({ id: n.id, sortOrder: n.sortOrder }));
  [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  return ordered.map((n, idx) => ({ id: n.id, sortOrder: idx }));
}
