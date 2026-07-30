# Static Dashboard — Phase 2B-core Implementation Plan (Live Routing)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the Static engine actually route live inbound calls — a dormant, flag-gated voice branch that runs age→state→money-word menu→leaf→ask-question→transfer to the SWRR-selected buyer (caller-ID passthrough), with after-hours/backup dialing, exact-ZIP override, and no-buyer callback capture.

**Architecture:** ONE gated branch at the top of `POST /api/calls/inbound` (`if activeEngine==="static" → static greeting`), a new speech+DTMF intake state machine at `/api/voice/static-step`, a DB routing module (`src/lib/static/routing.ts`) that consumes the pure `swrr.ts` from 2A, pure voice helpers (`src/lib/static/voice.ts`), and a `StaticCallback` table for unsold-demand capture. The entire Fluid path is untouched; nothing runs until a God flips the engine to `static`.

**Tech Stack:** Next.js 16 App Router, Prisma 6.19.3 + SQLite (dev) / Postgres (prod), Twilio Voice TwiML, Vitest 2. `@/` → `src/`.

## Global Constraints

- **DORMANT / flag-gated:** all new behavior runs ONLY when `getActiveEngine() === "static"`. Default is `"fluid"`. Do NOT flip the engine. The Fluid inbound/step/transfer code must remain byte-for-byte unchanged except the single gated branch line in `/api/calls/inbound`.
- **Menu input = speech + DTMF:** `<Gather input="speech dtmf" numDigits="1" ...>`; match a spoken money word OR a pressed digit (1..N) to the corresponding node.
- **Caller-ID passthrough (mandatory):** transfers use `<Dial callerId="{normalizePhone(call.fromNumber) || tollFreeCallerId}" record="record-from-answer-dual" action="{BASE}/api/calls/status">` — the caller's OWN number, never the toll-free line. Reuse the exact pattern from `src/app/api/voice/step/route.ts`.
- **Scope = CORE routing only.** DEFERRED to Phase 2C (do NOT build): geo-radius ZIP resolution (only EXACT-ZIP match here), Twilio buy-use-release test numbers, the money-word cloud/hot-list UI, the after-hours callback follow-up SMS, the "other"/voice-drive training game, agent/manager deflection scripting.
- SWRR is the 2A pure module `@/lib/static/swrr` (`selectBuyer`, `eligible`, `cstDayKey`, `applyDailyReset`, `SwrrBuyer`). Buyers/zip rules come from `@/lib/static/buyers`. Tree from `@/lib/static/tree` + `@/lib/static/store`. Engine flag from `@/lib/static/engine`.
- Prisma provider sqlite dev; JSON as String; extended client `@/lib/db`. TwiML escaping via `esc` from `@/lib/voice`. Phone normalize via `normalizePhone` from `@/lib/sms`.
- Reuse the existing `Call` model (`moneyWord`, `state`, `zip`, `forwardedTo`, `disposition`, `status`, `fromNumber`, `providerSid`). Do NOT modify the `Call` model shape.
- **`/api/calls/inbound/route.ts` carries uncommitted WIP and the box runs that WIP version.** Add the gated branch to the working tree; the controller isolate-stages ONLY the branch hunk for the commit and diff-checks box-vs-local before deploy.
- Tests: colocated `*.test.ts`, `npm test` (vitest, `fileParallelism:false` already set). Pure logic (voice.ts helpers, after-hours) is TDD.

## File Structure

- `prisma/schema.prisma` — **modify (isolated stage)**: add `StaticCallback` model.
- `src/lib/static/voice.ts` — **create**: pure helpers — `buildMenuPrompt`, `matchSelection`, `isAfterHours`. Zero DB.
- `src/lib/static/voice.test.ts` — **create**.
- `src/lib/static/routing.ts` — **create**: DB routing — `pickBuyerFor(leafId, ctx)` (daily reset + exact-ZIP override + SWRR + persist + number selection), `captureCallback`. Consumes swrr.ts + buyers.ts.
- `src/lib/static/routing.test.ts` — **create**: integration test (self-cleaning).
- `src/app/api/voice/static-step/route.ts` — **create**: the speech+DTMF intake state machine + exported `staticGreeting(callId)`.
- `src/app/api/calls/inbound/route.ts` — **modify (isolated stage, 2 lines)**: gated Static branch.

