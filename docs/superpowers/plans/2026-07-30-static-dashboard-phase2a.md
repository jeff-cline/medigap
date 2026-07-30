# Static Dashboard — Phase 2A Implementation Plan (Buyer Routing Core)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the per-leaf **buyer routing data layer + SWRR selection engine + god-only buyer admin UI** to the Static dashboard — additive-only, admin/data only, with NO change to the live voice webhook (that is Phase 2B).

**Architecture:** New `StaticBuyer` + `StaticZipRule` Prisma tables (attached to `StaticMoneyWord` via virtual back-relations — no change to the Phase-1 table). New `src/lib/static/swrr.ts` (pure, TDD Smooth-Weighted-Round-Robin selector + CST daily helpers) and `src/lib/static/buyers.ts` (DB CRUD). New god-gated `/api/static/buyers` route. A new client `BuyerPanel` embedded in the existing `StaticControls` config panel, shown only for **leaf** nodes.

**Tech Stack:** Next.js 16.2.9 (App Router), React 19, Prisma 6.19.3 + **SQLite** (dev; Postgres prod), Vitest 2, `jose` JWT auth. `@/` path alias → `src/`.

## Global Constraints

- Prisma provider is **sqlite** (dev); store JSON as `String`; no Postgres-only raw SQL. Schema changes apply via `npm run db:push` (there is NO migrations dir).
- Prisma client is the **extended** export: `import { db } from "@/lib/db"` (has `db.staticBuyer`, `db.staticZipRule`, `db.staticMoneyWord`).
- Auth: `import { getSession, isGod } from "@/lib/auth"` (`isGod(s) === s?.role === "god"`). Every API handler god-gates BEFORE any work.
- **Additive-only / forward-compat:** do NOT alter any existing `StaticMoneyWord` row or column. Adding the two back-relation fields (`buyers`, `zipRules`) is virtual (no column/DDL on `static_money_word`).
- **Only LEAF nodes route** — a leaf is a `StaticMoneyWord` with no children. Buyers/ZIP rules attach only to leaves. Category nodes (with children) never get a buyer UI.
- Do NOT modify Fluid files (`src/lib/u65*`, `src/lib/voice.ts`, `src/app/api/voice/*`, `src/app/api/u65/*`, `src/app/dashboard/u65/*`, the `MoneyWord` model) or the live voice webhook. NO live-call behavior changes in 2A.
- Tests: colocated `*.test.ts`, run with `npm test` (`vitest run`). Pure logic (swrr.ts) is TDD (test first).
- Model fields copied **verbatim** from spec §4.2 (`docs/superpowers/specs/2026-07-30-static-call-routing-dashboard-design.md`). `afterHoursStart`/`afterHoursEnd` = minutes-from-midnight CST. `afterHoursDays` = JSON array of weekday numbers (0=Sun..6=Sat) as a String.
- ZIP rules: exact-ZIP match is in scope. `radiusMiles` is **stored** but geo-radius resolution is **DEFERRED to Phase 2B** (no geo lookup in 2A).
- Follow existing Phase-1 static patterns: `store.ts` EDITABLE-whitelist + `JSON.stringify` for JSON-String fields; API `guard()` helper returning 403; client `run()`/`api()` fetch with `res.ok` check + error banner.

## File Structure

- `prisma/schema.prisma` — **modify**: add `StaticBuyer` + `StaticZipRule` models; add `buyers`/`zipRules` back-relations to `StaticMoneyWord`.
- `src/lib/static/swrr.ts` — **create**: pure SWRR selector + CST daily helpers. Zero DB.
- `src/lib/static/swrr.test.ts` — **create**: Vitest for swrr.ts.
- `src/lib/static/buyers.ts` — **create**: Prisma CRUD over `StaticBuyer` + `StaticZipRule`.
- `src/lib/static/buyers.test.ts` — **create**: integration tests (self-cleaning).
- `src/app/api/static/buyers/route.ts` — **create**: GET (list by moneyWordId) + POST (actions), god-gated.
- `src/components/static/BuyerPanel.tsx` — **create**: client buyer + zip-rule editor for a leaf.
- `src/components/static/StaticControls.tsx` — **modify**: pass `isLeaf` to `NodeForm`; render `<BuyerPanel>` for leaves in place of the Phase-2 placeholder line.

---

### Task 1: `StaticBuyer` + `StaticZipRule` models

**Files:**
- Modify: `prisma/schema.prisma` (append two models; add two back-relation fields to `StaticMoneyWord`)

**Interfaces:**
- Produces: tables `StaticBuyer` (`@@map` not required; keep model name) and `StaticZipRule`; back-relations `StaticMoneyWord.buyers: StaticBuyer[]`, `StaticMoneyWord.zipRules: StaticZipRule[]`. Prisma client gains `db.staticBuyer`, `db.staticZipRule`.

- [ ] **Step 1: Add the two back-relation fields to the `StaticMoneyWord` model**

