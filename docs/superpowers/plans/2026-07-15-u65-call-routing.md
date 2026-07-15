# U65 Call Routing & Ringba Reconciliation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an additive under‑65 ("U65") private‑health call product — a `/dashboard/u65` control‑and‑reporting page that routes qualifying calls to a buyer, tracks a 121‑second transfer‑leg billable ($75), and reconciles against BrokerCalls/Ringba.

**Architecture:** A new `U65Call` table isolates all feature data (no changes to the central `Call` model). Pure business logic (hours/state gating at fixed UTC−6, the 121s billable threshold, week‑to‑date math, Ringba matching) lives in dependency‑free `src/lib/u65.ts` and `src/lib/ringba.ts` and is unit‑tested with vitest. Thin Twilio webhook routes and one edit to the existing AI voice flow wire the phones; a server‑component page renders reporting; Ringba reconciliation is read‑only and degrades gracefully until the API token is authorized.

**Tech Stack:** Next.js App Router (server components + route handlers returning TwiML), Prisma + SQLite (`prisma db push`, no migration files), TypeScript, `tsx`, **vitest** (added here for unit tests), existing UI kit (`@/components/ui`).

## Global Constraints

- **Additive only.** No existing flow, route, dashboard, or report changes behavior. The only edits to existing files are: `src/app/api/voice/step/route.ts` (insert a U65 branch), `src/components/dash/Nav.tsx` (add nav entries), `prisma/schema.prisma` (add a model), `package.json` (add test script + vitest dev deps).
- **Billable rule (exact):** transfer‑leg seconds `>= 121` → billable; `BILLABLE_CENTS = 7500` ($75.00 flat). Uses Twilio `DialCallDuration` (transfer leg only), never total call time.
- **Time (exact):** fixed **UTC−6, no daylight saving**. `U65_OFFSET_MIN = -360`. "Week to date" = since **Monday 00:00 at UTC−6**. Hours default `08:30`–`18:30`.
- **Destination defaults:** SET number `+13809790146`; backup number `+19728006670`; after‑hours default mode `regular`.
- **Ringba:** host `https://api.ringba.com/v2/{accountId}/…`; auth header `Authorization: Token {RINGBA_API_TOKEN}`; account id `CA5f21b5af6efb48eda821bff312693e3f`. **Token only in env `RINGBA_API_TOKEN`** — never in DB, code, or git. Read‑only.
- **DB migrations:** apply schema changes with `npm run db:push` (this repo has no `prisma/migrations`).
- **Money in cents** everywhere; format for display with `usd2` from `@/lib/format`.

---

## File structure

| Path | Responsibility |
|---|---|
| `src/lib/u65.ts` | **New, pure (no imports of `db`).** Types, `defaultU65Config`, `US_STATES`, `isBillable`, `isWithinHours`, `isStateEnabled`, `weekToDateStartUtcMs`, `matchesU65Intent`, constants. Unit‑tested. |
| `src/lib/u65-store.ts` | **New.** `loadU65Config` / `saveU65Config` (Prisma `Setting` key `u65Config`). Imports `db` + `u65.ts`. |
| `src/lib/ringba.ts` | **New.** `RingbaCallRow`, pure `matchRingba` (unit‑tested), network `fetchRingbaCallLogs` (env token, guarded). |
| `src/app/api/u65/config/route.ts` | **New.** GET returns config; POST saves a partial. |
| `src/app/api/u65/status/route.ts` | **New.** Twilio `<Dial action>` callback → writes `transferSec` + billable. |
| `src/app/api/u65/direct/route.ts` | **New.** No‑AI webhook for 220‑3471 → dial SET number. |
| `src/app/api/u65/reconcile/route.ts` | **New.** "Sync Ringba" trigger. |
| `src/app/api/voice/step/route.ts` | **Edit.** Insert U65 qualifying step after intake. |
| `src/app/dashboard/u65/page.tsx` | **New.** The page (server component). |
| `src/components/u65/U65Controls.tsx` | **New.** Client controls (states/number/hours/after‑hours/sync). |
| `src/components/dash/Nav.tsx` | **Edit.** Add U65 to `LEFT_NAV` and `UNIT_TABS`. |
| `prisma/schema.prisma` | **Edit.** Add `U65Call` model. |
| `vitest.config.ts`, `package.json` | **New/edit.** Test runner. |
| `src/lib/u65.test.ts`, `src/lib/ringba.test.ts` | **New.** Unit tests. |

---

### Task 1: Test runner (vitest)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/smoke.test.ts` (temporary, deleted at end of task)

**Interfaces:**
- Produces: an `npm test` script that runs `vitest run`, so every later task can add `*.test.ts` files under `src/`.

- [ ] **Step 1: Add vitest dev dependency**

Run: `npm install -D vitest@^2`
Expected: `vitest` appears under `devDependencies`; no runtime deps change.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 3: Add the test script to `package.json`**

In the `"scripts"` block add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write a smoke test**

Create `src/lib/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("vitest", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the smoke test**

Run: `npm test`
Expected: PASS — 1 test passed.

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm src/lib/smoke.test.ts
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest test runner"
```

---

### Task 2: `U65Call` data model

**Files:**
- Modify: `prisma/schema.prisma` (append a model)

**Interfaces:**
- Produces: Prisma model `U65Call` (client accessor `db.u65Call`) with fields:
  `id, callId?, source, fromNumber, name, state, u65, answer, afterHours, forwardedTo, transferSec, billable, billableCents, ringbaCallId, ringbaSec, ringbaPaid, reconciled, reconciledAt?, isTest, createdAt`.

- [ ] **Step 1: Append the model to `prisma/schema.prisma`**

```prisma
model U65Call {
  id             String    @id @default(cuid())
  callId         String?   // links to Call when the AI line created one
  source         String    @default("ai_633")  // ai_633 | direct_220
  fromNumber     String    @default("")
  name           String    @default("")
  state          String    @default("")
  u65            Boolean   @default(true)
  answer         String    @default("")         // e.g. "yes · private", "no", "direct", "after-hours"
  afterHours     Boolean   @default(false)
  forwardedTo    String    @default("")
  transferSec    Int       @default(0)          // DialCallDuration — transfer leg only
  billable       Boolean   @default(false)      // transferSec >= 121
  billableCents  Int       @default(0)          // 7500 when billable
  ringbaCallId   String    @default("")
  ringbaSec      Int       @default(0)
  ringbaPaid     Boolean   @default(false)
  reconciled     Boolean   @default(false)
  reconciledAt   DateTime?
  isTest         Boolean   @default(false)
  createdAt      DateTime  @default(now())

  @@index([createdAt])
  @@index([billable])
  @@index([reconciled])
}
```