---

### Task 1: `StaticCallback` model (unsold-demand capture)

**Files:** Modify `prisma/schema.prisma` (append one model).

**Interfaces:** Produces `db.staticCallback`; columns `id, moneyWordId?, word, state, zip, phone, note, createdAt`.

- [ ] **Step 1: Append the model at the end of `prisma/schema.prisma`**

```prisma
// ---------------------------------------------------------------------------
// STATIC ENGINE — Phase 2B unsold-demand capture (no-buyer callbacks / hot list)
// ---------------------------------------------------------------------------
model StaticCallback {
  id          String   @id @default(cuid())
  moneyWordId String?
  word        String   // the money word the caller wanted
  state       String   @default("")
  zip         String   @default("")
  phone       String   @default("")
  note        String   @default("") // e.g. "no buyer in area" / requested callback time
  createdAt   DateTime @default(now())

  @@index([word])
  @@index([createdAt])
  @@map("static_callback")
}
```

- [ ] **Step 2: Apply + verify**

Run: `npm run db:push`
Expected: `Your database is now in sync`. Then:
```bash
npx tsx -e "import { db } from './src/lib/db'; (async()=>{const c=await db.staticCallback.create({data:{word:'__probe__'}});console.log('ok',c.word);await db.staticCallback.delete({where:{id:c.id}});})()"
```
Expected: prints `ok __probe__`.

- [ ] **Step 3: Commit** — `git commit -m "feat(static): StaticCallback model for unsold-demand capture (Phase 2B)"`

> **Controller note:** isolate-stage only this appended model (Pd/tv WIP stays uncommitted); do `db:push` against the full working schema.

---

### Task 2: Pure voice helpers (`src/lib/static/voice.ts`)

**Files:** Create `src/lib/static/voice.ts` + `src/lib/static/voice.test.ts`.

**Interfaces:**
- Consumes: `TreeNode` from `@/lib/static/tree`.
- Produces:
  - `type MenuNode = { id: string; word: string }`
  - `buildMenuPrompt(nodes: MenuNode[]): string` — e.g. `"For Precision Medicine, say it or press 1. For Concierge Medicine, say it or press 2. ..."`.
  - `matchSelection(speech: string, digit: string, nodes: MenuNode[]): string | null` — digit "1".."N" → that node id (1-indexed); else case-insensitive contains match of `speech` against `word`; else null.
  - `isAfterHours(buyer: { afterHoursDays: string; afterHoursStart: number | null; afterHoursEnd: number | null }, epochMs: number): boolean` — true when the CST weekday is in `afterHoursDays` AND the CST minutes-from-midnight is within `[afterHoursStart, afterHoursEnd)`. If days empty or start/end null → false.

- [ ] **Step 1: Write the failing test** — `src/lib/static/voice.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { buildMenuPrompt, matchSelection, isAfterHours } from "./voice";

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
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/lib/static/voice.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement `src/lib/static/voice.ts`**

```ts
// Pure voice-intake helpers for the Static engine. No DB, no Date.now() — time flows in as epoch ms.

export type MenuNode = { id: string; word: string };

export function buildMenuPrompt(nodes: MenuNode[]): string {
  return nodes
    .map((n, i) => `For ${n.word}, say it or press ${i + 1}.`)
    .join(" ");
}

export function matchSelection(speech: string, digit: string, nodes: MenuNode[]): string | null {
  const d = (digit || "").trim();
  if (/^[0-9]+$/.test(d)) {
    const idx = parseInt(d, 10) - 1;
    return idx >= 0 && idx < nodes.length ? nodes[idx].id : null;
  }
  const s = (speech || "").toLowerCase().trim();
  if (!s) return null;
  for (const n of nodes) if (s.includes(n.word.toLowerCase())) return n.id;
  return null;
}