In `prisma/schema.prisma`, inside `model StaticMoneyWord { ... }`, immediately after the `aiVoice String?` line (before `createdAt`), add:

```prisma
  buyers            StaticBuyer[]
  zipRules          StaticZipRule[]
```

- [ ] **Step 2: Append the two new models at the end of `prisma/schema.prisma`**

```prisma
// ---------------------------------------------------------------------------
// STATIC ENGINE — Phase 2 buyer routing (additive; leaves only)
// ---------------------------------------------------------------------------
model StaticBuyer {
  id               String          @id @default(cuid())
  moneyWordId      String
  moneyWord        StaticMoneyWord @relation(fields: [moneyWordId], references: [id], onDelete: Cascade)
  name             String
  defaultNumber    String          // primary DID we transfer to (E.164)
  afterHoursNumber String?         // used during this buyer's after-hours window
  backupNumber     String?         // used if default/after-hours don't connect
  afterHoursDays   String          @default("[]") // JSON array of weekday numbers (0=Sun..6=Sat)
  afterHoursStart  Int?            // minutes-from-midnight (CST) after-hours window start
  afterHoursEnd    Int?            // minutes-from-midnight (CST) after-hours window end
  active           Boolean         @default(true)
  dailyCap         Int             @default(0) // 0 = unlimited
  priorityWeight   Int             @default(1) // relative weight for weighted round-robin
  dailyCount       Int             @default(0) // resets daily (CST)
  swrrCurrent      Int             @default(0) // smooth-weighted-round-robin running counter
  lastAssignedAt   DateTime?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  @@index([moneyWordId, active])
  @@map("static_buyer")
}

model StaticZipRule {
  id          String          @id @default(cuid())
  moneyWordId String
  moneyWord   StaticMoneyWord @relation(fields: [moneyWordId], references: [id], onDelete: Cascade)
  buyerId     String          // references StaticBuyer.id (no FK; plain id per spec)
  zip         String          // center ZIP
  radiusMiles Int             @default(0) // 0 = exact ZIP only (radius resolution = Phase 2B)
  createdAt   DateTime        @default(now())

  @@index([moneyWordId, zip])
  @@map("static_zip_rule")
}
```

- [ ] **Step 3: Apply the schema + regenerate client**

Run: `npm run db:push`
Expected: `Your database is now in sync with your Prisma schema.` and Prisma Client regenerated, no errors.

- [ ] **Step 4: Verify the models exist via a throwaway script**

Run:
```bash
npx tsx -e "import { db } from './src/lib/db'; (async()=>{const m=await db.staticMoneyWord.findFirst(); const b=await db.staticBuyer.create({data:{moneyWordId:m.id,name:'__probe__',defaultNumber:'+15550000000'}}); const z=await db.staticZipRule.create({data:{moneyWordId:m.id,buyerId:b.id,zip:'75001'}}); console.log('ok', b.name, z.zip); await db.staticZipRule.delete({where:{id:z.id}}); await db.staticBuyer.delete({where:{id:b.id}});})()"
```
Expected: prints `ok __probe__ 75001` and exits 0.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(static): StaticBuyer + StaticZipRule models (Phase 2A)"
```

> **Controller note (dirty tree):** `prisma/schema.prisma` also carries the user's uncommitted predictivedata WIP. Stage ONLY the Static-2A hunks (the two back-relation lines + the two appended models) using the isolated-staging technique — reconstruct `git show HEAD:prisma/schema.prisma`, re-apply just these hunks, `git add`, then restore the working tree — so the Pd WIP stays uncommitted. Do the `db:push` against the full working schema (it is additive; it will also create the two new tables).

---

### Task 2: Pure SWRR selector + CST daily helpers (`src/lib/static/swrr.ts`)

**Files:**
- Create: `src/lib/static/swrr.ts`
- Test: `src/lib/static/swrr.test.ts`

**Interfaces:**
- Consumes: nothing (pure).
- Produces:
  - `type SwrrBuyer = { id: string; priorityWeight: number; swrrCurrent: number; active: boolean; dailyCap: number; dailyCount: number }`
  - `eligible(buyers: SwrrBuyer[]): SwrrBuyer[]` — active AND under-cap (`dailyCap === 0 || dailyCount < dailyCap`).
  - `selectBuyer(buyers: SwrrBuyer[]): { chosenId: string | null; next: SwrrBuyer[] }` — one SWRR step over the eligible pool; `next` is `buyers` with updated `swrrCurrent` for pool members (others unchanged); does NOT mutate input, does NOT touch `dailyCount` (caller increments on the chosen).
  - `cstDayKey(epochMs: number): string` — `YYYY-MM-DD` in `America/Chicago` (DST-correct via `Intl`).
  - `applyDailyReset(buyers: SwrrBuyer[], prevKey: string, nowKey: string): { reset: boolean; next: SwrrBuyer[] }` — if `prevKey !== nowKey`, zero every `dailyCount`; else unchanged.

- [ ] **Step 1: Write the failing test**

Create `src/lib/static/swrr.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { eligible, selectBuyer, cstDayKey, applyDailyReset, type SwrrBuyer } from "./swrr";