- [ ] **Step 2: Push the schema and regenerate the client**

Run: `npm run db:push`
Expected: "Your database is now in sync with your Prisma schema", Prisma Client regenerated, no errors.

- [ ] **Step 3: Verify the client accessor exists**

Run: `npx tsx -e "import {db} from './src/lib/db'; db.u65Call.count().then(n=>{console.log('u65Call rows:', n); process.exit(0)})"`
Expected: prints `u65Call rows: 0` (table exists, empty).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add U65Call model"
```

---

### Task 3: Pure U65 logic (`src/lib/u65.ts`)

**Files:**
- Create: `src/lib/u65.ts`
- Create: `src/lib/u65.test.ts`

**Interfaces:**
- Produces (imported by Tasks 4–10):
  - `type DayKey = "mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun"`
  - `type U65Config = { setNumber, backupNumber, afterHoursMode: "regular"|"backup", hours: { start: string; end: string; days: Record<DayKey, boolean> }, timezone: string, states: Record<string, boolean>, ringbaAccountId: string, ringbaCampaignId: string }`
  - `const US_STATES: string[]` (50 postal codes)
  - `const U65_OFFSET_MIN = -360`, `const BILLABLE_THRESHOLD_SEC = 121`, `const BILLABLE_CENTS = 7500`
  - `function defaultU65Config(): U65Config`
  - `function isBillable(transferSec: number): boolean`
  - `function isStateEnabled(cfg: U65Config, state: string): boolean`
  - `function isWithinHours(cfg: U65Config, atUtcMs: number): boolean`
  - `function weekToDateStartUtcMs(atUtcMs: number): number`
  - `function matchesU65Intent(speech: string): boolean`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/u65.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  US_STATES, BILLABLE_CENTS, defaultU65Config, isBillable, isStateEnabled,
  isWithinHours, weekToDateStartUtcMs, matchesU65Intent,
} from "./u65";

describe("defaultU65Config", () => {
  it("enables all 50 states and sets the documented defaults", () => {
    const c = defaultU65Config();
    expect(US_STATES).toHaveLength(50);
    expect(Object.values(c.states).every((v) => v === true)).toBe(true);
    expect(Object.keys(c.states)).toHaveLength(50);
    expect(c.setNumber).toBe("+13809790146");
    expect(c.backupNumber).toBe("+19728006670");
    expect(c.afterHoursMode).toBe("regular");
    expect(c.hours.start).toBe("08:30");
    expect(c.hours.end).toBe("18:30");
    expect(c.ringbaAccountId).toBe("CA5f21b5af6efb48eda821bff312693e3f");
  });
});

describe("isBillable", () => {
  it("is false at 120, true at 121 and 122", () => {
    expect(isBillable(120)).toBe(false);
    expect(isBillable(121)).toBe(true);
    expect(isBillable(122)).toBe(true);
  });
});

describe("isStateEnabled", () => {
  it("matches case-insensitively and rejects blanks/disabled", () => {
    const c = defaultU65Config();
    c.states.TX = false;
    expect(isStateEnabled(c, "ca")).toBe(true);
    expect(isStateEnabled(c, "TX")).toBe(false);
    expect(isStateEnabled(c, "")).toBe(false);
    expect(isStateEnabled(c, "ZZ")).toBe(false);
  });
});

describe("isWithinHours (fixed UTC-6)", () => {
  const c = defaultU65Config();
  // 2026-07-15 is a Wednesday. UTC-6 wall clock = UTC - 6h.
  it("is open at 08:30 local (14:30 UTC) and closed just before", () => {
    expect(isWithinHours(c, Date.parse("2026-07-15T14:30:00Z"))).toBe(true);  // 08:30 -06
    expect(isWithinHours(c, Date.parse("2026-07-15T14:29:00Z"))).toBe(false); // 08:29 -06
  });
  it("is open before 18:30 local and closed at/after it", () => {
    expect(isWithinHours(c, Date.parse("2026-07-16T00:29:00Z"))).toBe(true);  // 18:29 -06 (still Wed local)
    expect(isWithinHours(c, Date.parse("2026-07-16T00:30:00Z"))).toBe(false); // 18:30 -06
  });
  it("respects a disabled day", () => {
    const off = defaultU65Config();
    off.hours.days.wed = false;
    expect(isWithinHours(off, Date.parse("2026-07-15T18:00:00Z"))).toBe(false); // noon Wed local, day off
  });
});

describe("weekToDateStartUtcMs", () => {
  it("returns Monday 00:00 at UTC-6 as a UTC instant", () => {
    // Wed 2026-07-15 12:00 local (-06) => Monday 2026-07-13 00:00 -06 => 06:00 UTC.
    const start = weekToDateStartUtcMs(Date.parse("2026-07-15T18:00:00Z"));
    expect(new Date(start).toISOString()).toBe("2026-07-13T06:00:00.000Z");
  });
  it("on Monday 00:15 local returns that same Monday 00:00 local", () => {
    // Monday 2026-07-13 00:15 local (-06) => 06:15 UTC.
    const start = weekToDateStartUtcMs(Date.parse("2026-07-13T06:15:00Z"));
    expect(new Date(start).toISOString()).toBe("2026-07-13T06:00:00.000Z");
  });
});

describe("matchesU65Intent", () => {
  it("is true for affirmatives and money words", () => {
    expect(matchesU65Intent("yes please")).toBe(true);
    expect(matchesU65Intent("I need private insurance")).toBe(true);
    expect(matchesU65Intent("looking for health insurance")).toBe(true);
    expect(matchesU65Intent("medical insurance")).toBe(true);
  });
  it("is false for negatives and unrelated speech", () => {
    expect(matchesU65Intent("no thanks")).toBe(false);
    expect(matchesU65Intent("just checking my medicare card")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/lib/u65.test.ts`
Expected: FAIL — cannot resolve `./u65` / exports undefined.

- [ ] **Step 3: Implement `src/lib/u65.ts`**