// CST wall-clock parts for a given epoch (DST-correct via Intl / America/Chicago).
function cstParts(epochMs: number): { weekday: number; minutes: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date(epochMs));
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hh = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10) % 24;
  const mm = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { weekday: map[wd] ?? 0, minutes: hh * 60 + mm };
}

export function isAfterHours(
  buyer: { afterHoursDays: string; afterHoursStart: number | null; afterHoursEnd: number | null },
  epochMs: number,
): boolean {
  let days: number[];
  try { days = JSON.parse(buyer.afterHoursDays || "[]"); } catch { days = []; }
  if (!Array.isArray(days) || days.length === 0) return false;
  if (buyer.afterHoursStart == null || buyer.afterHoursEnd == null) return false;
  const { weekday, minutes } = cstParts(epochMs);
  if (!days.includes(weekday)) return false;
  return minutes >= buyer.afterHoursStart && minutes < buyer.afterHoursEnd;
}
```

- [ ] **Step 4: Run to verify it passes** — `npx vitest run src/lib/static/voice.test.ts` → PASS; then `npm test` → all green.

- [ ] **Step 5: Commit** — `git add src/lib/static/voice.ts src/lib/static/voice.test.ts && git commit -m "feat(static): pure voice-intake helpers — menu prompt, selection match, after-hours (Phase 2B)"`

---

### Task 3: DB routing engine (`src/lib/static/routing.ts`)

**Files:** Create `src/lib/static/routing.ts` + `src/lib/static/routing.test.ts`.

**Interfaces:**
- Consumes: `db` (`@/lib/db`), `selectBuyer`/`cstDayKey`/`applyDailyReset`/`SwrrBuyer` (`@/lib/static/swrr`), `isAfterHours` (`@/lib/static/voice`).
- Produces:
  - `type RouteResult = { buyerId: string; number: string } | null`
  - `pickBuyerFor(leafId: string, ctx: { zip?: string }, nowMs: number): Promise<RouteResult>` — (1) load active buyers for the leaf; (2) apply daily reset per-buyer (if `cstDayKey(lastAssignedAt) !== cstDayKey(now)` → dailyCount=0); (3) exact-ZIP override: if the leaf has a `StaticZipRule` whose `zip === ctx.zip` (radius ignored in 2B-core) → route to that rule's buyer if active/under-cap; (4) else SWRR `selectBuyer` over the mapped `SwrrBuyer[]`; (5) persist the chosen buyer's `swrrCurrent`(all pool)+`dailyCount`+1+`lastAssignedAt`=now; (6) pick number = after-hours→`afterHoursNumber` (if `isAfterHours` and set) else `defaultNumber`; (7) return `{buyerId, number}` or null if no eligible buyer / empty number.
  - `pickBackupNumber(buyerId: string): Promise<string>` — the buyer's `backupNumber` (empty string if none).
  - `captureCallback(input: { moneyWordId?: string; word: string; state?: string; zip?: string; phone?: string; note?: string }): Promise<void>` — writes a `StaticCallback` row.

- [ ] **Step 1: Write the failing test** — `src/lib/static/routing.test.ts`

```ts
import { describe, it, expect, afterEach } from "vitest";
import { db } from "@/lib/db";
import { pickBuyerFor, captureCallback } from "./routing";

async function leaf(): Promise<string> {
  const n = await db.staticMoneyWord.create({ data: { word: "zzztest word", slug: `zzztest-${Date.now()}-${Math.round(Math.random() * 1e6)}` } });
  return n.id;
}
afterEach(async () => {
  await db.staticCallback.deleteMany({ where: { word: { startsWith: "zzztest" } } });
  await db.staticMoneyWord.deleteMany({ where: { slug: { startsWith: "zzztest-" } } });
});
const NOW = Date.UTC(2026, 6, 15, 18, 0, 0); // Wed 13:00 CDT — business hours