const B = (id: string, w: number, over: Partial<SwrrBuyer> = {}): SwrrBuyer =>
  ({ id, priorityWeight: w, swrrCurrent: 0, active: true, dailyCap: 0, dailyCount: 0, ...over });

describe("eligible", () => {
  it("drops inactive and capped buyers", () => {
    const pool = eligible([
      B("a", 1),
      B("b", 1, { active: false }),
      B("c", 1, { dailyCap: 5, dailyCount: 5 }),
      B("d", 1, { dailyCap: 5, dailyCount: 4 }),
    ]);
    expect(pool.map((p) => p.id)).toEqual(["a", "d"]);
  });
});

describe("selectBuyer SWRR", () => {
  it("returns null when no buyer is eligible", () => {
    const r = selectBuyer([B("a", 1, { active: false })]);
    expect(r.chosenId).toBeNull();
    expect(r.next).toHaveLength(1);
  });

  it("distributes 9:1 interleaved (not blocky) over 10 picks", () => {
    let buyers = [B("a", 9), B("b", 1)];
    const seq: string[] = [];
    for (let i = 0; i < 10; i++) {
      const r = selectBuyer(buyers);
      seq.push(r.chosenId!);
      buyers = r.next;
    }
    const counts = seq.reduce<Record<string, number>>((m, id) => ((m[id] = (m[id] ?? 0) + 1), m), {});
    expect(counts).toEqual({ a: 9, b: 1 });
    // interleaved: b must NOT be the very first or last of a "9 then 1" block — it lands mid-sequence
    expect(seq.indexOf("b")).toBeGreaterThan(0);
    expect(seq.indexOf("b")).toBeLessThan(9);
  });

  it("redistributes a disabled buyer's share to the rest", () => {
    // c is off → only a(8) and b(2) split 10 picks 8:2
    let buyers = [B("a", 8), B("b", 2), B("c", 90, { active: false })];
    const seq: string[] = [];
    for (let i = 0; i < 10; i++) {
      const r = selectBuyer(buyers);
      seq.push(r.chosenId!);
      buyers = r.next;
    }
    const counts = seq.reduce<Record<string, number>>((m, id) => ((m[id] = (m[id] ?? 0) + 1), m), {});
    expect(counts).toEqual({ a: 8, b: 2 });
  });

  it("is deterministic on a tie (lowest index wins)", () => {
    const r = selectBuyer([B("a", 1), B("b", 1)]);
    expect(r.chosenId).toBe("a");
  });
});

describe("cstDayKey", () => {
  it("formats an epoch ms as America/Chicago YYYY-MM-DD", () => {
    // 2026-07-15 03:00 UTC = 2026-07-14 22:00 CDT (still the 14th in Chicago)
    expect(cstDayKey(Date.UTC(2026, 6, 15, 3, 0, 0))).toBe("2026-07-14");
    // 2026-07-15 12:00 UTC = 2026-07-15 07:00 CDT
    expect(cstDayKey(Date.UTC(2026, 6, 15, 12, 0, 0))).toBe("2026-07-15");
  });
});

