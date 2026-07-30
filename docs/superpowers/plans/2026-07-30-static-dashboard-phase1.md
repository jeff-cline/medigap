# Static Dashboard — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Static call-routing dashboard shell — a God-toggleable, independent alternative to the current "Fluid" flow — with a sortable/hierarchical Money-Word tab tree, per-tab core config, a `{money words list}` preview, and the Fluid⇄Static engine toggle. No live-call changes.

**Architecture:** New namespaced `StaticMoneyWord` Prisma model + `src/lib/static/*` (pure tree logic, DB store, engine flag, seed) + `/dashboard/static` God-only page + `/api/static/*` routes + an `EngineToggle` in the God dashboard layout. Fluid code is untouched. Data model is forward-compatible with documented Phase 2 (buyers/zip are additive tables).

**Tech Stack:** Next.js 16.2.9 (App Router), React 19, Prisma 6.19.3 + **SQLite** (dev), Tailwind v4, Vitest 2, `jose` JWT auth. `@/` path alias → `src/`.

## Global Constraints

- Prisma provider is **sqlite**; store JSON as `String`; no Postgres-only raw SQL. Schema changes apply via `npm run db:push` (there is NO migrations dir).
- Prisma client is the **extended** export: `import { db } from "@/lib/db"` (has `db.staticMoneyWord`, `db.setting`).
- Auth: `import { getSession } from "@/lib/auth"`; `import { isGod } from "@/lib/auth"` (`isGod(s) === s?.role === "god"`).
- Engine flag lives in the existing `Setting` model: `key = "activeEngine"`, `value = "fluid" | "static"`, default `"fluid"`.
- Do NOT modify Fluid files: `src/lib/u65*`, `src/lib/voice.ts`, `src/app/api/voice/*`, `src/app/api/u65/*`, `src/app/dashboard/u65/*`, the `MoneyWord` model.
- Tests: colocated `*.test.ts`, run with `npm test` (`vitest run`). Pure logic must be TDD (test first).
- **Only leaf nodes route to buyers** (Phase 2). A node with children is a category whose children form a sub-menu. The `{money words list}` = **enabled top-level** nodes, left-to-right by `sortOrder`.
- Seed order (top level), Home Services LAST: Precision Medicine · Concierge Medicine · Private Health Insurance · Weight Loss · Peptides · Life Insurance · Doctor · Home Services.
- Money format: `import { usd2 } from "@/lib/format"`. UI primitives: `import { Card, Section, Badge } from "@/components/ui"`.

## File Structure

- `prisma/schema.prisma` — **modify**: add `StaticMoneyWord` model.
- `src/lib/static/tree.ts` — **create**: pure tree logic (buildTree, moneyWordsList, reorder, slugify). Zero DB.
- `src/lib/static/tree.test.ts` — **create**: Vitest for tree.ts.
- `src/lib/static/store.ts` — **create**: Prisma CRUD over `StaticMoneyWord`.
- `src/lib/static/store.test.ts` — **create**: integration tests (create/reorder/delete against dev.db, self-cleaning).
- `src/lib/static/engine.ts` — **create**: `getActiveEngine`/`setActiveEngine` over `Setting`.
- `src/lib/static/engine.test.ts` — **create**: integration test.
- `src/lib/static/seed.ts` — **create**: seed data constant + `seedStaticMoneyWords(prisma)`.
- `prisma/seed.ts` — **modify**: call `seedStaticMoneyWords`.
- `src/app/api/static/tree/route.ts` — **create**: GET list + POST actions (god-gated).
- `src/app/api/static/engine/route.ts` — **create**: GET/POST engine flag (god-gated).
- `src/app/dashboard/static/page.tsx` — **create**: God-only server page (tree + config + preview).
- `src/components/static/StaticControls.tsx` — **create**: client editor (tree ops + node config form).
- `src/components/static/EngineToggle.tsx` — **create**: client Fluid⇄Static switch.
- `src/app/dashboard/layout.tsx` — **modify**: render `<EngineToggle>` for god.

---

### Task 1: `StaticMoneyWord` Prisma model

**Files:**
- Modify: `prisma/schema.prisma` (append the model)