```ts
// Pure U65 business logic. MUST NOT import the DB or any server-only module —
// this file is unit-tested in isolation and imported by webhooks + the page.

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type U65Config = {
  setNumber: string;
  backupNumber: string;
  afterHoursMode: "regular" | "backup";
  hours: { start: string; end: string; days: Record<DayKey, boolean> };
  timezone: string; // informational label; the offset is fixed below
  states: Record<string, boolean>;
  ringbaAccountId: string;
  ringbaCampaignId: string;
};

export const U65_OFFSET_MIN = -360; // fixed UTC-6, no daylight saving
export const BILLABLE_THRESHOLD_SEC = 121;
export const BILLABLE_CENTS = 7500;

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const U65_MONEY_WORDS = ["private", "health insurance", "medical insurance", "individual"];

export function defaultU65Config(): U65Config {
  const states: Record<string, boolean> = {};
  for (const s of US_STATES) states[s] = true;
  const days = { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true };
  return {
    setNumber: "+13809790146",
    backupNumber: "+19728006670",
    afterHoursMode: "regular",
    hours: { start: "08:30", end: "18:30", days },
    timezone: "UTC-6",
    states,
    ringbaAccountId: "CA5f21b5af6efb48eda821bff312693e3f",
    ringbaCampaignId: "",
  };
}

export function isBillable(transferSec: number): boolean {
  return transferSec >= BILLABLE_THRESHOLD_SEC;
}

export function isStateEnabled(cfg: U65Config, state: string): boolean {
  const s = (state || "").toUpperCase().trim();
  return !!s && cfg.states[s] === true;
}

// Wall-clock minutes-of-day + weekday for a UTC instant, viewed at fixed UTC-6.
function wallClockMinus6(atUtcMs: number): { day: number; minutes: number } {
  const shifted = new Date(atUtcMs + U65_OFFSET_MIN * 60_000);
  return { day: shifted.getUTCDay(), minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() };
}

function hhmmToMin(hhmm: string): number {
  const [h, m] = (hhmm || "0:0").split(":").map((x) => parseInt(x, 10) || 0);
  return h * 60 + m;
}

export function isWithinHours(cfg: U65Config, atUtcMs: number): boolean {
  const { day, minutes } = wallClockMinus6(atUtcMs);
  if (!cfg.hours.days[DAY_KEYS[day]]) return false;
  const start = hhmmToMin(cfg.hours.start);
  const end = hhmmToMin(cfg.hours.end);
  return minutes >= start && minutes < end;
}

// Monday 00:00 at UTC-6, returned as a UTC-instant millisecond value.
export function weekToDateStartUtcMs(atUtcMs: number): number {
  const shifted = new Date(atUtcMs + U65_OFFSET_MIN * 60_000);
  const daysSinceMon = (shifted.getUTCDay() + 6) % 7; // Sun=0 -> 6, Mon=1 -> 0
  const localMidnight = Date.UTC(
    shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() - daysSinceMon, 0, 0, 0,
  );
  return localMidnight - U65_OFFSET_MIN * 60_000; // convert -6 wall midnight back to real UTC
}

export function matchesU65Intent(speech: string): boolean {
  const t = (speech || "").toLowerCase();
  if (/\b(yes|yeah|yep|yup|correct|sure|i am|that'?s right|uh[ -]?huh)\b/.test(t)) return true;
  return U65_MONEY_WORDS.some((w) => t.includes(w));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/lib/u65.test.ts`
Expected: PASS — all assertions green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/u65.ts src/lib/u65.test.ts
git commit -m "feat: pure U65 logic (hours/state gating, billable, week-to-date, intent)"
```

---

### Task 4: Config store + API route

**Files:**
- Create: `src/lib/u65-store.ts`
- Create: `src/app/api/u65/config/route.ts`

**Interfaces:**
- Consumes: `defaultU65Config`, `U65Config` from `src/lib/u65.ts`; `db` from `@/lib/db`.
- Produces: `loadU65Config(): Promise<U65Config>`, `saveU65Config(patch: Partial<U65Config>): Promise<U65Config>`; a route handling `GET` (returns config JSON) and `POST` (saves a partial, returns saved config).

- [ ] **Step 1: Implement `src/lib/u65-store.ts`**

```ts
import { db } from "@/lib/db";
import { defaultU65Config, U65Config, DayKey } from "@/lib/u65";

const KEY = "u65Config";

// Deep-merge a saved partial over defaults so new config fields always have a value.
function merge(base: U65Config, saved: Partial<U65Config>): U65Config {
  return {
    ...base,
    ...saved,
    hours: {
      ...base.hours,
      ...(saved.hours || {}),
      days: { ...base.hours.days, ...((saved.hours?.days as Record<DayKey, boolean>) || {}) },
    },
    states: { ...base.states, ...(saved.states || {}) },
  };
}

export async function loadU65Config(): Promise<U65Config> {
  const base = defaultU65Config();
  const row = await db.setting.findUnique({ where: { key: KEY } }).catch(() => null);
  if (!row) return base;
  try {
    return merge(base, JSON.parse(row.value) as Partial<U65Config>);
  } catch {
    return base;
  }
}

export async function saveU65Config(patch: Partial<U65Config>): Promise<U65Config> {
  const next = merge(await loadU65Config(), patch);
  const value = JSON.stringify(next);
  await db.setting.upsert({ where: { key: KEY }, update: { value }, create: { key: KEY, value } });
  return next;
}
```

- [ ] **Step 2: Implement `src/app/api/u65/config/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { loadU65Config, saveU65Config } from "@/lib/u65-store";

export async function GET() {
  return NextResponse.json(await loadU65Config());
}

export async function POST(req: NextRequest) {
  const patch = await req.json().catch(() => ({}));
  const saved = await saveU65Config(patch);
  return NextResponse.json(saved);
}
```

- [ ] **Step 3: Verify round-trip against the dev DB**

Run:
```bash
npx tsx -e "import {saveU65Config, loadU65Config} from './src/lib/u65-store'; (async()=>{ await saveU65Config({setNumber:'+15550001111', states:{CA:false}}); const c=await loadU65Config(); console.log('setNumber', c.setNumber, '| CA', c.states.CA, '| TX', c.states.TX, '| start', c.hours.start); process.exit(0); })()"
```
Expected: `setNumber +15550001111 | CA false | TX true | start 08:30` (patch applied, unset fields keep defaults).

- [ ] **Step 4: Reset the test value**

Run: `npx tsx -e "import {saveU65Config} from './src/lib/u65-store'; saveU65Config({setNumber:'+13809790146', states:{CA:true}}).then(()=>process.exit(0))"`
Expected: no error.

- [ ] **Step 5: Commit**

```bash
git add src/lib/u65-store.ts src/app/api/u65/config/route.ts
git commit -m "feat: U65 config store + config API route"
```

---

### Task 5: Ringba client + matcher (`src/lib/ringba.ts`)

**Files:**
- Create: `src/lib/ringba.ts`
- Create: `src/lib/ringba.test.ts`

**Interfaces:**
- Produces:
  - `type RingbaCallRow = { callId: string; inboundPhone: string; connectedSec: number; payoutCents: number; callAtMs: number }`
  - `type U65Match = { u65Id: string; ringbaCallId: string; ringbaSec: number; ringbaPaid: boolean }`
  - `function matchRingba(u65: {id:string; fromNumber:string; createdAtMs:number}[], rows: RingbaCallRow[], windowMs?: number): U65Match[]` (pure)
  - `function fetchRingbaCallLogs(opts: {accountId:string; campaignId?:string; startMs:number; endMs:number}): Promise<RingbaCallRow[]>` (network; returns `[]` when `RINGBA_API_TOKEN` unset or on non‑200)

- [ ] **Step 1: Write the failing test (pure matcher)**

Create `src/lib/ringba.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { matchRingba, RingbaCallRow } from "./ringba";