describe("pickBuyerFor", () => {
  it("returns null when the leaf has no buyers", async () => {
    expect(await pickBuyerFor(await leaf(), {}, NOW)).toBeNull();
  });

  it("routes to the only active buyer and increments its dailyCount", async () => {
    const mw = await leaf();
    const b = await db.staticBuyer.create({ data: { moneyWordId: mw, name: "Acme", defaultNumber: "+15551110000" } });
    const r = await pickBuyerFor(mw, {}, NOW);
    expect(r).toEqual({ buyerId: b.id, number: "+15551110000" });
    const after = await db.staticBuyer.findUnique({ where: { id: b.id } });
    expect(after!.dailyCount).toBe(1);
    expect(after!.lastAssignedAt).not.toBeNull();
  });

  it("honors an exact-ZIP rule over plain SWRR", async () => {
    const mw = await leaf();
    const a = await db.staticBuyer.create({ data: { moneyWordId: mw, name: "A", defaultNumber: "+15551110000", priorityWeight: 99 } });
    const b = await db.staticBuyer.create({ data: { moneyWordId: mw, name: "B", defaultNumber: "+15552220000", priorityWeight: 1 } });
    await db.staticZipRule.create({ data: { moneyWordId: mw, buyerId: b.id, zip: "75001" } });
    const r = await pickBuyerFor(mw, { zip: "75001" }, NOW);
    expect(r!.buyerId).toBe(b.id); // ZIP rule wins despite A's huge weight
  });

  it("skips a capped buyer", async () => {
    const mw = await leaf();
    await db.staticBuyer.create({ data: { moneyWordId: mw, name: "Capped", defaultNumber: "+15551110000", dailyCap: 1, dailyCount: 1 } });
    expect(await pickBuyerFor(mw, {}, NOW)).toBeNull();
  });
});