**Interfaces:**
- Produces: table `StaticMoneyWord` with columns `id, parentId, sortOrder, active, word, slug(unique), valueCents, states, ageRule, contextPrompt, askQuestionPrompt, textTemplate?, aiModel?, aiVoice?, createdAt, updatedAt`; self-relation `children`/`parent`.

- [ ] **Step 1: Append the model to `prisma/schema.prisma`**

```prisma
// ---------------------------------------------------------------------------
// STATIC ENGINE — Phase 1 money-word tab tree (independent of Fluid's MoneyWord)
// ---------------------------------------------------------------------------
model StaticMoneyWord {
  id                String            @id @default(cuid())
  parentId          String?
  parent            StaticMoneyWord?  @relation("StaticTree", fields: [parentId], references: [id], onDelete: Cascade)
  children          StaticMoneyWord[] @relation("StaticTree")
  sortOrder         Int               @default(0)
  active            Boolean           @default(true)
  word              String
  slug              String            @unique
  valueCents        Int               @default(0)
  states            String            @default("[]") // JSON string[] of 2-letter codes; [] = all
  ageRule           String            @default("{}") // JSON { min?: number, max?: number }
  contextPrompt     String            @default("")
  askQuestionPrompt String            @default("")
  textTemplate      String?           // Phase 4 (reserved)
  aiModel           String?           // Phase 4 (reserved)
  aiVoice           String?           // Phase 4 (reserved)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([parentId, sortOrder])
}
```

- [ ] **Step 2: Apply the schema + regenerate client**

Run: `npm run db:push`
Expected: `Your database is now in sync with your Prisma schema.` and Prisma Client regenerated (no errors).

- [ ] **Step 3: Verify the model exists via a throwaway script**

Run:
```bash
npx tsx -e "import { db } from './src/lib/db'; (async()=>{const n=await db.staticMoneyWord.create({data:{word:'__probe__',slug:'__probe__'}});const g=await db.staticMoneyWord.findUnique({where:{id:n.id}});console.log('ok',g?.word);await db.staticMoneyWord.delete({where:{id:n.id}});})()"
```
Expected: prints `ok __probe__` and exits 0.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(static): add StaticMoneyWord model (Phase 1)"
```

---

### Task 2: Pure tree logic (`src/lib/static/tree.ts`)

**Files:**
- Create: `src/lib/static/tree.ts`
- Test: `src/lib/static/tree.test.ts`

**Interfaces:**
- Produces:
  - `type FlatNode = { id: string; parentId: string | null; sortOrder: number; active: boolean; word: string }`
  - `type TreeNode = FlatNode & { children: TreeNode[] }`
  - `buildTree(rows: FlatNode[]): TreeNode[]` — top-level (parentId null) sorted by sortOrder; children nested + sorted, recursively.
  - `moneyWordsList(tree: TreeNode[]): string[]` — words of **active top-level** nodes, left-to-right.
  - `slugify(word: string): string` — lowercase, spaces/punct → single `-`, trim dashes.
  - `reorder(siblings: FlatNode[], id: string, dir: "up" | "down"): { id: string; sortOrder: number }[]` — returns the new `sortOrder` for each sibling after moving `id` one slot in `dir` (no-op at the ends). Siblings are assumed same parent.

- [ ] **Step 1: Write the failing test** — `src/lib/static/tree.test.ts`

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/static/tree.test.ts`
Expected: FAIL — cannot find module `./tree` / functions undefined.