const base = Date.parse("2026-07-15T15:00:00Z");
const rows: RingbaCallRow[] = [
  { callId: "R1", inboundPhone: "+1 (214) 555-0100", connectedSec: 130, payoutCents: 7500, callAtMs: base + 60_000 },
  { callId: "R2", inboundPhone: "2145550999", connectedSec: 90, payoutCents: 0, callAtMs: base + 40 * 60_000 },
];

describe("matchRingba", () => {
  it("matches by last-10 digits within the time window and flags paid on >120s", () => {
    const out = matchRingba([{ id: "u1", fromNumber: "(214) 555-0100", createdAtMs: base }], rows);
    expect(out).toEqual([{ u65Id: "u1", ringbaCallId: "R1", ringbaSec: 130, ringbaPaid: true }]);
  });
  it("does not match when outside the window", () => {
    const out = matchRingba([{ id: "u2", fromNumber: "2145550999", createdAtMs: base }], rows, 15 * 60_000);
    expect(out).toEqual([]);
  });
  it("marks not paid when connected <=120 and payout 0", () => {
    const near: RingbaCallRow[] = [{ ...rows[1], callAtMs: base + 60_000 }];
    const out = matchRingba([{ id: "u3", fromNumber: "2145550999", createdAtMs: base }], near);
    expect(out[0].ringbaPaid).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/ringba.test.ts`
Expected: FAIL — cannot resolve `./ringba`.

- [ ] **Step 3: Implement `src/lib/ringba.ts`**

```ts
// BrokerCalls / Ringba read-only reconciliation.
// Token comes ONLY from process.env.RINGBA_API_TOKEN — never hard-coded or stored in the DB.

export type RingbaCallRow = {
  callId: string;
  inboundPhone: string;
  connectedSec: number;
  payoutCents: number;
  callAtMs: number;
};

export type U65Match = {
  u65Id: string;
  ringbaCallId: string;
  ringbaSec: number;
  ringbaPaid: boolean;
};

const last10 = (p: string) => (p || "").replace(/\D/g, "").slice(-10);

export function matchRingba(
  u65: { id: string; fromNumber: string; createdAtMs: number }[],
  rows: RingbaCallRow[],
  windowMs = 15 * 60_000,
): U65Match[] {
  const out: U65Match[] = [];
  for (const c of u65) {
    const key = last10(c.fromNumber);
    if (!key) continue;
    const best = rows
      .filter((r) => last10(r.inboundPhone) === key && Math.abs(r.callAtMs - c.createdAtMs) <= windowMs)
      .sort((a, b) => Math.abs(a.callAtMs - c.createdAtMs) - Math.abs(b.callAtMs - c.createdAtMs))[0];
    if (!best) continue;
    out.push({
      u65Id: c.id,
      ringbaCallId: best.callId,
      ringbaSec: best.connectedSec,
      ringbaPaid: best.connectedSec > 120 || best.payoutCents > 0,
    });
  }
  return out;
}

export async function fetchRingbaCallLogs(opts: {
  accountId: string;
  campaignId?: string;
  startMs: number;
  endMs: number;
}): Promise<RingbaCallRow[]> {
  const token = process.env.RINGBA_API_TOKEN;
  if (!token || !opts.accountId) return []; // graceful degrade — Ringba not connected yet
  const body: Record<string, unknown> = {
    reportStart: new Date(opts.startMs).toISOString(),
    reportEnd: new Date(opts.endMs).toISOString(),
    offset: 0,
    size: 1000,
    filters: opts.campaignId
      ? [{ anyConditionToMatch: [{ column: "campaignId", value: opts.campaignId, comparisonType: "EQUALS" }] }]
      : [],
    valueColumns: [
      { column: "inboundCallId" }, { column: "callDt" }, { column: "inboundPhoneNumber" },
      { column: "connectedCallLengthInSeconds" }, { column: "hasConnected" }, { column: "payoutAmount" },
    ],
  };
  const res = await fetch(`https://api.ringba.com/v2/${opts.accountId}/calllogs`, {
    method: "POST",
    headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!res || !res.ok) return [];
  const json = await res.json().catch(() => null);
  const records: Record<string, unknown>[] = json?.report?.records || json?.records || [];
  return records.map((r) => ({
    callId: String(r.inboundCallId ?? r.callId ?? ""),
    inboundPhone: String(r.inboundPhoneNumber ?? ""),
    connectedSec: Math.round(Number(r.connectedCallLengthInSeconds ?? 0)),
    payoutCents: Math.round(Number(r.payoutAmount ?? 0) * 100),
    callAtMs: Date.parse(String(r.callDt ?? "")) || 0,
  }));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/lib/ringba.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ringba.ts src/lib/ringba.test.ts
git commit -m "feat: Ringba call-log fetch + pure matcher (read-only)"
```

---

### Task 6: Billable status callback (`/api/u65/status`)

**Files:**
- Create: `src/app/api/u65/status/route.ts`

**Interfaces:**
- Consumes: `isBillable`, `BILLABLE_CENTS` from `@/lib/u65`; `db.u65Call`.
- Produces: a Twilio `<Dial action>` handler at `/api/u65/status?u65=<id>` that writes `transferSec`, `billable`, `billableCents` and returns empty TwiML.

- [ ] **Step 1: Implement the route**

```ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isBillable, BILLABLE_CENTS } from "@/lib/u65";

const emptyTwiml = () =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
    headers: { "Content-Type": "text/xml" },
  });

// Twilio POSTs here when the U65 <Dial> completes. DialCallDuration = the transfer
// leg only (buyer answer -> hangup), which is exactly the billable clock.
export async function POST(req: NextRequest) {
  const u65Id = new URL(req.url).searchParams.get("u65") || "";
  const form = await req.formData().catch(() => null);
  const dialSec = parseInt(String(form?.get("DialCallDuration") || form?.get("CallDuration") || "0"), 10);
  if (u65Id) {
    const billable = isBillable(dialSec);
    await db.u65Call
      .update({
        where: { id: u65Id },
        data: { transferSec: dialSec, billable, billableCents: billable ? BILLABLE_CENTS : 0 },
      })
      .catch(() => {});
  }
  return emptyTwiml();
}
```

- [ ] **Step 2: Verify billable math end-to-end against the DB**

Run:
```bash
npx tsx -e "import {db} from './src/lib/db'; import {isBillable,BILLABLE_CENTS} from './src/lib/u65'; (async()=>{ const r=await db.u65Call.create({data:{source:'ai_633',fromNumber:'+15550000000',isTest:true}}); const sec=121; await db.u65Call.update({where:{id:r.id},data:{transferSec:sec,billable:isBillable(sec),billableCents:isBillable(sec)?BILLABLE_CENTS:0}}); const g=await db.u65Call.findUnique({where:{id:r.id}}); console.log('sec',g.transferSec,'billable',g.billable,'cents',g.billableCents); await db.u65Call.delete({where:{id:r.id}}); process.exit(0); })()"
```
Expected: `sec 121 billable true cents 7500`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/u65/status/route.ts
git commit -m "feat: U65 transfer-leg status callback + billable capture"
```

---

### Task 7: Direct no-AI webhook (`/api/u65/direct`)

**Files:**
- Create: `src/app/api/u65/direct/route.ts`

**Interfaces:**
- Consumes: `loadU65Config` from `@/lib/u65-store`; `isWithinHours` from `@/lib/u65`; `normalizePhone` from `@/lib/sms`; `db.u65Call`.
- Produces: a Twilio voice webhook for the 220‑3471 number that logs a `U65Call(source="direct_220")` and dials the SET number (or backup after hours) with `action=/api/u65/status?u65=<id>`.

- [ ] **Step 1: Implement the route**

```ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { loadU65Config } from "@/lib/u65-store";
import { isWithinHours } from "@/lib/u65";
import { normalizePhone } from "@/lib/sms";

const BASE = "https://medigap.plus";
const xml = (body: string) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml" },
  });

// No-AI direct line (346) 220-3471 -> straight to the SET number, tracked + billable.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const from = String(form?.get("From") || "");
  const state = String(form?.get("FromState") || "");
  const cfg = await loadU65Config();

  const open = isWithinHours(cfg, Date.now());
  const afterHours = !open;
  // The direct line has no AI, so "regular flow" can't apply; after hours -> backup if set, else SET.
  const dest = afterHours ? cfg.backupNumber || cfg.setNumber : cfg.setNumber;

  const rec = await db.u65Call.create({
    data: {
      source: "direct_220", fromNumber: from, state, u65: true,
      answer: afterHours ? "direct · after-hours" : "direct", afterHours, forwardedTo: dest,
    },
  });

  const num = normalizePhone(dest) || dest;
  const action = `${BASE}/api/u65/status?u65=${rec.id}`;
  return xml(`<Dial timeout="30" record="record-from-answer-dual" action="${action}"><Number>${num}</Number></Dial>`);
}
```

- [ ] **Step 2: Verify it produces a valid dial to the SET number**

Run:
```bash
npx tsx -e "import {POST} from './src/app/api/u65/direct/route'; (async()=>{ const fd=new FormData(); fd.set('From','+12145550100'); fd.set('FromState','TX'); const res=await POST(new Request('http://x/api/u65/direct',{method:'POST',body:fd})); const t=await res.text(); console.log(t.includes('13809790146')?'DIALS SET NUMBER ✅':'NO ✗'); console.log(t); process.exit(0); })()"
```
Expected: prints `DIALS SET NUMBER ✅` and TwiML containing `<Dial ... action=".../api/u65/status?u65=...">` (during hours). A `U65Call` row is created — clean it if desired.

- [ ] **Step 3: Clean the verification row and commit**

```bash
npx tsx -e "import {db} from './src/lib/db'; db.u65Call.deleteMany({where:{source:'direct_220', name:''}}).then(r=>{console.log('deleted',r.count);process.exit(0)})"
git add src/app/api/u65/direct/route.ts
git commit -m "feat: U65 direct no-AI webhook (220-3471 -> SET number)"
```

---

### Task 8: U65 branch in the AI voice flow

**Files:**
- Modify: `src/app/api/voice/step/route.ts`

**Interfaces:**
- Consumes: `loadU65Config` from `@/lib/u65-store`; `isWithinHours`, `isStateEnabled`, `matchesU65Intent` from `@/lib/u65`; `ageFromSpeech` (already imported), `normalizePhone`, `db.u65Call`.
- Produces: after intake, a new `phase=u65` that asks the U65 question and either transfers to the SET number (billable path) or resumes the normal open flow.

- [ ] **Step 1: Add imports at the top of the file**

Add to the existing import block:

```ts
import { loadU65Config } from "@/lib/u65-store";
import { isWithinHours, isStateEnabled, matchesU65Intent } from "@/lib/u65";
```

- [ ] **Step 2: Add a U65 transfer helper (place after the existing `transferMoneyWord` function, before `export async function POST`)**

```ts
// U65 hot transfer: bridge the caller straight to the buyer's SET number and record
// a U65Call whose status callback captures the 121s billable clock.
async function u65Transfer(callId: string, u65Id: string, voice: string, dest: string) {
  const s = await getSettings();
  const num = normalizePhone(dest) || dest;
  const action = `${BASE}/api/u65/status?u65=${u65Id}`;
  await db.call.update({ where: { id: callId }, data: { forwardedTo: num, status: "transferring", disposition: "u65" } }).catch(() => {});
  const numberEl = s.callWhisper ? `<Number url="${BASE}/api/calls/whisper">${num}</Number>` : `<Number>${num}</Number>`;
  return `<Dial timeout="30" callerId="${s.raw["tollFreeCallerId"] || "+18006334427"}" record="record-from-answer-dual" action="${action}">${numberEl}</Dial>`;
}
```

- [ ] **Step 3: Branch to the U65 question at intake completion**

In the intake-complete block, replace the **entire block** that begins at `const lead = call.leadId ? await db.lead.findUnique(...)` and ends at the final `return xml(sayGather(action, agent.voice, intro));` (currently ~lines 115–122) with the following. Replace from `const lead` inclusive so `lead`/`fn`/`age` are declared exactly once:

```ts
    // Intake complete → decide U65 vs normal open flow.
    const lead = call.leadId ? await db.lead.findUnique({ where: { id: call.leadId } }) : null;
    const fn = firstName(lead?.name || "");
    const age = ageFromSpeech(lead?.dob || speech);
    const cfg = await loadU65Config();
    const u65Eligible = age !== null && age < 65 && isStateEnabled(cfg, call.state);
    const withinHours = isWithinHours(cfg, Date.now());

    if (u65Eligible && withinHours) {
      // Create the U65Call now; the phase=u65 turn fills in the answer + routes.
      const rec = await db.u65Call.create({
        data: { callId: call.id, source: "ai_633", fromNumber: call.fromNumber, name: lead?.name || "", state: call.state, u65: true, forwardedTo: cfg.setNumber },
      });
      const ask = `Thank you${fn ? " " + fn : ""}. Are you looking for private or individual health insurance?`;
      const action = `${BASE}/api/voice/step?callId=${call.id}&phase=u65&u65=${rec.id}`;
      dialogue.push({ role: "assistant", text: ask, at: nowISO() });
      await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue), status: "in-progress" } }).catch(() => {});
      return xml(sayGather(action, agent.voice, ask));
    }

    if (u65Eligible && !withinHours) {
      // Log the after-hours U65 call for the report; default mode = regular flow (fall through).
      await db.u65Call.create({
        data: { callId: call.id, source: "ai_633", fromNumber: call.fromNumber, name: lead?.name || "", state: call.state, u65: true, afterHours: true, answer: "after-hours · regular flow" },
      }).catch(() => {});
    }

    const intro = `${age ? `Thank you. That makes you about ${age}. ` : "Thank you. "}Okay${fn ? " " + fn : ""}, how can I help you today?`;
    const action = `${BASE}/api/voice/step?callId=${call.id}&phase=open&turn=0`;
    dialogue.push({ role: "assistant", text: intro, at: nowISO() });
    await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue), status: "in-progress" } }).catch(() => {});
    return xml(sayGather(action, agent.voice, intro));
```

- [ ] **Step 4: Handle the `phase=u65` answer (insert immediately after the closing brace of the `if (phase === "intake") { … }` block, before the OPEN PHASE comment)**

```ts
  // -------- U65 PHASE: buyer qualifying question --------
  if (phase === "u65") {
    const u65Id = url.searchParams.get("u65") || "";
    const cfg = await loadU65Config();
    if (matchesU65Intent(speech)) {
      await db.u65Call.update({ where: { id: u65Id }, data: { answer: `yes · ${speech.slice(0, 60)}` } }).catch(() => {});
      const line = "Great — let me connect you now. One moment.";
      dialogue.push({ role: "assistant", text: line, at: nowISO() });
      await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue) } }).catch(() => {});
      return xml(`<Say voice="${agent.voice}">${esc(line)}</Say>${await u65Transfer(call.id, u65Id, agent.voice, cfg.setNumber)}`);
    }
    // "No" → mark it and resume the normal open flow (ping tree / auction unchanged).
    await db.u65Call.update({ where: { id: u65Id }, data: { answer: `no · ${speech.slice(0, 60)}` } }).catch(() => {});
    const intro = "No problem. How can I help you today?";
    const action = `${BASE}/api/voice/step?callId=${call.id}&phase=open&turn=0`;
    dialogue.push({ role: "assistant", text: intro, at: nowISO() });
    await db.call.update({ where: { id: call.id }, data: { transcript: JSON.stringify(dialogue) } }).catch(() => {});
    return xml(sayGather(action, agent.voice, intro));
  }
```

- [ ] **Step 5: Also re-prompt correctly on silence during the U65 phase**

In the "No speech captured" block near the top of `POST`, change the `action`/`line` ternary to also cover `phase === "u65"`:

```ts
  if (!speech) {
    const u65Id = url.searchParams.get("u65") || "";
    const action =
      phase === "intake" ? `${BASE}/api/voice/step?callId=${call.id}&phase=intake&idx=${idx}`
      : phase === "u65" ? `${BASE}/api/voice/step?callId=${call.id}&phase=u65&u65=${u65Id}`
      : `${BASE}/api/voice/step?callId=${call.id}&phase=open&turn=${turn}`;
    const line =
      phase === "intake" ? (intake[idx]?.ask || "Could you repeat that?")
      : phase === "u65" ? "Sorry, I didn't catch that. Are you looking for private or individual health insurance?"
      : "Sorry, I didn't catch that. How can I help you?";
    return xml(sayGather(action, agent.voice, line));
  }
```

- [ ] **Step 6: Typecheck the edited flow**

Run: `npx tsc --noEmit`
Expected: no new type errors in `src/app/api/voice/step/route.ts`.

- [ ] **Step 7: Lint and commit**

Run: `npm run lint`
Expected: no new errors.

```bash
git add src/app/api/voice/step/route.ts
git commit -m "feat: U65 qualifying branch in AI voice flow (yes -> SET number, no -> ping tree)"
```

---

### Task 9: Reconcile route (`/api/u65/reconcile`)

**Files:**
- Create: `src/app/api/u65/reconcile/route.ts`

**Interfaces:**
- Consumes: `loadU65Config` from `@/lib/u65-store`; `weekToDateStartUtcMs` from `@/lib/u65`; `fetchRingbaCallLogs`, `matchRingba` from `@/lib/ringba`; `db.u65Call`.
- Produces: a `POST` handler that pulls week‑to‑date Ringba logs, matches them to `U65Call` rows, writes `ringbaCallId/ringbaSec/ringbaPaid/reconciled`, and returns `{ ok, fetched, matched, connected }`.

- [ ] **Step 1: Implement the route**

```ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loadU65Config } from "@/lib/u65-store";
import { weekToDateStartUtcMs } from "@/lib/u65";
import { fetchRingbaCallLogs, matchRingba } from "@/lib/ringba";

export async function POST() {
  const cfg = await loadU65Config();
  const now = Date.now();
  const startMs = weekToDateStartUtcMs(now);

  const rows = await fetchRingbaCallLogs({
    accountId: cfg.ringbaAccountId, campaignId: cfg.ringbaCampaignId || undefined, startMs, endMs: now,
  });
  const connected = !!process.env.RINGBA_API_TOKEN && rows.length >= 0 && !!cfg.ringbaAccountId;

  const u65 = await db.u65Call.findMany({ where: { createdAt: { gte: new Date(startMs) } } });
  const matches = matchRingba(
    u65.map((c) => ({ id: c.id, fromNumber: c.fromNumber, createdAtMs: c.createdAt.getTime() })),
    rows,
  );
  for (const m of matches) {
    await db.u65Call.update({
      where: { id: m.u65Id },
      data: { ringbaCallId: m.ringbaCallId, ringbaSec: m.ringbaSec, ringbaPaid: m.ringbaPaid, reconciled: true, reconciledAt: new Date() },
    }).catch(() => {});
  }
  return NextResponse.json({ ok: true, connected, fetched: rows.length, matched: matches.length });
}
```

- [ ] **Step 2: Verify it degrades gracefully with no token**

Run: `npx tsx -e "import {POST} from './src/app/api/u65/reconcile/route'; POST().then(r=>r.json()).then(j=>{console.log(j);process.exit(0)})"`
Expected: `{ ok: true, connected: false, fetched: 0, matched: 0 }` (no token set → no crash).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/u65/reconcile/route.ts
git commit -m "feat: U65 Ringba reconcile route (week-to-date, read-only)"
```

---

### Task 10: The `/dashboard/u65` page, controls, and nav

**Files:**
- Create: `src/app/dashboard/u65/page.tsx`
- Create: `src/components/u65/U65Controls.tsx`
- Modify: `src/components/dash/Nav.tsx`

**Interfaces:**
- Consumes: `loadU65Config` from `@/lib/u65-store`; `weekToDateStartUtcMs`, `US_STATES`, `U65Config` from `@/lib/u65`; `db.u65Call`; `Card/Stat/Section/Badge` from `@/components/ui`; `usd2, num, fmtPhone` from `@/lib/format`; `POST /api/u65/config`, `POST /api/u65/reconcile`.

- [ ] **Step 1: Add the nav entries in `src/components/dash/Nav.tsx`**

In `LEFT_NAV`, add immediately after the `["Ping Tree", "/dashboard/ping-tree", "🌳"]` line:

```ts
  ["U65", "/dashboard/u65", "🎯"],
```

In `UNIT_TABS`, add after the `["Money Words", "/dashboard/money-words"]` line:

```ts
  ["U65", "/dashboard/u65"],
```

- [ ] **Step 2: Implement the controls component `src/components/u65/U65Controls.tsx`**

```tsx
"use client";
import { useState } from "react";
import { US_STATES, U65Config } from "@/lib/u65";

const DAYS: [keyof U65Config["hours"]["days"], string][] = [
  ["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"],
];

export default function U65Controls({ initial }: { initial: U65Config }) {
  const [cfg, setCfg] = useState<U65Config>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async (patch: Partial<U65Config>) => {
    setSaving(true);
    const res = await fetch("/api/u65/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const next = await res.json();
    setCfg(next); setSaving(false); setMsg("Saved ✓"); setTimeout(() => setMsg(""), 1500);
  };
  const setAllStates = (on: boolean) => save({ states: Object.fromEntries(US_STATES.map((s) => [s, on])) });
  const sync = async () => {
    setSaving(true); setMsg("Syncing Ringba…");
    const r = await fetch("/api/u65/reconcile", { method: "POST" }).then((x) => x.json());
    setSaving(false); setMsg(r.connected ? `Ringba: ${r.matched}/${r.fetched} matched` : "Ringba not connected yet");
    setTimeout(() => setMsg(""), 4000);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">U65 controls</h3>
        <span className="text-xs text-[var(--muted)]">{saving ? "Working…" : msg}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">SET number
          <input className="input mt-1 w-full" defaultValue={cfg.setNumber}
            onBlur={(e) => save({ setNumber: e.target.value.trim() })} />
        </label>
        <label className="text-sm">Backup number (after-hours)
          <input className="input mt-1 w-full" defaultValue={cfg.backupNumber}
            onBlur={(e) => save({ backupNumber: e.target.value.trim() })} />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3 items-end">
        <label className="text-sm">Open (UTC-6)
          <input type="time" className="input mt-1 w-full" defaultValue={cfg.hours.start}
            onBlur={(e) => save({ hours: { ...cfg.hours, start: e.target.value } })} />
        </label>
        <label className="text-sm">Close (UTC-6)
          <input type="time" className="input mt-1 w-full" defaultValue={cfg.hours.end}
            onBlur={(e) => save({ hours: { ...cfg.hours, end: e.target.value } })} />
        </label>
        <label className="text-sm">After-hours
          <select className="input mt-1 w-full" defaultValue={cfg.afterHoursMode}
            onChange={(e) => save({ afterHoursMode: e.target.value as U65Config["afterHoursMode"] })}>
            <option value="regular">REGULAR FLOW (money words)</option>
            <option value="backup">Backup number</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {DAYS.map(([k, label]) => (
          <button key={k} onClick={() => save({ hours: { ...cfg.hours, days: { ...cfg.hours.days, [k]: !cfg.hours.days[k] } } })}
            className={`px-3 py-1 rounded-lg text-xs border ${cfg.hours.days[k] ? "bg-[var(--brand)]/10 text-[var(--brand)] border-[var(--brand)]/40" : "text-[var(--muted)] border-[var(--border)]"}`}>
            {label}
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">States ({US_STATES.filter((s) => cfg.states[s]).length}/50 on)</span>
          <div className="flex gap-2">
            <button className="btn btn-ghost text-xs !py-1" onClick={() => setAllStates(true)}>All on</button>
            <button className="btn btn-ghost text-xs !py-1" onClick={() => setAllStates(false)}>All off</button>
          </div>
        </div>
        <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
          {US_STATES.map((s) => (
            <button key={s} onClick={() => save({ states: { ...cfg.states, [s]: !cfg.states[s] } })}
              className={`px-1 py-1 rounded text-xs border ${cfg.states[s] ? "bg-[var(--brand)]/10 text-[var(--brand)] border-[var(--brand)]/40" : "text-[var(--muted)] border-[var(--border)]"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary text-sm" onClick={sync}>Sync Ringba</button>
    </div>
  );
}
```

- [ ] **Step 3: Implement the page `src/app/dashboard/u65/page.tsx`**

```tsx
import { db } from "@/lib/db";
import { Card, Stat, Section, Badge } from "@/components/ui";
import { usd2, num, fmtPhone } from "@/lib/format";
import { loadU65Config } from "@/lib/u65-store";
import { weekToDateStartUtcMs } from "@/lib/u65";
import U65Controls from "@/components/u65/U65Controls";

export const dynamic = "force-dynamic";

export default async function U65Page() {
  const cfg = await loadU65Config();
  const startMs = weekToDateStartUtcMs(Date.now());
  const calls = await db.u65Call.findMany({ where: { createdAt: { gte: new Date(startMs) } }, orderBy: { createdAt: "desc" }, take: 300 });

  const total = calls.length;
  const over121 = calls.filter((c) => c.transferSec >= 121).length;
  const billableCount = calls.filter((c) => c.billable).length;
  const billableCents = billableCount * 7500;
  const paidCents = calls.filter((c) => c.reconciled && c.ringbaPaid).length * 7500;
  const ringbaConnected = calls.some((c) => c.reconciled);

  const fmt = (d: Date) => new Date(d.getTime() - 6 * 3600_000).toISOString().slice(5, 16).replace("T", " ");

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">🎯 U65 — Under-65 Private Health Calls</h1>
        <p className="text-sm text-[var(--muted)] max-w-3xl">
          Week-to-date (since Monday, UTC-6). Calls transfer to the SET number; a transfer leg of
          <b> ≥121 seconds</b> is billable at <b>$75</b>. &ldquo;Actually paid&rdquo; reconciles against Ringba/BrokerCalls.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Total U65 calls" value={num(total)} sub="week to date" tone="default" />
        <Stat label="Over 121s (ours)" value={num(over121)} sub="transfer leg" tone="up" />
        <Stat label="Billable (ours)" value={usd2(billableCents)} sub={`${num(billableCount)} × $75`} tone="gold" />
        <Stat label="Actually paid (Ringba)" value={ringbaConnected ? usd2(paidCents) : "—"} sub={ringbaConnected ? "reconciled" : "connect Ringba"} tone={ringbaConnected ? "up" : "down"} />
      </div>

      <Section title="Controls" desc="States, destination number, hours (UTC-6), after-hours behavior, and Ringba sync.">
        <U65Controls initial={cfg} />
      </Section>

      <Section title="U65 calls this week" desc="Every U65 call — including after-hours — newest first.">
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">
                <th className="text-left p-3">When (UTC-6)</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Source</th>
                <th className="text-left p-3">State</th>
                <th className="text-left p-3">Answer</th>
                <th className="text-left p-3">Transfer</th>
                <th className="text-left p-3">Billable</th>
                <th className="text-left p-3">Ringba</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-3 whitespace-nowrap text-xs text-[var(--muted)]">{fmt(c.createdAt)}{c.afterHours ? " · AH" : ""}</td>
                  <td className="p-3">{c.name || <span className="text-[var(--muted)]">{c.fromNumber ? fmtPhone(c.fromNumber) : "—"}</span>}</td>
                  <td className="p-3 text-xs">{c.source === "direct_220" ? "Direct" : "AI"}</td>
                  <td className="p-3 text-xs">{c.state || "—"}</td>
                  <td className="p-3 text-xs">{c.answer || "—"}</td>
                  <td className="p-3 text-xs">{c.transferSec ? `${c.transferSec}s` : "—"}</td>
                  <td className="p-3">{c.billable ? <Badge tone="brand">$75</Badge> : <span className="text-[var(--muted)] text-xs">—</span>}</td>
                  <td className="p-3">{c.reconciled ? <Badge tone={c.ringbaPaid ? "brand" : "default"}>{c.ringbaPaid ? "paid" : "no"}</Badge> : <span className="text-[var(--muted)] text-xs">—</span>}</td>
                </tr>
              ))}
              {calls.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-[var(--muted)]">No U65 calls this week yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      </Section>
    </>
  );
}
```

- [ ] **Step 4: Verify the page and controls typecheck and build**

Run: `npx tsc --noEmit`
Expected: no type errors. (If `Stat` `tone` rejects a value, use one the existing `@/components/ui` supports — check `src/components/ui` and adjust to an allowed tone.)

- [ ] **Step 5: Confirm the `input`/`btn` classes exist**

Run: `grep -nE "\.input|\.btn-primary|\.btn-ghost" src/app/globals.css | head`
Expected: matches exist (these utility classes are used elsewhere in the dashboard). If any are missing, swap for the closest existing class found in `globals.css`.

- [ ] **Step 6: Seed two test rows and eyeball the numbers**

Run:
```bash
npx tsx -e "import {db} from './src/lib/db'; (async()=>{ await db.u65Call.createMany({data:[{source:'ai_633',name:'Test Won',state:'TX',answer:'yes · private',transferSec:130,billable:true,billableCents:7500,isTest:true},{source:'direct_220',name:'Test Short',state:'CA',answer:'direct',transferSec:44,billable:false,isTest:true}]}); console.log('seeded'); process.exit(0); })()"
npm run dev
```
Then open `http://localhost:3000/dashboard/u65`. Expected: header shows Total 2, Over-121s 1, Billable $75.00 (1 × $75), Actually paid "—" (connect Ringba); table lists both rows with the U65 nav link highlighted in the left sidebar and in the reporting tab strip.

- [ ] **Step 7: Remove the test rows**

Run: `npx tsx -e "import {db} from './src/lib/db'; db.u65Call.deleteMany({where:{isTest:true}}).then(r=>{console.log('deleted',r.count);process.exit(0)})"`
Expected: `deleted 2`.

- [ ] **Step 8: Lint and commit**

Run: `npm run lint`
Expected: no new errors.

```bash
git add src/app/dashboard/u65/page.tsx src/components/u65/U65Controls.tsx src/components/dash/Nav.tsx
git commit -m "feat: /dashboard/u65 page + controls + nav (left nav + reporting tab)"
```

---

### Task 11: Env wiring, docs, and full verification

**Files:**
- Modify: `.env` (local, gitignored), `.env.example` (if present)
- Modify: `README.md` (a short U65 section) — optional but recommended

**Interfaces:**
- Consumes: everything above.
- Produces: documented setup + a green test suite.

- [ ] **Step 1: Add the Ringba token to local env (never committed)**

Confirm `.env` is gitignored:

Run: `git check-ignore .env && echo IGNORED`
Expected: prints `.env` then `IGNORED`. Add the line `RINGBA_API_TOKEN=<the rotated token>` to `.env`. If a `.env.example` exists, add `RINGBA_API_TOKEN=` (empty) there and commit only the example.

- [ ] **Step 2: Document the Twilio wiring (README U65 section)**

Add a short section stating:
- Point the **(346) 220‑3471** number's Voice webhook (A Call Comes In, HTTP POST) at `https://medigap.plus/api/u65/direct`.
- The AI line **1‑800‑633‑4427** already posts to `/api/calls/inbound`; the U65 branch is automatic once age <65 + state enabled + within hours.
- Ringba/BrokerCalls: grant the `MEDIGAP` API token read access to Campaigns + Call Logs, set `ringbaCampaignId` in the U65 config, and allowlist the medigap.plus server IP; then "Sync Ringba" lights up the paid column.

- [ ] **Step 3: Run the whole test suite**

Run: `npm test`
Expected: PASS — all `u65` and `ringba` tests green.

- [ ] **Step 4: Typecheck + lint the whole app**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit docs**

```bash
git add README.md .env.example 2>/dev/null; git commit -m "docs: U65 setup + Twilio/Ringba wiring notes" || echo "nothing to commit"
```

---

## Post-implementation (owner actions, outside this plan)

1. **BrokerCalls:** grant the `MEDIGAP` token read access to Campaigns + Call Logs (or ask the rep to enable API access); confirm the buyer's `ringbaCampaignId`.
2. **Allowlist** the medigap.plus server egress IP on the BrokerCalls token.
3. **Point** the 220‑3471 Twilio number at `/api/u65/direct`.
4. **Rotate** the Ringba API token (the one pasted in chat) and put the new value in server env.
5. **Live smoke test:** one call into each source; confirm a U65 row, the transfer‑leg seconds, and the billable flag; then "Sync Ringba" and confirm the paid column.
