import { db } from "@/lib/db";

export type CloudEntry = { word: string; count: number; states: string[]; lastAt: Date };

// Aggregate no-buyer callbacks into a demand cloud: one entry per money word,
// highest-demand first. states = distinct caller states seen for that word.
export async function moneyWordCloud(): Promise<CloudEntry[]> {
  const rows = await db.staticCallback.findMany({ orderBy: { createdAt: "desc" } });
  const byWord = new Map<string, { count: number; states: Set<string>; lastAt: Date }>();
  for (const r of rows) {
    const e = byWord.get(r.word) ?? { count: 0, states: new Set<string>(), lastAt: r.createdAt };
    e.count += 1;
    if (r.state) e.states.add(r.state);
    if (r.createdAt > e.lastAt) e.lastAt = r.createdAt;
    byWord.set(r.word, e);
  }
  return [...byWord.entries()]
    .map(([word, e]) => ({ word, count: e.count, states: [...e.states], lastAt: e.lastAt }))
    .sort((a, b) => b.count - a.count);
}