- [ ] **Step 3: Implement `src/lib/static/tree.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/static/tree.test.ts`
Expected: PASS (all tests green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/static/tree.ts src/lib/static/tree.test.ts
git commit -m "feat(static): pure tree logic (buildTree, moneyWordsList, reorder, slugify)"
```

---

### Task 3: DB store (`src/lib/static/store.ts`)

**Files:**
- Create: `src/lib/static/store.ts`
- Test: `src/lib/static/store.test.ts`

**Interfaces:**
- Consumes: `db` from `@/lib/db`; `slugify`, `reorder`, `type FlatNode` from `./tree`.
- Produces:
  - `listNodes(): Promise<StaticRow[]>` where `StaticRow` = the Prisma `StaticMoneyWord` row.
  - `toFlat(rows: StaticRow[]): FlatNode[]` — maps rows → `{id,parentId,sortOrder,active,word}`.
  - `createNode(input: { word: string; parentId?: string | null }): Promise<StaticRow>` — unique slug, sortOrder = (max sibling sortOrder)+1.
  - `updateNode(id: string, patch: Record<string, unknown>): Promise<StaticRow>` — whitelisted fields only.
  - `deleteNode(id: string): Promise<void>` (schema cascade removes subtree).
  - `moveNode(id: string, dir: "up" | "down"): Promise<void>` — swaps sortOrder with adjacent sibling using `reorder`.

- [ ] **Step 1: Write the failing test** — `src/lib/static/store.test.ts`

```ts
import { describe, it, expect, afterEach } from "vitest";
import { db } from "@/lib/db";
import { createNode, updateNode, deleteNode, moveNode, listNodes, toFlat } from "./store";

const MARK = "zzztest-"; // slugs of test rows start with this; cleaned up after each test

afterEach(async () => {
  const rows = await db.staticMoneyWord.findMany({ where: { slug: { startsWith: MARK } } });
  for (const r of rows) await db.staticMoneyWord.delete({ where: { id: r.id } }).catch(() => {});
});

async function mk(word: string, parentId: string | null = null) {
  const n = await createNode({ word, parentId });
  await db.staticMoneyWord.update({ where: { id: n.id }, data: { slug: MARK + n.slug } });
  return (await db.staticMoneyWord.findUnique({ where: { id: n.id } }))!;
}

describe("store", () => {
  it("creates with incrementing sortOrder among siblings", async () => {
    const a = await mk("Test Alpha");
    const b = await mk("Test Bravo");
    expect(b.sortOrder).toBeGreaterThan(a.sortOrder);
  });

  it("updates whitelisted fields and ignores others", async () => {
    const a = await mk("Test Ctx");
    const up = await updateNode(a.id, { contextPrompt: "hello", valueCents: 7500, id: "HACK" });
    expect(up.contextPrompt).toBe("hello");
    expect(up.valueCents).toBe(7500);
    expect(up.id).toBe(a.id); // id was NOT overwritten
  });

  it("moveNode swaps order with the adjacent sibling", async () => {
    const a = await mk("Test M1");
    const b = await mk("Test M2");
    await moveNode(b.id, "up");
    const flat = toFlat(await listNodes()).filter((n) => n.id === a.id || n.id === b.id).sort((x, y) => x.sortOrder - y.sortOrder);
    expect(flat[0].id).toBe(b.id);
  });

  it("deleteNode cascades to children", async () => {
    const p = await mk("Test Parent");
    const c = await mk("Test Child", p.id);
    await deleteNode(p.id);
    expect(await db.staticMoneyWord.findUnique({ where: { id: c.id } })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/static/store.test.ts`
Expected: FAIL — `./store` not found.

- [ ] **Step 3: Implement `src/lib/static/store.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/static/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/static/store.ts src/lib/static/store.test.ts
git commit -m "feat(static): DB store CRUD + reorder over StaticMoneyWord"
```

---

### Task 4: Engine flag store (`src/lib/static/engine.ts`)

**Files:**
- Create: `src/lib/static/engine.ts`
- Test: `src/lib/static/engine.test.ts`

**Interfaces:**
- Consumes: `db` from `@/lib/db`.
- Produces: `type Engine = "fluid" | "static"`; `getActiveEngine(): Promise<Engine>` (default `"fluid"`); `setActiveEngine(e: Engine): Promise<void>`.

- [ ] **Step 1: Write the failing test** — `src/lib/static/engine.test.ts`

```ts
import { describe, it, expect, afterAll } from "vitest";
import { db } from "@/lib/db";
import { getActiveEngine, setActiveEngine } from "./engine";

afterAll(async () => { await db.setting.delete({ where: { key: "activeEngine" } }).catch(() => {}); });

describe("engine flag", () => {
  it("defaults to fluid then round-trips static", async () => {
    await db.setting.delete({ where: { key: "activeEngine" } }).catch(() => {});
    expect(await getActiveEngine()).toBe("fluid");
    await setActiveEngine("static");
    expect(await getActiveEngine()).toBe("static");
    await setActiveEngine("fluid");
    expect(await getActiveEngine()).toBe("fluid");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/static/engine.test.ts`
Expected: FAIL — `./engine` not found.

- [ ] **Step 3: Implement `src/lib/static/engine.ts`**

```ts
import { db } from "@/lib/db";

export type Engine = "fluid" | "static";
const KEY = "activeEngine";

export async function getActiveEngine(): Promise<Engine> {
  const row = await db.setting.findUnique({ where: { key: KEY } }).catch(() => null);
  return row?.value === "static" ? "static" : "fluid";
}

export async function setActiveEngine(e: Engine): Promise<void> {
  const value = e === "static" ? "static" : "fluid";
  await db.setting.upsert({ where: { key: KEY }, update: { value }, create: { key: KEY, value } });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/static/engine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/static/engine.ts src/lib/static/engine.test.ts
git commit -m "feat(static): activeEngine flag store (fluid|static)"
```

---

### Task 5: Seed data (`src/lib/static/seed.ts` + wire into `prisma/seed.ts`)

**Files:**
- Create: `src/lib/static/seed.ts`
- Modify: `prisma/seed.ts` (add one import + one call inside `main()`)

**Interfaces:**
- Produces: `type SeedNode = { word: string; contextPrompt?: string; children?: SeedNode[] }`; `STATIC_SEED: SeedNode[]`; `seedStaticMoneyWords(prisma: { staticMoneyWord: any }): Promise<void>` — idempotent: inserts only if the table is empty.

- [ ] **Step 1: Implement `src/lib/static/seed.ts`**

```ts
import { slugify } from "./tree";

export type SeedNode = { word: string; contextPrompt?: string; children?: SeedNode[] };

const DOCTOR_911 =
  "If this is a medical emergency, hang up and dial 911. We are only a concierge voice engine.";

export const STATIC_SEED: SeedNode[] = [
  { word: "Precision Medicine" },
  { word: "Concierge Medicine" },
  { word: "Private Health Insurance" },
  { word: "Weight Loss" },
  { word: "Peptides" },
  { word: "Life Insurance" },
  {
    word: "Doctor",
    contextPrompt: DOCTOR_911,
    children: [
      { word: "Plastic Surgery" }, { word: "Chiropractor" }, { word: "Allergy" },
      { word: "Sexual Wellness" }, { word: "Weight Loss" }, { word: "General" },
    ],
  },
  {
    word: "Home Services", // last / default
    children: [
      { word: "Roofing" }, { word: "Plumbing" }, { word: "Air-Conditioning" }, { word: "Electrical" },
      { word: "Lawn" }, { word: "Gardening" }, { word: "Pool Maintenance" }, { word: "Handyman" },
    ],
  },
];

// Accepts any object exposing `.staticMoneyWord` (the plain PrismaClient from prisma/seed.ts or the extended db).
export async function seedStaticMoneyWords(prisma: { staticMoneyWord: any }): Promise<void> {
  const existing = await prisma.staticMoneyWord.count();
  if (existing > 0) return; // idempotent — never clobber real config

  const usedSlugs = new Set<string>();
  const slugFor = (word: string) => {
    const root = slugify(word) || "word";
    let s = root;
    for (let i = 2; usedSlugs.has(s); i++) s = `${root}-${i}`;
    usedSlugs.add(s);
    return s;
  };

  const insert = async (node: SeedNode, parentId: string | null, sortOrder: number) => {
    const row = await prisma.staticMoneyWord.create({
      data: {
        word: node.word, slug: slugFor(node.word), parentId, sortOrder,
        contextPrompt: node.contextPrompt ?? "",
      },
    });
    let i = 0;
    for (const child of node.children ?? []) await insert(child, row.id, i++);
  };

  let i = 0;
  for (const top of STATIC_SEED) await insert(top, null, i++);
}
```

- [ ] **Step 2: Wire into `prisma/seed.ts`**

Add near the top (after existing imports):
```ts
import { seedStaticMoneyWords } from "../src/lib/static/seed";
```
Add inside `main()` (after the settings block, before `main()` closes / before `.$disconnect`):
```ts
  // --- Static engine money-word tabs (idempotent) ---
  await seedStaticMoneyWords(db);
```

- [ ] **Step 3: Run the seeder + verify**

Run: `npm run db:seed`
Then verify:
```bash
npx tsx -e "import { db } from './src/lib/db'; (async()=>{const tops=await db.staticMoneyWord.findMany({where:{parentId:null},orderBy:{sortOrder:'asc'}});console.log('tops:',tops.map(t=>t.word).join(', '));const doc=tops.find(t=>t.word==='Doctor');console.log('doctor kids:',(await db.staticMoneyWord.count({where:{parentId:doc.id}})),'911?',/911/.test(doc.contextPrompt));const last=tops[tops.length-1];console.log('last:',last.word);})()"
```
Expected: `tops: Precision Medicine, Concierge Medicine, Private Health Insurance, Weight Loss, Peptides, Life Insurance, Doctor, Home Services`; `doctor kids: 6 911? true`; `last: Home Services`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/static/seed.ts prisma/seed.ts
git commit -m "feat(static): seed money-word tabs (Doctor 911, Home Services last)"
```

---

### Task 6: API routes (`/api/static/tree` + `/api/static/engine`)

**Files:**
- Create: `src/app/api/static/tree/route.ts`
- Create: `src/app/api/static/engine/route.ts`

**Interfaces:**
- Consumes: store fns from `@/lib/static/store`; engine fns from `@/lib/static/engine`; `getSession, isGod` from `@/lib/auth`.
- Produces:
  - `POST /api/static/tree` body `{ action: "create"|"update"|"move"|"delete", ... }`; `GET` → `{ nodes }`.
  - `GET /api/static/engine` → `{ engine }`; `POST /api/static/engine` body `{ engine }`.

- [ ] **Step 1: Implement `src/app/api/static/tree/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSession, isGod } from "@/lib/auth";
import { listNodes, createNode, updateNode, deleteNode, moveNode } from "@/lib/static/store";

async function guard() {
  const s = await getSession();
  return isGod(s) ? null : NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export async function GET() {
  const bad = await guard(); if (bad) return bad;
  return NextResponse.json({ nodes: await listNodes() });
}

export async function POST(req: NextRequest) {
  const bad = await guard(); if (bad) return bad;
  const body = await req.json().catch(() => ({} as any));
  switch (body.action) {
    case "create": return NextResponse.json(await createNode({ word: String(body.word ?? "New Money Word"), parentId: body.parentId ?? null }));
    case "update": return NextResponse.json(await updateNode(String(body.id), body.patch ?? {}));
    case "move":   await moveNode(String(body.id), body.dir === "down" ? "down" : "up"); return NextResponse.json({ ok: true });
    case "delete": await deleteNode(String(body.id)); return NextResponse.json({ ok: true });
    default:       return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
```

- [ ] **Step 2: Implement `src/app/api/static/engine/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSession, isGod } from "@/lib/auth";
import { getActiveEngine, setActiveEngine } from "@/lib/static/engine";

export async function GET() {
  return NextResponse.json({ engine: await getActiveEngine() });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!isGod(s)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({} as any));
  await setActiveEngine(body.engine === "static" ? "static" : "fluid");
  return NextResponse.json({ engine: await getActiveEngine() });
}
```

- [ ] **Step 3: Verify routes compile + gate**

Run: `npm run build`
Expected: build succeeds (routes type-check). Manual gate check happens in Task 9.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/static/tree/route.ts src/app/api/static/engine/route.ts
git commit -m "feat(static): god-gated /api/static/tree + /api/static/engine routes"
```

---

### Task 7: Dashboard page + controls (`/dashboard/static`)

**Files:**
- Create: `src/app/dashboard/static/page.tsx`
- Create: `src/components/static/StaticControls.tsx`

**Interfaces:**
- Consumes: `listNodes` from `@/lib/static/store`; `buildTree, moneyWordsList, type TreeNode` from `@/lib/static/tree`; `getSession, isGod` from `@/lib/auth`; `Card, Section` from `@/components/ui`; `usd2` from `@/lib/format`.
- Produces: God-only page rendering the tab tree, the selected node's config form, and the `{money words list}` preview.

- [ ] **Step 1: Implement the page `src/app/dashboard/static/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { getSession, isGod } from "@/lib/auth";
import { listNodes, toFlat } from "@/lib/static/store";
import { buildTree, moneyWordsList } from "@/lib/static/tree";
import { Card, Section } from "@/components/ui";
import StaticControls from "@/components/static/StaticControls";

export const dynamic = "force-dynamic";

export default async function StaticPage({ searchParams }: { searchParams: Promise<{ node?: string }> }) {
  const session = await getSession();
  if (!isGod(session)) redirect("/dashboard");
  const { node } = await searchParams;

  const rows = await listNodes();
  const tree = buildTree(toFlat(rows));
  const spoken = moneyWordsList(tree);

  return (
    <div className="space-y-6">
      <Section title="Static — Money Words">
        <Card>
          <div className="text-sm text-[var(--muted)] mb-2">What the AI speaks (top menu, left→right):</div>
          <div className="font-mono text-[var(--gold)]">
            {spoken.length ? spoken.join(" · ") : "No enabled tabs yet."}
          </div>
        </Card>
      </Section>
      <StaticControls rows={rows} selected={node ?? null} />
    </div>
  );
}
```

- [ ] **Step 2: Implement `src/components/static/StaticControls.tsx`**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Row = {
  id: string; parentId: string | null; sortOrder: number; active: boolean; word: string; slug: string;
  valueCents: number; states: string; ageRule: string; contextPrompt: string; askQuestionPrompt: string;
};

async function api(body: unknown) {
  await fetch("/api/static/tree", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export default function StaticControls({ rows, selected }: { rows: Row[]; selected: string | null }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  const [busy, setBusy] = useState(false);
  const run = async (body: unknown) => { setBusy(true); await api(body); setBusy(false); refresh(); };

  const topLevel = useMemo(() => rows.filter((r) => !r.parentId).sort((a, b) => a.sortOrder - b.sortOrder), [rows]);
  const sel = rows.find((r) => r.id === selected) ?? null;
  const children = useMemo(() => (sel ? rows.filter((r) => r.parentId === sel.id).sort((a, b) => a.sortOrder - b.sortOrder) : []), [rows, sel]);

  const TabRow = ({ items, label }: { items: Row[]; label: string }) => (
    <div className="mb-4">
      <div className="text-xs uppercase text-[var(--muted)] mb-1">{label}</div>
      <div className="flex flex-wrap gap-2 items-center">
        {items.map((r) => (
          <div key={r.id} className={`flex items-center gap-1 rounded px-2 py-1 border ${selected === r.id ? "border-[var(--gold)]" : "border-[var(--border)]"} ${r.active ? "" : "opacity-50"}`}>
            <button className="font-medium" onClick={() => router.push(`/dashboard/static?node=${r.id}`)}>{r.word}</button>
            <button title="left" disabled={busy} onClick={() => run({ action: "move", id: r.id, dir: "up" })}>◀</button>
            <button title="right" disabled={busy} onClick={() => run({ action: "move", id: r.id, dir: "down" })}>▶</button>
            <button title="on/off" disabled={busy} onClick={() => run({ action: "update", id: r.id, patch: { active: !r.active } })}>{r.active ? "🟢" : "⚪"}</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <TabRow items={topLevel} label="Top-level tabs" />
      <div className="flex gap-2">
        <button className="btn" disabled={busy} onClick={() => run({ action: "create", parentId: null, word: "New Money Word" })}>+ Add tab</button>
        {sel && <button className="btn" disabled={busy} onClick={() => run({ action: "create", parentId: sel.id, word: "New Sub-Word" })}>+ Make sub-tab of “{sel.word}”</button>}
      </div>

      {sel && (
        <>
          {children.length > 0 && <TabRow items={children} label={`Sub-tabs of “${sel.word}”`} />}
          <NodeForm key={sel.id} row={sel} busy={busy} onSave={(patch) => run({ action: "update", id: sel.id, patch })} onDelete={() => { if (confirm(`Delete “${sel.word}” and its sub-tabs?`)) run({ action: "delete", id: sel.id }); router.push("/dashboard/static"); }} />
        </>
      )}
    </div>
  );
}

function NodeForm({ row, busy, onSave, onDelete }: { row: Row; busy: boolean; onSave: (patch: Record<string, unknown>) => void; onDelete: () => void }) {
  const [word, setWord] = useState(row.word);
  const [valueDollars, setValueDollars] = useState((row.valueCents / 100).toString());
  const [statesCsv, setStatesCsv] = useState((JSON.parse(row.states || "[]") as string[]).join(", "));
  const [ctx, setCtx] = useState(row.contextPrompt);
  const [ask, setAsk] = useState(row.askQuestionPrompt);
  const ageRule = JSON.parse(row.ageRule || "{}") as { min?: number; max?: number };
  const [ageMin, setAgeMin] = useState(ageRule.min?.toString() ?? "");
  const [ageMax, setAgeMax] = useState(ageRule.max?.toString() ?? "");

  const save = () => onSave({
    word: word.trim(),
    valueCents: Math.round((parseFloat(valueDollars) || 0) * 100),
    states: statesCsv.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
    ageRule: { ...(ageMin ? { min: +ageMin } : {}), ...(ageMax ? { max: +ageMax } : {}) },
    contextPrompt: ctx, askQuestionPrompt: ask,
  });

  const L = "block text-xs uppercase text-[var(--muted)] mb-1";
  const F = "w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 mb-3";
  return (
    <div className="rounded-lg border border-[var(--border)] p-4 max-w-2xl">
      <div className="text-lg font-semibold mb-3">Config — {row.word}</div>
      <label className={L}>Name</label><input className={F} value={word} onChange={(e) => setWord(e.target.value)} />
      <div className="grid grid-cols-3 gap-3">
        <div><label className={L}>Value ($)</label><input className={F} value={valueDollars} onChange={(e) => setValueDollars(e.target.value)} /></div>
        <div><label className={L}>Age min</label><input className={F} value={ageMin} onChange={(e) => setAgeMin(e.target.value)} /></div>
        <div><label className={L}>Age max</label><input className={F} value={ageMax} onChange={(e) => setAgeMax(e.target.value)} /></div>
      </div>
      <label className={L}>States (CSV, blank = all)</label><input className={F} value={statesCsv} onChange={(e) => setStatesCsv(e.target.value)} placeholder="TX, FL, CA" />
      <label className={L}>Context prompt</label><textarea className={F} rows={3} value={ctx} onChange={(e) => setCtx(e.target.value)} />
      <label className={L}>Ask-this-question prompt</label><textarea className={F} rows={2} value={ask} onChange={(e) => setAsk(e.target.value)} />
      <div className="text-xs text-[var(--muted)] mb-3">Buyers · ZIP rules · text template · voice — <b>Phase 2/4</b>.</div>
      <div className="flex gap-2">
        <button className="btn" disabled={busy} onClick={save}>Save</button>
        <button className="btn" disabled={busy} onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build + render**

Run: `npm run build`
Expected: compiles. Then `npm run dev`, log in as god, visit `/dashboard/static` — the seeded tabs render; clicking a tab shows its config; the `{money words list}` preview lists the enabled top-level words.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/static/page.tsx src/components/static/StaticControls.tsx
git commit -m "feat(static): /dashboard/static page — tab tree, config form, money-words preview"
```

---

### Task 8: God nav Fluid⇄Static toggle

**Files:**
- Create: `src/components/static/EngineToggle.tsx`
- Modify: `src/app/dashboard/layout.tsx` (render the toggle for god)

**Interfaces:**
- Consumes: `getActiveEngine` from `@/lib/static/engine`; `isGod` from `@/lib/auth`.
- Produces: a top-of-dashboard switch (god-only) that flips `activeEngine` and navigates to the active dashboard.

- [ ] **Step 1: Implement `src/components/static/EngineToggle.tsx`**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EngineToggle({ current }: { current: "fluid" | "static" }) {
  const router = useRouter();
  const [engine, setEngine] = useState(current);
  const [busy, setBusy] = useState(false);

  const flip = async (next: "fluid" | "static") => {
    if (busy || next === engine) return;
    setBusy(true);
    await fetch("/api/static/engine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ engine: next }) });
    setEngine(next);
    setBusy(false);
    router.push(next === "static" ? "/dashboard/static" : "/dashboard/u65");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] text-sm">
      <span className="text-[var(--muted)] uppercase text-xs tracking-wide">Active engine</span>
      <div className="inline-flex rounded-full border border-[var(--border)] overflow-hidden">
        <button disabled={busy} onClick={() => flip("fluid")} className={`px-3 py-1 ${engine === "fluid" ? "bg-[var(--gold)] text-black font-semibold" : ""}`}>Fluid</button>
        <button disabled={busy} onClick={() => flip("static")} className={`px-3 py-1 ${engine === "static" ? "bg-[var(--gold)] text-black font-semibold" : ""}`}>Static</button>
      </div>
      <span className="text-[10px] text-[var(--muted)]">(Phase 1: dashboard only — live calls stay on Fluid)</span>
    </div>
  );
}
```

- [ ] **Step 2: Render it in `src/app/dashboard/layout.tsx` for god**

Add imports:
```ts
import { isGod } from "@/lib/auth";
import { getActiveEngine } from "@/lib/static/engine";
import EngineToggle from "@/components/static/EngineToggle";
```
Inside the component, after `const session = await getSession();` and the redirects, before the return, compute:
```ts
  const engine = isGod(session) ? await getActiveEngine() : null;
```
Then in the JSX, immediately inside `<div className="flex-1 min-w-0">` (above `<UnitTabs .../>`):
```tsx
        {engine && <EngineToggle current={engine} />}
```

- [ ] **Step 3: Verify**

Run: `npm run build` (expected: compiles). Then `npm run dev`, log in as god: the **Active engine** switch shows at the top; clicking **Static** navigates to `/dashboard/static`, **Fluid** back to `/dashboard/u65`; reloading preserves the choice. Confirm the U65/Fluid pages still work unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/components/static/EngineToggle.tsx src/app/dashboard/layout.tsx
git commit -m "feat(static): Fluid<->Static engine toggle in god dashboard nav"
```

---

### Task 9: Full test + build + smoke

**Files:** none (verification only)

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: all tests pass, including the three new Static suites.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: compiles with no type errors; `/dashboard/static`, `/api/static/tree`, `/api/static/engine` appear in the route list.

- [ ] **Step 3: Manual smoke (god account)**

- Toggle Fluid⇄Static (persists on reload; Fluid pages unchanged).
- `/dashboard/static`: add a top-level tab; reorder it; toggle it off → it disappears from the `{money words list}` preview; add a sub-tab under Doctor; edit a node's value/states/prompts and Save; delete a test node.
- Confirm the non-god case: a non-god session hitting `/dashboard/static` redirects to `/dashboard`; POSTing `/api/static/tree` returns 403.

- [ ] **Step 4: Commit any final touch-ups** (if none, skip).

---

## Self-Review

**Spec coverage:** ✅ toggle (T8, engine store T4), tab tree + sort + hierarchy + on/off + add + sub-tab (T2/T3/T7), StaticMoneyWord model with reserved Phase-4 columns + Phase-2-additive design (T1, §4.2 of spec — no Phase-2 tables built here, per plan), core config value/states/age/prompts (T7), `{money words list}` preview (T2 `moneyWordsList` + T7), seed w/ Doctor 911 + Home Services last (T5), God-only gating (T6/T7), SQLite-safe JSON strings (T1/T3), tests (T2/T3/T4). Phase-2/3/4 fields intentionally not built (documented only) — matches approved scope.

**Placeholder scan:** none — every step has real code/commands.

**Type consistency:** `FlatNode`/`TreeNode` (tree.ts) reused by store.ts + page; `StaticRow` from store.ts; `Engine` from engine.ts; `Row` shape in StaticControls matches the Prisma columns; API `{action,id,patch,dir,parentId,word,engine}` used consistently across route + components.