describe("captureCallback", () => {
  it("writes a StaticCallback row", async () => {
    await captureCallback({ word: "zzztest demand", state: "TX", zip: "75001", phone: "+15550000000", note: "no buyer" });
    const rows = await db.staticCallback.findMany({ where: { word: "zzztest demand" } });
    expect(rows).toHaveLength(1);
    expect(rows[0].state).toBe("TX");
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/lib/static/routing.test.ts` → FAIL.

- [ ] **Step 3: Implement `src/lib/static/routing.ts`**

```ts
import { db } from "@/lib/db";
import { selectBuyer, cstDayKey, type SwrrBuyer } from "./swrr";
import { isAfterHours } from "./voice";

export type RouteResult = { buyerId: string; number: string } | null;

function toSwrr(b: { id: string; priorityWeight: number; swrrCurrent: number; active: boolean; dailyCap: number; dailyCount: number }): SwrrBuyer {
  return { id: b.id, priorityWeight: b.priorityWeight, swrrCurrent: b.swrrCurrent, active: b.active, dailyCap: b.dailyCap, dailyCount: b.dailyCount };
}

export async function pickBuyerFor(leafId: string, ctx: { zip?: string }, nowMs: number): Promise<RouteResult> {
  const nowKey = cstDayKey(nowMs);
  const buyers = await db.staticBuyer.findMany({ where: { moneyWordId: leafId } });
  if (buyers.length === 0) return null;

  // per-buyer daily reset (CST rollover since lastAssignedAt)
  const rolled = buyers.map((b) => {
    const stale = b.lastAssignedAt ? cstDayKey(b.lastAssignedAt.getTime()) !== nowKey : false;
    return stale ? { ...b, dailyCount: 0 } : b;
  });

  // exact-ZIP override (radius ignored in 2B-core)
  let chosenId: string | null = null;
  if (ctx.zip) {
    const rule = await db.staticZipRule.findFirst({ where: { moneyWordId: leafId, zip: ctx.zip } });
    if (rule) {
      const rb = rolled.find((b) => b.id === rule.buyerId);
      if (rb && rb.active && (rb.dailyCap === 0 || rb.dailyCount < rb.dailyCap)) chosenId = rb.id;
    }
  }

  let poolNext = rolled.map(toSwrr);
  if (!chosenId) {
    const sel = selectBuyer(rolled.map(toSwrr));
    chosenId = sel.chosenId;
    poolNext = sel.next;
  }
  if (!chosenId) return null;

  const chosen = rolled.find((b) => b.id === chosenId)!;
  const swrrOf = new Map(poolNext.map((p) => [p.id, p.swrrCurrent]));

  // persist: swrrCurrent for all, dailyCount+1 + lastAssignedAt on the chosen; reset stale counts too
  await db.$transaction(
    rolled.map((b) =>
      db.staticBuyer.update({
        where: { id: b.id },
        data: {
          swrrCurrent: swrrOf.get(b.id) ?? b.swrrCurrent,
          dailyCount: b.id === chosenId ? b.dailyCount + 1 : b.dailyCount,
          ...(b.id === chosenId ? { lastAssignedAt: new Date(nowMs) } : {}),
        },
      }),
    ),
  );

  const useAfterHours = isAfterHours(chosen, nowMs) && !!chosen.afterHoursNumber;
  const number = (useAfterHours ? chosen.afterHoursNumber : chosen.defaultNumber) || "";
  if (!number) return null;
  return { buyerId: chosen.id, number };
}

export async function pickBackupNumber(buyerId: string): Promise<string> {
  const b = await db.staticBuyer.findUnique({ where: { id: buyerId } });
  return b?.backupNumber || "";
}

export async function captureCallback(input: { moneyWordId?: string; word: string; state?: string; zip?: string; phone?: string; note?: string }): Promise<void> {
  await db.staticCallback.create({
    data: {
      moneyWordId: input.moneyWordId ?? null,
      word: input.word,
      state: input.state ?? "",
      zip: input.zip ?? "",
      phone: input.phone ?? "",
      note: input.note ?? "",
    },
  });
}
```

- [ ] **Step 4: Run to verify it passes** — `npx vitest run src/lib/static/routing.test.ts` → PASS; then `npm test` → all green, no leftover `zzztest` rows.

- [ ] **Step 5: Commit** — `git add src/lib/static/routing.ts src/lib/static/routing.test.ts && git commit -m "feat(static): DB routing engine — SWRR + exact-ZIP + after-hours + callback capture (Phase 2B)"`

---

### Task 4: Static intake state machine (`/api/voice/static-step`)

**Files:** Create `src/app/api/voice/static-step/route.ts`.

**Interfaces:**
- Consumes: `db`, `esc` (`@/lib/voice`), `normalizePhone` (`@/lib/sms`), `getVoiceAgent` (`@/lib/voice`), `buildTree`/`moneyWordsList` (`@/lib/static/tree`), `listNodes`/`toFlat` (`@/lib/static/store`), `pickBuyerFor`/`pickBackupNumber`/`captureCallback` (`@/lib/static/routing`), `buildMenuPrompt`/`matchSelection` (`@/lib/static/voice`), `getSettings` (`@/lib/logic`).
- Produces: `export async function POST(req)` (the state machine) and `export async function staticGreeting(callId: string): Promise<string>` (the initial TwiML body, consumed by the inbound branch).

**Phases** (query param `phase`, default `age`): `age → state → menu → submenu → ask → (transfer|callback)`. Node navigation stored on `Call.moneyWord` (current node id) + answers on the Lead. Speech+DTMF gather.

- [ ] **Step 1: Implement the route**

```ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { esc, getVoiceAgent } from "@/lib/voice";
import { normalizePhone } from "@/lib/sms";
import { getSettings } from "@/lib/logic";
import { buildTree } from "@/lib/static/tree";
import { listNodes, toFlat } from "@/lib/static/store";
import { pickBuyerFor, pickBackupNumber, captureCallback } from "@/lib/static/routing";
import { buildMenuPrompt, matchSelection, type MenuNode } from "@/lib/static/voice";

const BASE = "https://medigap.plus";
function xml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, { headers: { "Content-Type": "text/xml" } });
}
const step = (phase: string, callId: string, extra = "") => esc(`${BASE}/api/voice/static-step?callId=${callId}&phase=${phase}${extra}`);
function gather(action: string, voice: string, line: string) {
  return `<Gather input="speech dtmf" numDigits="1" speechTimeout="auto" action="${action}" method="POST"><Say voice="${voice}">${esc(line)}</Say></Gather><Redirect method="POST">${action}</Redirect>`;
}

// Top-level menu nodes (enabled top-level, in order) as {id,word}.
async function topMenu(): Promise<MenuNode[]> {
  const tree = buildTree(toFlat(await listNodes()));
  return tree.filter((n) => n.active).map((n) => ({ id: n.id, word: n.word }));
}
async function childMenu(parentId: string): Promise<MenuNode[]> {
  const tree = buildTree(toFlat(await listNodes()));
  const find = (nodes: any[]): any => nodes.reduce((acc, n) => acc || (n.id === parentId ? n : find(n.children)), null);
  const p = find(tree);
  return (p?.children ?? []).filter((n: any) => n.active).map((n: any) => ({ id: n.id, word: n.word }));
}
async function nodeById(id: string) {
  return db.staticMoneyWord.findUnique({ where: { id } });
}

export async function staticGreeting(callId: string): Promise<string> {
  const agent = await getVoiceAgent();
  return gather(step("age", callId), agent.voice, "Thanks for calling. In order to serve you better, please tell me your age.");
}

// Build the buyer transfer (caller-ID passthrough), with backup on no-answer via the status action.
async function transfer(callId: string, number: string, voice: string, buyerId: string): Promise<string> {
  const call = await db.call.findUnique({ where: { id: callId } });
  const s = await getSettings();
  const dest = normalizePhone(number) || number;
  const callerId = normalizePhone(call?.fromNumber || "") || s.raw["tollFreeCallerId"] || "+18006334427";
  await db.call.update({ where: { id: callId }, data: { forwardedTo: dest, status: "transferring", disposition: "static" } }).catch(() => {});
  const action = `${BASE}/api/voice/static-step?callId=${callId}&phase=backup&buyer=${buyerId}`;
  return `<Dial timeout="25" callerId="${callerId}" record="record-from-answer-dual" action="${action}"><Number>${dest}</Number></Dial>`;
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const callId = url.searchParams.get("callId") || "";
  const phase = url.searchParams.get("phase") || "age";
  const form = await req.formData().catch(() => null);
  const speech = String(form?.get("SpeechResult") || "").trim();
  const digit = String(form?.get("Digits") || "").trim();
  const dialStatus = String(form?.get("DialCallStatus") || "");

  const call = await db.call.findUnique({ where: { id: callId } });
  const agent = await getVoiceAgent();
  if (!call) return xml(`<Say voice="alice">Sorry, something went wrong. Goodbye.</Say><Hangup/>`);
  const voice = agent.voice;

  // ---- backup: primary dial didn't connect → try the buyer's backup number once ----
  if (phase === "backup") {
    const buyerId = url.searchParams.get("buyer") || "";
    if (dialStatus === "completed") return xml(`<Hangup/>`);
    const backup = await pickBackupNumber(buyerId);
    if (backup) {
      const call2 = await db.call.findUnique({ where: { id: callId } });
      const s = await getSettings();
      const callerId = normalizePhone(call2?.fromNumber || "") || s.raw["tollFreeCallerId"] || "+18006334427";
      const dest = normalizePhone(backup) || backup;
      return xml(`<Dial timeout="25" callerId="${callerId}" record="record-from-answer-dual" action="${BASE}/api/calls/status"><Number>${dest}</Number></Dial>`);
    }
    return xml(`<Say voice="${voice}">We're sorry, our specialist is unavailable. We'll call you right back. Goodbye.</Say><Hangup/>`);
  }

  // ---- age ----
  if (phase === "age") {
    if (!speech) return xml(gather(step("age", callId), voice, "Please tell me your age."));
    if (call.leadId) await db.lead.update({ where: { id: call.leadId }, data: { dob: speech } }).catch(() => {});
    return xml(gather(step("state", callId), voice, "Thank you. What state are you calling from?"));
  }

  // ---- state ----
  if (phase === "state") {
    if (!speech) return xml(gather(step("state", callId), voice, "What state are you calling from?"));
    if (call.leadId) await db.lead.update({ where: { id: call.leadId }, data: { state: speech.slice(0, 40) } }).catch(() => {});
    await db.call.update({ where: { id: callId }, data: { state: speech.slice(0, 40) } }).catch(() => {});
    const menu = await topMenu();
    const line = `Great. Please listen to the options menu in its entirety and select the one that serves you best. ${buildMenuPrompt(menu)}`;
    return xml(gather(step("menu", callId), voice, line));
  }

  // ---- menu (top level) ----
  if (phase === "menu") {
    const menu = await topMenu();
    const hitId = matchSelection(speech, digit, menu);
    if (!hitId) return xml(gather(step("menu", callId), voice, `Sorry, I didn't catch that. ${buildMenuPrompt(menu)}`));
    const kids = await childMenu(hitId);
    if (kids.length > 0) {
      await db.call.update({ where: { id: callId }, data: { moneyWord: hitId } }).catch(() => {});
      return xml(gather(step("submenu", callId), voice, `${buildMenuPrompt(kids)}`));
    }
    return finishLeaf(callId, hitId, voice, call);
  }

  // ---- submenu (children of the selected category) ----
  if (phase === "submenu") {
    const parentId = call.moneyWord || "";
    const kids = await childMenu(parentId);
    const hitId = matchSelection(speech, digit, kids);
    if (!hitId) return xml(gather(step("submenu", callId), voice, `Sorry, I didn't catch that. ${buildMenuPrompt(kids)}`));
    const grand = await childMenu(hitId);
    if (grand.length > 0) {
      await db.call.update({ where: { id: callId }, data: { moneyWord: hitId } }).catch(() => {});
      return xml(gather(step("submenu", callId), voice, `${buildMenuPrompt(grand)}`));
    }
    return finishLeaf(callId, hitId, voice, call);
  }

  // ---- ask: caller heard the leaf's question; now route ----
  if (phase === "ask") {
    const leafId = call.moneyWord || "";
    return routeLeaf(callId, leafId, voice, call);
  }

  return xml(`<Say voice="${voice}">Goodbye.</Say><Hangup/>`);
}

// A leaf was selected: speak its askQuestionPrompt (if any) then route on the next hop.
async function finishLeaf(callId: string, leafId: string, voice: string, call: any) {
  await db.call.update({ where: { id: callId }, data: { moneyWord: leafId } }).catch(() => {});
  const node = await nodeById(leafId);
  const ask = (node?.askQuestionPrompt || "").trim();
  if (ask) return xml(gather(step("ask", callId), voice, ask));
  return routeLeaf(callId, leafId, voice, call);
}

// Route the leaf to a buyer (SWRR) or capture unsold demand.
async function routeLeaf(callId: string, leafId: string, voice: string, call: any) {
  const node = await nodeById(leafId);
  const nowMs = Date.now();
  const res = await pickBuyerFor(leafId, { zip: call.zip || undefined }, nowMs);
  if (!res) {
    await captureCallback({ moneyWordId: leafId, word: node?.word || "", state: call.state || "", zip: call.zip || "", phone: call.fromNumber || "", note: "no buyer in area" });
    await db.call.update({ where: { id: callId }, data: { disposition: "static-nobuyer", moneyWord: node?.word || leafId } }).catch(() => {});
    return xml(`<Say voice="${voice}">We're sorry, but we don't have ${esc(node?.word || "that")} in your area right now. We'll notify you when we do. Goodbye.</Say><Hangup/>`);
  }
  await db.call.update({ where: { id: callId }, data: { moneyWord: node?.word || leafId } }).catch(() => {});
  return xml(await transfer(callId, res.number, voice, res.buyerId));
}
```

- [ ] **Step 2: Type-check** — `npx tsc --noEmit`, ZERO errors from `src/app/api/voice/static-step/route.ts` (unrelated WIP errors ignored). `npm test` → green.

- [ ] **Step 3: Commit** — `git add src/app/api/voice/static-step/route.ts && git commit -m "feat(static): live Static intake state machine — speech+DTMF menu, SWRR transfer, no-buyer capture (Phase 2B)"`

---

### Task 5: Gated Static branch in `/api/calls/inbound` (dormant)

**Files:** Modify `src/app/api/calls/inbound/route.ts` (isolated stage — 2 lines).

- [ ] **Step 1: Add the import** near the top imports:

```ts
import { getActiveEngine } from "@/lib/static/engine";
import { staticGreeting } from "@/app/api/voice/static-step/route";
```

- [ ] **Step 2: Add the gated branch** immediately after the `const call = await db.call.create(...)` line (and the `matchFireCallbackBackground` call), BEFORE `const agent = await getVoiceAgent();`:

```ts
  // Static engine (dormant unless a God has flipped the toggle) — branch to the Static intake.
  if ((await getActiveEngine()) === "static") {
    return xml(await staticGreeting(call.id));
  }
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit` (ZERO errors from `src/app/api/calls/inbound/route.ts`), `npm test` → green. Confirm the Fluid path below the branch is unchanged.

- [ ] **Step 4: Commit** — `git commit -m "feat(static): dormant Static engine branch in inbound webhook (Phase 2B)"`

> **Controller note:** `inbound/route.ts` has uncommitted WIP + the box runs the WIP version. Add the branch to the working tree; isolate-stage ONLY the import + the 4-line branch hunk for the commit. At deploy, diff box-vs-local-working-tree inbound and rsync the working-tree version (WIP + branch) so no live feature regresses.

---

### Task 6: Full test + isolated build + dormant smoke

- [ ] **Step 1:** `npm test` → all green (voice, routing suites + prior).
- [ ] **Step 2:** Isolated worktree build (per the 2A pattern: `git worktree add --detach`, `cp -Rc node_modules`, `npm run build`) → exit 0, `Compiled successfully`, `/api/voice/static-step` in the manifest.
- [ ] **Step 3 (dormant smoke — controller/human):** With the engine on `fluid`, confirm a normal inbound call is UNCHANGED (the branch is skipped). Then in a dev/staging context set engine=static and simulate the phase sequence (age→state→menu→leaf) via `POST /api/voice/static-step` form posts, verifying the TwiML transitions and that a no-buyer leaf writes a `StaticCallback`. Do NOT flip the production engine.
- [ ] **Step 4:** (no commit — verification.)

## Self-Review

**Spec coverage (§6.1 intake, §6.2 routing, decisions):**
- Intake age→state→menu→leaf→ask → Task 4 phases. Speech+DTMF (`input="speech dtmf"`, `matchSelection` digit-or-word) → Tasks 2/4. `{money words list}` = enabled top-level via `moneyWordsList`/`topMenu` → Task 4.
- SWRR routing over active+under-cap, redistribution → 2A `selectBuyer`, invoked in `pickBuyerFor` (Task 3). Daily reset (CST) → Task 3 rollover check. Caps → eligibility. Weights → SWRR.
- Caller-ID (DID) passthrough → `transfer()` `callerId = call.fromNumber` (Task 4). After-hours number → `isAfterHours` + `pickBuyerFor` number choice (Tasks 2/3). Backup on no-answer → `phase=backup` Dial action (Task 4).
- Exact-ZIP override → Task 3 (radius DEFERRED to 2C, per constraints). No-buyer → callback capture + "notify you" message → Tasks 1/3/4.
- Dormant/flag-gated → Task 5 single branch; Fluid untouched.

**Deferred to 2C (documented, not built):** geo-radius ZIP, Twilio test numbers, money-word cloud UI, callback follow-up SMS, "other"/training game, agent/manager deflection. Carried from 2A final review: SWRR all-zero-weight fallback + `updateBuyer` coercion (apply when hardening 2B).

**Placeholder scan:** none. **Type consistency:** `MenuNode`/`SwrrBuyer` shapes match across voice/routing/step; `pickBuyerFor(leafId,ctx,nowMs)` signature consistent; `staticGreeting` exported from the step route and imported by inbound.