describe("applyDailyReset", () => {
  it("zeroes dailyCount on a new CST day", () => {
    const r = applyDailyReset([B("a", 1, { dailyCount: 7 })], "2026-07-14", "2026-07-15");
    expect(r.reset).toBe(true);
    expect(r.next[0].dailyCount).toBe(0);
  });
  it("leaves counts untouched on the same day", () => {
    const r = applyDailyReset([B("a", 1, { dailyCount: 7 })], "2026-07-15", "2026-07-15");
    expect(r.reset).toBe(false);
    expect(r.next[0].dailyCount).toBe(7);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/static/swrr.test.ts`
Expected: FAIL — `Cannot find module './swrr'` / exports undefined.

- [ ] **Step 3: Write the implementation**

Create `src/lib/static/swrr.ts`:

```ts
// Pure Smooth-Weighted-Round-Robin (nginx algorithm) over buyers, plus CST daily helpers.
// No DB, no Date.now() — all time flows in as epoch ms so it stays deterministic and testable.

export type SwrrBuyer = {
  id: string;
  priorityWeight: number;
  swrrCurrent: number;
  active: boolean;
  dailyCap: number;   // 0 = unlimited
  dailyCount: number;
};

export function eligible(buyers: SwrrBuyer[]): SwrrBuyer[] {
  return buyers.filter((b) => b.active && (b.dailyCap === 0 || b.dailyCount < b.dailyCap));
}

// One SWRR step. Returns the chosen id and a NEW buyers array with updated swrrCurrent
// for the eligible pool (ineligible buyers are returned unchanged). Does not touch dailyCount.
export function selectBuyer(buyers: SwrrBuyer[]): { chosenId: string | null; next: SwrrBuyer[] } {
  const pool = eligible(buyers);
  if (pool.length === 0) return { chosenId: null, next: buyers.map((b) => ({ ...b })) };

  const total = pool.reduce((s, b) => s + Math.max(0, b.priorityWeight), 0);
  // add each pool buyer's weight to its current
  const cur = new Map<string, number>();
  for (const b of pool) cur.set(b.id, b.swrrCurrent + Math.max(0, b.priorityWeight));

  // pick the highest current; on a tie the earliest in the pool wins (deterministic)
  let chosen = pool[0];
  for (const b of pool) if ((cur.get(b.id) ?? 0) > (cur.get(chosen.id) ?? 0)) chosen = b;

  // subtract total weight from the chosen buyer's current
  cur.set(chosen.id, (cur.get(chosen.id) ?? 0) - total);

  const next = buyers.map((b) => (cur.has(b.id) ? { ...b, swrrCurrent: cur.get(b.id)! } : { ...b }));
  return { chosenId: chosen.id, next };
}

// YYYY-MM-DD in America/Chicago (DST-correct). Pure: depends only on the input ms.
export function cstDayKey(epochMs: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(epochMs));
  return parts; // en-CA formats as YYYY-MM-DD
}

// Reset dailyCount to 0 for every buyer when the CST day has rolled over.
export function applyDailyReset(
  buyers: SwrrBuyer[],
  prevKey: string,
  nowKey: string,
): { reset: boolean; next: SwrrBuyer[] } {
  if (prevKey === nowKey) return { reset: false, next: buyers.map((b) => ({ ...b })) };
  return { reset: true, next: buyers.map((b) => ({ ...b, dailyCount: 0 })) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/static/swrr.test.ts`
Expected: PASS (all cases). Then `npm test` → whole suite green, no regressions.

- [ ] **Step 5: Commit**

```bash
git add src/lib/static/swrr.ts src/lib/static/swrr.test.ts
git commit -m "feat(static): pure SWRR buyer selector + CST daily helpers (Phase 2A)"
```

---

### Task 3: Buyer + ZIP-rule DB store (`src/lib/static/buyers.ts`)

**Files:**
- Create: `src/lib/static/buyers.ts`
- Test: `src/lib/static/buyers.test.ts`

**Interfaces:**
- Consumes: `db` from `@/lib/db`.
- Produces:
  - `type BuyerRow = Awaited<ReturnType<typeof db.staticBuyer.findFirstOrThrow>>`
  - `type ZipRuleRow = Awaited<ReturnType<typeof db.staticZipRule.findFirstOrThrow>>`
  - `listBuyers(moneyWordId: string): Promise<BuyerRow[]>` (ordered by `createdAt` asc)
  - `createBuyer(input: { moneyWordId: string; name?: string; defaultNumber?: string }): Promise<BuyerRow>`
  - `updateBuyer(id: string, patch: Record<string, unknown>): Promise<BuyerRow>` (whitelisted fields; `afterHoursDays` array → JSON string)
  - `deleteBuyer(id: string): Promise<void>`
  - `listZipRules(moneyWordId: string): Promise<ZipRuleRow[]>`
  - `createZipRule(input: { moneyWordId: string; buyerId: string; zip: string; radiusMiles?: number }): Promise<ZipRuleRow>`
  - `deleteZipRule(id: string): Promise<void>`

- [ ] **Step 1: Write the failing test**

Create `src/lib/static/buyers.test.ts`:

```ts
import { describe, it, expect, afterEach } from "vitest";
import { db } from "@/lib/db";
import { listBuyers, createBuyer, updateBuyer, deleteBuyer, listZipRules, createZipRule, deleteZipRule } from "./buyers";

// self-cleaning: every test money word uses a zzztest- slug; cascade removes its buyers/zip rules
async function makeLeaf(): Promise<string> {
  const n = await db.staticMoneyWord.create({ data: { word: "zzztest leaf", slug: `zzztest-${Date.now()}-${Math.round(Math.random() * 1e6)}` } });
  return n.id;
}
afterEach(async () => {
  await db.staticMoneyWord.deleteMany({ where: { slug: { startsWith: "zzztest-" } } });
});

describe("buyers store", () => {
  it("creates, lists, updates and deletes a buyer", async () => {
    const mw = await makeLeaf();
    const b = await createBuyer({ moneyWordId: mw, name: "Acme", defaultNumber: "+15551230000" });
    expect(b.name).toBe("Acme");
    expect(b.priorityWeight).toBe(1);

    const listed = await listBuyers(mw);
    expect(listed.map((x) => x.id)).toContain(b.id);

    const up = await updateBuyer(b.id, { priorityWeight: 9, dailyCap: 50, active: false, afterHoursDays: [0, 6], id: "HACK" });
    expect(up.priorityWeight).toBe(9);
    expect(up.dailyCap).toBe(50);
    expect(up.active).toBe(false);
    expect(JSON.parse(up.afterHoursDays)).toEqual([0, 6]);
    expect(up.id).toBe(b.id); // whitelist ignored the id override

    await deleteBuyer(b.id);
    expect((await listBuyers(mw)).map((x) => x.id)).not.toContain(b.id);
  });

  it("creates, lists and deletes a zip rule scoped to the money word", async () => {
    const mw = await makeLeaf();
    const b = await createBuyer({ moneyWordId: mw, name: "Acme", defaultNumber: "+15551230000" });
    const z = await createZipRule({ moneyWordId: mw, buyerId: b.id, zip: "75001", radiusMiles: 10 });
    expect(z.zip).toBe("75001");
    expect(z.radiusMiles).toBe(10);

    const rules = await listZipRules(mw);
    expect(rules.map((r) => r.id)).toEqual([z.id]);

    await deleteZipRule(z.id);
    expect(await listZipRules(mw)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/static/buyers.test.ts`
Expected: FAIL — `Cannot find module './buyers'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/static/buyers.ts`:

```ts
import { db } from "@/lib/db";

export type BuyerRow = Awaited<ReturnType<typeof db.staticBuyer.findFirstOrThrow>>;
export type ZipRuleRow = Awaited<ReturnType<typeof db.staticZipRule.findFirstOrThrow>>;

const EDITABLE_BUYER = new Set([
  "name", "defaultNumber", "afterHoursNumber", "backupNumber",
  "afterHoursDays", "afterHoursStart", "afterHoursEnd",
  "active", "dailyCap", "priorityWeight",
]);

export async function listBuyers(moneyWordId: string): Promise<BuyerRow[]> {
  return db.staticBuyer.findMany({ where: { moneyWordId }, orderBy: [{ createdAt: "asc" }] });
}

export async function createBuyer(input: { moneyWordId: string; name?: string; defaultNumber?: string }): Promise<BuyerRow> {
  return db.staticBuyer.create({
    data: {
      moneyWordId: input.moneyWordId,
      name: (input.name ?? "New buyer").trim() || "New buyer",
      defaultNumber: (input.defaultNumber ?? "").trim(),
    },
  });
}

export async function updateBuyer(id: string, patch: Record<string, unknown>): Promise<BuyerRow> {
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) if (EDITABLE_BUYER.has(k)) data[k] = v;
  if (typeof data.name === "string") {
    const t = data.name.trim();
    if (t) data.name = t; else delete data.name; // never blank a buyer name
  }
  if (Array.isArray(data.afterHoursDays)) data.afterHoursDays = JSON.stringify(data.afterHoursDays);
  return db.staticBuyer.update({ where: { id }, data });
}

export async function deleteBuyer(id: string): Promise<void> {
  await db.staticBuyer.delete({ where: { id } });
}

export async function listZipRules(moneyWordId: string): Promise<ZipRuleRow[]> {
  return db.staticZipRule.findMany({ where: { moneyWordId }, orderBy: [{ createdAt: "asc" }] });
}

export async function createZipRule(input: { moneyWordId: string; buyerId: string; zip: string; radiusMiles?: number }): Promise<ZipRuleRow> {
  return db.staticZipRule.create({
    data: {
      moneyWordId: input.moneyWordId,
      buyerId: input.buyerId,
      zip: input.zip.trim(),
      radiusMiles: Math.max(0, Math.round(input.radiusMiles ?? 0)),
    },
  });
}

export async function deleteZipRule(id: string): Promise<void> {
  await db.staticZipRule.delete({ where: { id } });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/static/buyers.test.ts`
Expected: PASS. Then `npm test` → whole suite green, no leftover `zzztest-` rows.

- [ ] **Step 5: Commit**

```bash
git add src/lib/static/buyers.ts src/lib/static/buyers.test.ts
git commit -m "feat(static): buyer + zip-rule DB store (Phase 2A)"
```

---

### Task 4: God-gated API route (`/api/static/buyers`)

**Files:**
- Create: `src/app/api/static/buyers/route.ts`

**Interfaces:**
- Consumes: `getSession, isGod` from `@/lib/auth`; the store fns from `@/lib/static/buyers`.
- Produces:
  - `GET /api/static/buyers?moneyWordId=<id>` → `{ buyers, zipRules }`
  - `POST /api/static/buyers` body `{ action, ... }` where action ∈ `createBuyer` (`{moneyWordId, name?, defaultNumber?}`), `updateBuyer` (`{id, patch}`), `deleteBuyer` (`{id}`), `createZip` (`{moneyWordId, buyerId, zip, radiusMiles?}`), `deleteZip` (`{id}`).

- [ ] **Step 1: Implement `src/app/api/static/buyers/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSession, isGod } from "@/lib/auth";
import { listBuyers, createBuyer, updateBuyer, deleteBuyer, listZipRules, createZipRule, deleteZipRule } from "@/lib/static/buyers";

async function guard() {
  const s = await getSession();
  return isGod(s) ? null : NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export async function GET(req: NextRequest) {
  const bad = await guard(); if (bad) return bad;
  const moneyWordId = req.nextUrl.searchParams.get("moneyWordId");
  if (!moneyWordId) return NextResponse.json({ error: "moneyWordId required" }, { status: 400 });
  return NextResponse.json({ buyers: await listBuyers(moneyWordId), zipRules: await listZipRules(moneyWordId) });
}

export async function POST(req: NextRequest) {
  const bad = await guard(); if (bad) return bad;
  const body = await req.json().catch(() => ({} as any));
  switch (body.action) {
    case "createBuyer": return NextResponse.json(await createBuyer({ moneyWordId: String(body.moneyWordId), name: body.name, defaultNumber: body.defaultNumber }));
    case "updateBuyer": return NextResponse.json(await updateBuyer(String(body.id), body.patch ?? {}));
    case "deleteBuyer": await deleteBuyer(String(body.id)); return NextResponse.json({ ok: true });
    case "createZip":   return NextResponse.json(await createZipRule({ moneyWordId: String(body.moneyWordId), buyerId: String(body.buyerId), zip: String(body.zip ?? ""), radiusMiles: body.radiusMiles }));
    case "deleteZip":   await deleteZipRule(String(body.id)); return NextResponse.json({ ok: true });
    default:            return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
```

- [ ] **Step 2: Verify route compiles + gates**

Run: `npx tsc --noEmit` and confirm ZERO errors from `src/app/api/static/buyers/route.ts` (unrelated WIP errors, e.g. `followup/`, are expected — ignore only those). Then `npm test` → suite green.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/static/buyers/route.ts
git commit -m "feat(static): god-gated /api/static/buyers route (Phase 2A)"
```

---

### Task 5: Buyer admin UI (`BuyerPanel`) wired into `StaticControls` for leaves

**Files:**
- Create: `src/components/static/BuyerPanel.tsx`
- Modify: `src/components/static/StaticControls.tsx` (pass `isLeaf`; render `<BuyerPanel>` for leaves)

**Interfaces:**
- Consumes: `POST/GET /api/static/buyers`.
- Produces: `<BuyerPanel moneyWordId={string} />` default export (client component). `NodeForm` gains an `isLeaf: boolean` prop.

- [ ] **Step 1: Create `src/components/static/BuyerPanel.tsx`**

```tsx
"use client";
import { useCallback, useEffect, useState } from "react";

type Buyer = {
  id: string; name: string; defaultNumber: string; afterHoursNumber: string | null; backupNumber: string | null;
  afterHoursDays: string; afterHoursStart: number | null; afterHoursEnd: number | null;
  active: boolean; dailyCap: number; priorityWeight: number;
};
type ZipRule = { id: string; buyerId: string; zip: string; radiusMiles: number };

async function post(body: unknown) {
  const res = await fetch("/api/static/buyers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
}

const L = "block text-xs uppercase text-[var(--muted)] mb-1";
const F = "w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1";

export default function BuyerPanel({ moneyWordId }: { moneyWordId: string }) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [zips, setZips] = useState<ZipRule[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/static/buyers?moneyWordId=${encodeURIComponent(moneyWordId)}`);
      if (!res.ok) throw new Error(`Load failed (${res.status})`);
      const data = await res.json();
      setBuyers(data.buyers); setZips(data.zipRules);
    } catch (e) { setErr(e instanceof Error ? e.message : "Load failed."); }
  }, [moneyWordId]);

  useEffect(() => { load(); }, [load]);

  const run = async (body: unknown) => {
    setBusy(true); setErr(null);
    try { await post(body); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Buyers <span className="text-[var(--muted)]">(this money word routes to these)</span></div>
        <button className="btn" disabled={busy} onClick={() => run({ action: "createBuyer", moneyWordId })}>+ Add buyer</button>
      </div>
      {err && <div className="rounded border border-[var(--danger)] text-[var(--danger)] text-sm px-3 py-2 mb-2">{err}</div>}
      {buyers.length === 0 && <div className="text-xs text-[var(--muted)] mb-2">No buyers yet — calls to this money word have nowhere to route.</div>}

      <div className="space-y-3">
        {buyers.map((b) => (
          <BuyerRow key={b.id} buyer={b} busy={busy} onSave={(patch) => run({ action: "updateBuyer", id: b.id, patch })} onDelete={() => { if (confirm(`Remove buyer “${b.name}”?`)) run({ action: "deleteBuyer", id: b.id }); }} />
        ))}
      </div>

      <ZipRules moneyWordId={moneyWordId} buyers={buyers} zips={zips} busy={busy} run={run} />
      <div className="text-xs text-[var(--muted)] mt-3">ZIP radius resolution, after-hours/backup dialing & DID passthrough go live in <b>Phase 2B</b>. Weights use Smooth Weighted Round-Robin.</div>
    </div>
  );
}

function BuyerRow({ buyer, busy, onSave, onDelete }: { buyer: Buyer; busy: boolean; onSave: (patch: Record<string, unknown>) => void; onDelete: () => void }) {
  const [name, setName] = useState(buyer.name);
  const [def, setDef] = useState(buyer.defaultNumber);
  const [after, setAfter] = useState(buyer.afterHoursNumber ?? "");
  const [backup, setBackup] = useState(buyer.backupNumber ?? "");
  const [weight, setWeight] = useState(String(buyer.priorityWeight));
  const [cap, setCap] = useState(String(buyer.dailyCap));

  const save = () => onSave({
    name: name.trim(),
    defaultNumber: def.trim(),
    afterHoursNumber: after.trim() || null,
    backupNumber: backup.trim() || null,
    priorityWeight: Math.max(0, parseInt(weight, 10) || 0),
    dailyCap: Math.max(0, parseInt(cap, 10) || 0),
  });

  return (
    <div className={`rounded border border-[var(--border)] p-3 ${buyer.active ? "" : "opacity-60"}`}>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div><label className={L}>Name</label><input className={F} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className={L}>Default # (E.164)</label><input className={F} value={def} onChange={(e) => setDef(e.target.value)} placeholder="+15551230000" /></div>
        <div><label className={L}>After-hours #</label><input className={F} value={after} onChange={(e) => setAfter(e.target.value)} placeholder="optional" /></div>
        <div><label className={L}>Backup #</label><input className={F} value={backup} onChange={(e) => setBackup(e.target.value)} placeholder="optional" /></div>
        <div><label className={L}>Weight</label><input className={F} value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
        <div><label className={L}>Daily cap (0=∞)</label><input className={F} value={cap} onChange={(e) => setCap(e.target.value)} /></div>
      </div>
      <div className="flex gap-2 items-center">
        <button className="btn" disabled={busy} onClick={save}>Save</button>
        <button className="btn" disabled={busy} onClick={() => onSave({ active: !buyer.active })}>{buyer.active ? "🟢 On" : "⚪ Off"}</button>
        <button className="btn" disabled={busy} onClick={onDelete}>Remove</button>
      </div>
    </div>
  );
}

function ZipRules({ moneyWordId, buyers, zips, busy, run }: { moneyWordId: string; buyers: Buyer[]; zips: ZipRule[]; busy: boolean; run: (body: unknown) => void }) {
  const [zip, setZip] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [radius, setRadius] = useState("0");
  const nameOf = (id: string) => buyers.find((b) => b.id === id)?.name ?? "(removed)";

  return (
    <div className="mt-4">
      <div className="text-sm font-semibold mb-2">Granular ZIP rules <span className="text-[var(--muted)]">(exact ZIP now; radius stored for Phase 2B)</span></div>
      <div className="flex flex-wrap gap-2 items-end mb-2">
        <div><label className={L}>ZIP</label><input className={F} value={zip} onChange={(e) => setZip(e.target.value)} placeholder="75001" /></div>
        <div><label className={L}>Radius (mi)</label><input className={F} value={radius} onChange={(e) => setRadius(e.target.value)} /></div>
        <div><label className={L}>Buyer</label>
          <select className={F} value={buyerId} onChange={(e) => setBuyerId(e.target.value)}>
            <option value="">— pick —</option>
            {buyers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <button className="btn" disabled={busy || !zip.trim() || !buyerId} onClick={() => run({ action: "createZip", moneyWordId, buyerId, zip: zip.trim(), radiusMiles: Math.max(0, parseInt(radius, 10) || 0) })}>+ Add ZIP rule</button>
      </div>
      {zips.length === 0 ? <div className="text-xs text-[var(--muted)]">No ZIP rules — buyers apply by state/weight only.</div> : (
        <ul className="text-sm space-y-1">
          {zips.map((z) => (
            <li key={z.id} className="flex items-center gap-2">
              <span className="font-mono">{z.zip}{z.radiusMiles > 0 ? ` +${z.radiusMiles}mi` : ""}</span>
              <span className="text-[var(--muted)]">→ {nameOf(z.buyerId)}</span>
              <button className="text-[var(--danger)]" disabled={busy} onClick={() => run({ action: "deleteZip", id: z.id })}>remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire `BuyerPanel` into `StaticControls` for leaf nodes**

In `src/components/static/StaticControls.tsx`:

(a) Add the import at the top (after the existing imports):

```tsx
import BuyerPanel from "./BuyerPanel";
```

(b) In the `StaticControls` component body, the selected node's `children` are already computed as `children`. Pass leaf-ness to `NodeForm`. Change the `<NodeForm ... />` line to add an `isLeaf` prop:

```tsx
          <NodeForm key={sel.id} row={sel} busy={busy} isLeaf={children.length === 0} onSave={(patch) => run({ action: "update", id: sel.id, patch })} onDelete={async () => { if (confirm(`Delete “${sel.word}” and its sub-tabs?`)) { const ok = await run({ action: "delete", id: sel.id }); if (ok) router.push("/dashboard/static"); } }} />
```

(c) Update the `NodeForm` signature and replace the Phase-2 placeholder line with the panel. Change:

```tsx
function NodeForm({ row, busy, onSave, onDelete }: { row: Row; busy: boolean; onSave: (patch: Record<string, unknown>) => void; onDelete: () => void }) {
```

to:

```tsx
function NodeForm({ row, busy, isLeaf, onSave, onDelete }: { row: Row; busy: boolean; isLeaf: boolean; onSave: (patch: Record<string, unknown>) => void; onDelete: () => void }) {
```

and replace this line:

```tsx
      <div className="text-xs text-[var(--muted)] mb-3">Buyers · ZIP rules · text template · voice — <b>Phase 2/4</b>.</div>
```

with:

```tsx
      {isLeaf
        ? <BuyerPanel moneyWordId={row.id} />
        : <div className="text-xs text-[var(--muted)] mb-3">This is a <b>category</b> (has sub-tabs) — only leaf money words route to buyers.</div>}
      <div className="text-xs text-[var(--muted)] mt-3 mb-0">Text template · voice — <b>Phase 4</b>.</div>
```

- [ ] **Step 3: Verify it type-checks**

Run: `npx tsc --noEmit` and confirm ZERO errors from `src/components/static/BuyerPanel.tsx` or `src/components/static/StaticControls.tsx` (unrelated WIP errors are expected — ignore only those). Then `npm test` → suite green.

- [ ] **Step 4: Commit**

```bash
git add src/components/static/BuyerPanel.tsx src/components/static/StaticControls.tsx
git commit -m "feat(static): buyer admin UI on leaf money words (Phase 2A)"
```

---

### Task 6: Full test + isolated build + smoke

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: all green (Phase-1 + swrr + buyers suites), no regressions, no leftover `zzztest-` rows.

- [ ] **Step 2: Isolated production build** (main tree build is blocked by unrelated `followup/` WIP)

Create a clean worktree at HEAD, CoW-clone deps, build there:
```bash
WT=$(mktemp -d)/wt
git worktree add --detach "$WT" HEAD
cp -Rc "$(git rev-parse --show-toplevel)/node_modules" "$WT/node_modules"
cp "$(git rev-parse --show-toplevel)/.env" "$WT/.env" 2>/dev/null || true
( cd "$WT" && npm run build 2>&1 | tail -20 )
git worktree remove --force "$WT"
```
Expected: `✓ Compiled successfully`, exit 0, and `/api/static/buyers` present in the route manifest. (Runtime `prisma:error` lines during static prerender of unrelated pages are pre-existing and non-fatal.)

- [ ] **Step 3: Manual smoke (documented, run by controller/human)**

- Log in as God → `/dashboard/static` → select a **leaf** money word (e.g. Precision Medicine) → the **Buyers** panel appears → **+ Add buyer**, set name/number/weight/cap, Save, toggle On/Off, add a ZIP rule, remove them.
- Select a **category** (Doctor) → confirm it shows "This is a category… only leaf money words route" and NO buyer panel.
- Confirm the Fluid dashboard and live call flow are unchanged (no 2A code runs in the voice webhook).

- [ ] **Step 4: (no commit — verification task)**

---

## Self-Review

**Spec coverage (§4.2, §4.3, §6.2 buyer engine):**
- StaticBuyer / StaticZipRule models verbatim from §4.2 → Task 1. Back-relations added → Task 1.
- SWRR weighted round-robin, interleaved, redistribution on off/cap → Task 2 (`selectBuyer`, tested 9:1 interleaved + redistribution). Daily-count reset (CST) → Task 2 (`applyDailyReset`/`cstDayKey`).
- Buyer fields: default/after-hours/backup numbers, on/off, daily cap, priority weight, after-hours days/start/end → Task 1 (model) + Task 3 (store) + Task 5 (UI; after-hours day/start/end are stored & editable via patch — the row editor exposes name/numbers/weight/cap now; after-hours window fields are persisted through the API patch and can be surfaced without schema change).
- Granular ZIP (exact ZIP; radius stored, resolution deferred) → Tasks 1/3/5, explicitly labeled Phase 2B in UI + constraints.
- Reuse (§4.3): no new Twilio/Call code in 2A (that's 2B) — correctly out of scope.
- Leaf-only routing → Task 5 (`isLeaf` gate).
- Additive/forward-compat → Task 1 note (virtual back-relations, no StaticMoneyWord column change); isolated staging preserves Pd WIP.

**Placeholder scan:** no TBD/TODO; every code step has complete code.

**Type consistency:** `SwrrBuyer` fields match the model columns used by the store; `selectBuyer`→`{chosenId,next}` consistent across test + impl; store fn names match the API route imports and the UI action names (`createBuyer/updateBuyer/deleteBuyer/createZip/deleteZip`); `BuyerPanel` prop `moneyWordId` matches its usage in `StaticControls`; `NodeForm` `isLeaf` added in both signature and call site.

**Deferred (documented, not built in 2A):** geo-radius ZIP resolution; after-hours/backup live dialing; DID passthrough; live voice intake branch; Twilio buy-use-release test numbers; no-buyer callback + money-word cloud. All are Phase 2B/onward.
