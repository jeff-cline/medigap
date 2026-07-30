import { db } from "@/lib/db";
import { slugify, reorder, type FlatNode } from "./tree";

export type StaticRow = Awaited<ReturnType<typeof db.staticMoneyWord.findFirstOrThrow>>;

const EDITABLE = new Set(["word", "valueCents", "states", "ageRule", "contextPrompt", "askQuestionPrompt", "active", "sortOrder"]);

export async function listNodes(): Promise<StaticRow[]> {
  return db.staticMoneyWord.findMany({ orderBy: [{ sortOrder: "asc" }] });
}

export function toFlat(rows: StaticRow[]): FlatNode[] {
  return rows.map((r) => ({ id: r.id, parentId: r.parentId, sortOrder: r.sortOrder, active: r.active, word: r.word }));
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "word";
  let slug = root;
  for (let i = 2; await db.staticMoneyWord.findUnique({ where: { slug } }); i++) slug = `${root}-${i}`;
  return slug;
}

export async function createNode(input: { word: string; parentId?: string | null }): Promise<StaticRow> {
  const parentId = input.parentId ?? null;
  const agg = await db.staticMoneyWord.aggregate({ where: { parentId }, _max: { sortOrder: true } });
  return db.staticMoneyWord.create({
    data: { word: input.word.trim() || "New Money Word", slug: await uniqueSlug(input.word), parentId, sortOrder: (agg._max.sortOrder ?? -1) + 1 },
  });
}

export async function updateNode(id: string, patch: Record<string, unknown>): Promise<StaticRow> {
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) if (EDITABLE.has(k)) data[k] = v;
  if (typeof data.states === "object") data.states = JSON.stringify(data.states);
  if (typeof data.ageRule === "object") data.ageRule = JSON.stringify(data.ageRule);
  return db.staticMoneyWord.update({ where: { id }, data });
}

export async function deleteNode(id: string): Promise<void> {
  await db.staticMoneyWord.delete({ where: { id } });
}

export async function moveNode(id: string, dir: "up" | "down"): Promise<void> {
  const node = await db.staticMoneyWord.findUnique({ where: { id } });
  if (!node) return;
  const siblings = await db.staticMoneyWord.findMany({ where: { parentId: node.parentId } });
  const next = reorder(toFlat(siblings), id, dir);
  await db.$transaction(next.map((n) => db.staticMoneyWord.update({ where: { id: n.id }, data: { sortOrder: n.sortOrder } })));
}
