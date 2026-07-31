// A money-word node is "routable" if a call selecting it can ultimately reach a
// destination: it has active buyers, OR it runs a custom flow (flowKey), OR one of
// its active descendants is routable. Unconfigured placeholder sub-words (e.g. the
// default "New Sub-Word" with no buyers and no children) are NOT routable, so the
// call engine hides them from menus and routes the parent ("main word") instead.
export type RoutableNode = { id: string; active?: boolean; flowKey?: string | null; children?: RoutableNode[] };

export function routableIds(tree: RoutableNode[], hasBuyer: Set<string>): Set<string> {
  const out = new Set<string>();
  function visit(n: RoutableNode): boolean {
    let r = hasBuyer.has(n.id) || !!(n.flowKey && n.flowKey.length > 0);
    for (const c of (n.children ?? []).filter((c) => c.active !== false)) {
      if (visit(c)) r = true;
    }
    if (r) out.add(n.id);
    return r;
  }
  for (const n of tree) visit(n);
  return out;
}
