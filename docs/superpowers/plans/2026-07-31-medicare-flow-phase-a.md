# Medicare Money-Word Voice Flow (Phase A) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add a bespoke branching "Medicare" voice flow to the Static call engine — hybrid intent detection (keyword + AI), gov/buy/plan handling with an upsell cascade, state→phone SMS-back, Educational-Program signup capture, three new sub-money-words — then flip Static live.

**Architecture:** Additive-only. A new `flowKey` column on `StaticMoneyWord` makes the step router hand a matched node to a custom-flow handler; the Medicare handler adds new `mcare_*` phases to the existing `src/app/api/voice/static-step/route.ts` phase-switch, reusing the engine's `gather`/`step`/`transfer` helpers and the existing `pickBuyerFor` SWRR routing. Pure decision logic (intent classify, yes/no, interrupts) lives in testable modules; spoken copy in a scripts module; the AI fallback uses the existing `aiReply()`.

**Tech Stack:** Next.js 16 App Router, Prisma (SQLite dev / Postgres prod), Twilio TwiML, Vitest, TypeScript.

## Global Constraints

- **Additive only.** Never alter/remove existing `StaticMoneyWord` rows/columns or the generic engine phases. New DB via additive column + new table.
- **Prod deploy is raw-SQL + guarded schema append + `prisma generate` — NEVER `prisma db push`** (the box has 145k-row `tv_audience` drift not in `schema.prisma`; `db push` would drop it).
- **Conversation state pattern is fixed:** phase (+extras) in the `<Gather action>` URL via `step(phase, callId, extra)`; durable facts on the `Call` row (`call.state`, `call.moneyWord`). No session store.
- **Never dead-air:** every gather keeps the `<Redirect>` safety net; every unresolved branch re-prompts once then falls back to a safe path.
- `call.state` holds a **2-letter uppercase code** (`normalizeState` output) or `""`. Phone tables key on that.
- SMS `From` for all Static texts = the 1-800-MEDIGAP main number; sends must never throw into the call flow.
- Scripts are the user's verbatim wording (spec §7). Money numbers: Reverse Mortgage + Retirement Planner default buyer **972-800-6670**. SS number **800-772-1213** (all states).
- Colocated `*.test.ts`, run via `npm test`. TDD for all pure logic.
- **Engine flip (`activeEngine="static"`) is the FINAL task, done only after deploy + a real verify call.**

**Existing signatures this plan consumes (verbatim):**
- `pickBuyerFor(leafId, { zip?, state?}, nowMs): Promise<{ number, buyerId, payoutCents, billableSeconds } | null>` (`src/lib/static/routing.ts`).
- `transfer(callId, number, voice, buyerId, amountCents, billSec): Promise<string>` — returns a `<Dial>` TwiML string (route-local in `static-step/route.ts`).
- `gather(action, voice, line): string`, `step(phase, callId, extra=""): string`, `xml(body): Response` (route-local).
- `matchSelection(speech, digit, nodes)`, `normalizeState(input): string`, `buildMenuPrompt(nodes)` (`src/lib/static/voice.ts`).
- `aiReply(messages: ChatMsg[], opts?): Promise<string|null>` where `ChatMsg = {role:"system"|"user"|"assistant"; content:string}` (`src/lib/voice.ts`).
- `sendSms({ to, body, leadId?, batch?, cfg? }): Promise<{ok:boolean; error?:string}>` (`src/lib/sms.ts`), `getTwilioCfg()` (`src/lib/sms.ts`), `normalizePhone` (`src/lib/sms.ts`).
- `getVoiceAgent(): Promise<{voice:string}>` (`src/lib/voice.ts`).

---

### Task 1: Data model — `flowKey` + `EducationalProgram`

**Files:** Modify `prisma/schema.prisma`; migrate dev DB.

**Interfaces:**
- Produces: `StaticMoneyWord.flowKey: string` (default `""`); `EducationalProgram` model with fields `{id, phone, state, name, source, enrolled, leadId?, createdAt}` and `@@map("educational_program")`.

- [ ] **Step 1: Add the column** to the `StaticMoneyWord` model block in `prisma/schema.prisma` (place after `slug`):
```prisma
  flowKey String @default("")   // non-empty => custom-flow dispatch (e.g. "medicare")
```

- [ ] **Step 2: Add the model** at the end of `prisma/schema.prisma`:
```prisma
// Free "notification service" signups captured by the Medicare PLAN path (Phase B builds the scheduler).
model EducationalProgram {
  id        String   @id @default(cuid())
  phone     String
  state     String   @default("")
  name      String   @default("")
  source    String   @default("")   // e.g. "medicare-plan"
  enrolled  Boolean  @default(true)  // false = declined the notification service but still captured
  leadId    String?
  createdAt DateTime @default(now())
  @@map("educational_program")
}
```

- [ ] **Step 3: Migrate the dev DB + regenerate client:**
```bash
npx prisma migrate dev --name medicare_flowkey_eduprogram
```
Expected: migration created + applied, client regenerated, no errors.

- [ ] **Step 4: Verify** the client typechecks the new surface:
```bash
npx tsc --noEmit 2>&1 | grep -E "flowKey|educationalProgram" | head
```
Expected: empty (no errors referencing the new fields).

- [ ] **Step 5: Commit**
```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(static): add StaticMoneyWord.flowKey + EducationalProgram model"
```

---

### Task 2: Spoken scripts module

**Files:** Create `src/lib/static/medicare-scripts.ts` + `src/lib/static/medicare-scripts.test.ts`.

**Interfaces:**
- Produces: named string constants `GREETING, GOV_CONFIRM, GOV_YES_ACK, LIFE_PITCH, PHI_PITCH, REVERSE_PITCH, RETIRE_PITCH, GOODBYE, PLAN_SS, WHAT_CONTEXT, CUSTOMER_SERVICE_CONTEXT`; function `transferScript(moneyWord: string): string`.

- [ ] **Step 1: Write the failing test** `src/lib/static/medicare-scripts.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { GREETING, PLAN_SS, WHAT_CONTEXT, transferScript } from "./medicare-scripts";

describe("medicare-scripts", () => {
  it("has the greeting asking buy/save/retire", () => {
    expect(GREETING.toLowerCase()).toContain("buy medicare insurance");
    expect(GREETING.toLowerCase()).toContain("retire");
  });
  it("plan script mentions the free notification service and Social Security", () => {
    expect(PLAN_SS.toLowerCase()).toContain("social security");
    expect(PLAN_SS.toLowerCase()).toContain("notification service");
  });
  it("what-context names MEDIGAP GPT", () => {
    expect(WHAT_CONTEXT).toContain("MEDIGAP GPT");
  });
  it("transferScript interpolates the money word twice", () => {
    const s = transferScript("Life Insurance");
    expect(s).toContain("transferring you to a Life Insurance professional");
    expect(s).toContain("who handles Life Insurance");
    expect(s).toContain("1-800-MEDIGAP");
  });
});
```

- [ ] **Step 2: Run → FAIL** — `npx vitest run src/lib/static/medicare-scripts.test.ts`.

- [ ] **Step 3: Implement** `src/lib/static/medicare-scripts.ts` (verbatim wording, TTS-punctuated):
```ts
export const GREETING =
  "Great. Are you looking to buy Medicare insurance? Are you on Medicare looking to save money on life insurance? Or are you just getting ready to retire? Let us know how we can help.";

export const GOV_CONFIRM =
  "We're 1-800-MEDIGAP, a free private service, and we'd be happy to help you save money or connect you with an insurance agent. But based on what you said, it sounds like you're looking for medicare dot gov. Would you like us to text you the appropriate number?";

export const GOV_YES_ACK = "Great, we'll text the appropriate number to you shortly. We have you.";

export const LIFE_PITCH =
  "Would you like to save money on life insurance? The actuarial tables have changed, allowing most of our clients to save 20 to 50 percent on their life insurance.";

export const PHI_PITCH =
  "Did you know there is a new Medigap plan that pays you directly for surprise expenses caused by an accident, cancer, stroke, heart attack, and critical illness? It lets you pay your light bill, lawn care, and life expenses when you need it most, for as low as 29 dollars a month in your age bracket. May I send you information on that as well?";

export const REVERSE_PITCH =
  "Do you have any interest in a reverse mortgage, allowing you to take out needed money to live life?";

export const RETIRE_PITCH =
  "Would you like help from a professional retirement planner to maximize your retirement?";

export const GOODBYE = "Thank you for calling 1-800-MEDIGAP. Goodbye.";

export const PLAN_SS =
  "1-800-MEDIGAP is America's trusted source. If you're looking to start Social Security, you're going to need many of our services in the future, like Medicare insurance, retirement planning, Medicare gap coverage, and more. Right now we think you should start with Social Security. We're happy to text you the appropriate phone number and enroll you in our free notification service, notifying you by text about important dates and opportunities to save time and money and not miss out on time-specific events. Just say yes, let me join, or no. Thanks again for calling 1-800-MEDIGAP.";

export const WHAT_CONTEXT =
  "1-800-MEDIGAP is America's first autonomous voice engine in training, also known as Multi-source Expert Data Intelligence Guidance And Precision — MEDIGAP GPT — and we're here to serve you as best we can as we grow. We may be going through periods where we don't have professionals already onboarded. Please listen to the following list and let us know how we can help.";

export const CUSTOMER_SERVICE_CONTEXT =
  "1-800-MEDIGAP is America's first autonomous voice engine in training, also known as Multi-source Expert Data Intelligence Guidance And Precision — MEDIGAP GPT — and we're here to serve you as best we can as we grow. We may be going through periods where we don't have professionals already onboarded. Please listen to the following list, pick from the list, and we'll transfer you to the customer service person best suited to your needs.";

export function transferScript(moneyWord: string): string {
  return `Great — transferring you to a ${moneyWord} professional now. Thank you for calling 1-800-MEDIGAP. We'll text you the information you need and connect you with a professional who handles ${moneyWord}.`;
}
```

- [ ] **Step 4: Run → PASS**; `npm test` green.
- [ ] **Step 5: Commit** — `git add src/lib/static/medicare-scripts.ts src/lib/static/medicare-scripts.test.ts && git commit -m "feat(static): Medicare spoken scripts module"`.

---

### Task 3: State→phone lookup tables

**Files:** Create `src/lib/static/statephones.ts` + `src/lib/static/statephones.test.ts`.

**Interfaces:**
- Produces: `medicarePhoneForState(code: string): string`, `ssPhoneForState(code: string): string`. Input = 2-letter uppercase code (or anything; non-matches → national fallback). Medicare fallback `1-800-633-4227`; SS always `800-772-1213`.

- [ ] **Step 1: Write the failing test** `src/lib/static/statephones.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { medicarePhoneForState, ssPhoneForState } from "./statephones";

describe("statephones", () => {
  it("returns the state Medicare office number by code", () => {
    expect(medicarePhoneForState("TX")).toBe("800-252-9240");
    expect(medicarePhoneForState("CA")).toBe("800-434-0222");
    expect(medicarePhoneForState("FL")).toBe("800-963-5337");
  });
  it("is case-insensitive and trims", () => {
    expect(medicarePhoneForState(" tx ")).toBe("800-252-9240");
  });
  it("falls back to national Medicare for unknown/empty", () => {
    expect(medicarePhoneForState("")).toBe("1-800-633-4227");
    expect(medicarePhoneForState("ZZ")).toBe("1-800-633-4227");
  });
  it("Social Security is the national line for every state", () => {
    expect(ssPhoneForState("TX")).toBe("800-772-1213");
    expect(ssPhoneForState("")).toBe("800-772-1213");
  });
});
```

- [ ] **Step 2: Run → FAIL**.

- [ ] **Step 3: Implement** `src/lib/static/statephones.ts`:
```ts
// State Medicare (SHIP/SHIBA) office numbers, keyed by 2-letter code (call.state format).
const MEDICARE_BY_CODE: Record<string, string> = {
  AL: "800-243-5463", AK: "800-478-6065", AZ: "800-432-4040", AR: "800-224-6330",
  CA: "800-434-0222", CO: "888-696-7213", CT: "800-994-9422", DE: "800-336-9500",
  FL: "800-963-5337", GA: "866-552-4464", HI: "888-875-9229", ID: "800-247-4422",
  IL: "800-252-8966", IN: "800-452-4800", IA: "800-351-4664", KS: "800-860-5260",
  KY: "877-293-7447", LA: "800-259-5300", ME: "800-262-2232", MD: "800-243-3425",
  MA: "800-243-4636", MI: "800-803-7174", MN: "800-333-2433", MS: "844-822-4622",
  MO: "800-390-3330", MT: "800-551-3191", NE: "800-234-7119", NV: "800-307-4444",
  NH: "866-634-9412", NJ: "800-792-8820", NM: "800-432-2080", NY: "800-701-0501",
  NC: "855-408-1212", ND: "888-575-6611", OH: "800-686-1578", OK: "800-763-2828",
  OR: "800-722-4134", PA: "800-783-7067", RI: "888-884-8721", SC: "800-868-9095",
  SD: "800-536-8197", TN: "877-801-0044", TX: "800-252-9240", UT: "800-541-7735",
  VT: "800-642-5119", VA: "800-552-3402", WA: "800-562-6900", WV: "877-987-4463",
  WI: "800-242-1060", WY: "800-856-4398", DC: "202-727-8370", PR: "877-725-4300",
  VI: "340-774-2991",
};
const MEDICARE_NATIONAL = "1-800-633-4227";
const SS_NATIONAL = "800-772-1213";

export function medicarePhoneForState(code: string): string {
  const c = (code || "").trim().toUpperCase();
  return MEDICARE_BY_CODE[c] || MEDICARE_NATIONAL;
}
export function ssPhoneForState(_code: string): string {
  return SS_NATIONAL; // uniform national line; per-state overrides can be added here later
}
```

- [ ] **Step 4: Run → PASS**; `npm test` green.
- [ ] **Step 5: Commit** — `git add src/lib/static/statephones.ts src/lib/static/statephones.test.ts && git commit -m "feat(static): Medicare + Social Security state phone lookup"`.

---

### Task 4: Pure decision logic — intent, yes/no, interrupts

**Files:** Create `src/lib/static/medicare.ts` + `src/lib/static/medicare.test.ts`.

**Interfaces:**
- Produces:
  - `classifyMedicareIntent(speech: string): "gov" | "buy" | "plan" | null` (pure keyword, priority-ordered).
  - `detectYesNo(speech: string, digit: string): "yes" | "no" | null`.
  - `medicareInterrupt(speech: string): "what" | "service" | null`.
  - `classifyMedicareIntentAI(speech: string, deps?: { aiReply?: typeof aiReply }): Promise<"gov" | "buy" | "plan" | null>` (AI fallback; injectable for tests).

- [ ] **Step 1: Write the failing test** `src/lib/static/medicare.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { classifyMedicareIntent, detectYesNo, medicareInterrupt, classifyMedicareIntentAI } from "./medicare";

describe("classifyMedicareIntent", () => {
  it("gov: card / bill phrasing", () => {
    expect(classifyMedicareIntent("I need to replace my Medicare card")).toBe("gov");
    expect(classifyMedicareIntent("I didn't get a bill paid")).toBe("gov");
  });
  it("buy: quote / advantage / drug", () => {
    expect(classifyMedicareIntent("I want a quote")).toBe("buy");
    expect(classifyMedicareIntent("how much insurance do I need")).toBe("buy");
    expect(classifyMedicareIntent("tell me about Medicare Advantage")).toBe("buy");
  });
  it("plan: retire / part b / social security beats generic insurance", () => {
    expect(classifyMedicareIntent("I'm ready to retire")).toBe("plan");
    expect(classifyMedicareIntent("how do I sign up for Part B")).toBe("plan");
    expect(classifyMedicareIntent("I need to start social security")).toBe("plan");
  });
  it("returns null on no keyword hit", () => {
    expect(classifyMedicareIntent("the weather is nice")).toBeNull();
    expect(classifyMedicareIntent("")).toBeNull();
  });
});

describe("detectYesNo", () => {
  it("yes words + DTMF 1", () => {
    expect(detectYesNo("yes please", "")).toBe("yes");
    expect(detectYesNo("let me join", "")).toBe("yes");
    expect(detectYesNo("", "1")).toBe("yes");
  });
  it("no words + DTMF 2", () => {
    expect(detectYesNo("no thanks", "")).toBe("no");
    expect(detectYesNo("", "2")).toBe("no");
  });
  it("null on unclear", () => {
    expect(detectYesNo("maybe later", "")).toBeNull();
  });
});

describe("medicareInterrupt", () => {
  it("detects 'what' with no other intent", () => {
    expect(medicareInterrupt("what?")).toBe("what");
    expect(medicareInterrupt("wait, what")).toBe("what");
  });
  it("detects customer service / rep", () => {
    expect(medicareInterrupt("I want customer service")).toBe("service");
    expect(medicareInterrupt("give me a representative")).toBe("service");
  });
  it("null on a normal intent utterance", () => {
    expect(medicareInterrupt("I want a quote")).toBeNull();
  });
});

describe("classifyMedicareIntentAI", () => {
  it("maps a clean AI answer to the intent", async () => {
    const aiReply = vi.fn().mockResolvedValue("gov");
    expect(await classifyMedicareIntentAI("my card is lost", { aiReply })).toBe("gov");
  });
  it("returns null when AI is unavailable or garbage", async () => {
    expect(await classifyMedicareIntentAI("x", { aiReply: vi.fn().mockResolvedValue(null) })).toBeNull();
    expect(await classifyMedicareIntentAI("x", { aiReply: vi.fn().mockResolvedValue("banana") })).toBeNull();
  });
});
```

- [ ] **Step 2: Run → FAIL**.

- [ ] **Step 3: Implement** `src/lib/static/medicare.ts`:
```ts
import { aiReply as realAiReply, type ChatMsg } from "@/lib/voice";

type Intent = "gov" | "buy" | "plan";

// Priority-ordered so specific plan/gov tokens beat generic "insurance".
const PLAN_KW = ["retire", "retiring", "ready to retire", "sign up", "signup", "enroll", "part a", "part b", "part d", "start medicare", "get on medicare", "social security", "how do i get"];
const GOV_KW = ["replace", "my card", "new card", "lost my card", "lost card", "didn't get", "did not get", "bill paid", "medicare.gov", "medicare dot gov", "government", "the office", "card"];
const BUY_KW = ["buy", "quote", "how much", "save money on insurance", "advantage", "medicare advantage", "drug", "drug coverage", "supplement", "medigap", "plan g", "plan n", "need insurance", "insurance quote"];

function hit(s: string, kws: string[]): boolean {
  return kws.some((k) => s.includes(k));
}

export function classifyMedicareIntent(speech: string): Intent | null {
  const s = (speech || "").toLowerCase().trim();
  if (!s) return null;
  if (hit(s, PLAN_KW)) return "plan";
  if (hit(s, GOV_KW)) return "gov";
  if (hit(s, BUY_KW)) return "buy";
  return null;
}

export function detectYesNo(speech: string, digit: string): "yes" | "no" | null {
  const d = (digit || "").trim();
  if (d === "1") return "yes";
  if (d === "2") return "no";
  const s = (speech || "").toLowerCase();
  if (/\b(yes|yeah|yep|sure|ok|okay|please|correct|let me join|join|i do|do it)\b/.test(s)) return "yes";
  if (/\b(no|nope|nah|don'?t|not interested|no thanks)\b/.test(s)) return "no";
  return null;
}

export function medicareInterrupt(speech: string): "what" | "service" | null {
  const s = (speech || "").toLowerCase().trim();
  if (!s) return null;
  if (/\b(customer service|representative|rep|agent|speak to someone|real person)\b/.test(s)) return "service";
  // "what" only when it's the gist (short), not embedded in a real intent
  if (/\bwhat\b/.test(s) && !classifyMedicareIntent(s)) return "what";
  return null;
}

const AI_SYSTEM =
  "You classify a Medicare caller's intent into exactly one word: gov, buy, or plan. " +
  "gov = they want the government Medicare office / medicare.gov (replace a card, a billing problem). " +
  "buy = they want to purchase or price insurance (a quote, Medicare Advantage, drug coverage, saving money on insurance). " +
  "plan = they are planning retirement or starting Social Security / signing up for Medicare Part A or B. " +
  "Reply with ONLY the single word gov, buy, or plan.";

export async function classifyMedicareIntentAI(
  speech: string,
  deps: { aiReply?: typeof realAiReply } = {},
): Promise<Intent | null> {
  const ai = deps.aiReply || realAiReply;
  const messages: ChatMsg[] = [
    { role: "system", content: AI_SYSTEM },
    { role: "user", content: (speech || "").slice(0, 300) },
  ];
  const out = await ai(messages, { maxTokens: 4, temperature: 0, purpose: "medicare-intent" });
  const w = (out || "").toLowerCase().replace(/[^a-z]/g, "");
  return w === "gov" || w === "buy" || w === "plan" ? (w as Intent) : null;
}
```

- [ ] **Step 4: Run → PASS**; `npm test` green.
- [ ] **Step 5: Commit** — `git add src/lib/static/medicare.ts src/lib/static/medicare.test.ts && git commit -m "feat(static): Medicare intent/yes-no/interrupt logic + AI fallback"`.

---

### Task 5: Static SMS-back helper

**Files:** Create `src/lib/static/sms.ts` + `src/lib/static/sms.test.ts`.

**Interfaces:**
- Produces: `sendStaticSms({ to, body, leadId? }: { to: string; body: string; leadId?: string | null }): Promise<{ ok: boolean }>` — forces From = 1-800-MEDIGAP main via `getTwilioCfg()` + `messagingSid:"" ` + the main tollFree number; never throws.

- [ ] **Step 1: Write the failing test** `src/lib/static/sms.test.ts` (mock the sms lib):
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const sendSms = vi.fn();
const getTwilioCfg = vi.fn().mockResolvedValue({ accountSid: "AC", authToken: "t", messagingSid: "MG", tollFree: "+18006334427" });
vi.mock("@/lib/sms", () => ({
  sendSms: (...a: any[]) => sendSms(...a),
  getTwilioCfg: () => getTwilioCfg(),
  normalizePhone: (s: string) => s,
}));

import { sendStaticSms } from "./sms";

describe("sendStaticSms", () => {
  beforeEach(() => sendSms.mockReset().mockResolvedValue({ ok: true }));
  it("sends with From forced to the main tollFree (no messagingSid)", async () => {
    const r = await sendStaticSms({ to: "+15551234567", body: "hi" });
    expect(r.ok).toBe(true);
    const arg = sendSms.mock.calls[0][0];
    expect(arg.to).toBe("+15551234567");
    expect(arg.body).toBe("hi");
    expect(arg.cfg.messagingSid).toBe("");
    expect(arg.cfg.tollFree).toBe("+18006334427");
  });
  it("never throws; returns ok:false on failure", async () => {
    sendSms.mockRejectedValueOnce(new Error("boom"));
    const r = await sendStaticSms({ to: "+15551234567", body: "hi" });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run → FAIL**.

- [ ] **Step 3: Implement** `src/lib/static/sms.ts`:
```ts
import { sendSms, getTwilioCfg } from "@/lib/sms";

// Send an SMS from the 1-800-MEDIGAP main number (so replies thread into the unified inbox).
// Never throws into the call flow.
export async function sendStaticSms({
  to,
  body,
  leadId,
}: {
  to: string;
  body: string;
  leadId?: string | null;
}): Promise<{ ok: boolean }> {
  try {
    const base = await getTwilioCfg();
    const cfg = { ...base, messagingSid: "", tollFree: base.tollFree || "+18006334427" };
    const r = await sendSms({ to, body, leadId: leadId ?? undefined, cfg });
    return { ok: !!r?.ok };
  } catch {
    return { ok: false };
  }
}
```

- [ ] **Step 4: Run → PASS**; `npm test` green.
- [ ] **Step 5: Commit** — `git add src/lib/static/sms.ts src/lib/static/sms.test.ts && git commit -m "feat(static): sendStaticSms helper (from 1-800-MEDIGAP, non-throwing)"`.

---

### Task 6: Medicare subtree seeder

**Files:** Create `src/lib/static/medicare-seed.ts` + `src/lib/static/medicare-seed.test.ts`; wire into `prisma/seed.ts`.

**Interfaces:**
- Consumes: a PrismaClient-like `db` with `staticMoneyWord.findFirst/create/update` and `staticBuyer.findFirst/create`.
- Produces: `ensureMedicareSubtree(db): Promise<void>` — idempotent upsert-by-slug of: **Medicare** (`slug:"medicare"`, `parentId:null`, `flowKey:"medicare"`), children **Medicare Insurance** (`medicare-insurance`), **Reverse Mortgage** (`reverse-mortgage`), **Retirement Planner** (`retirement-planner`); and a default `StaticBuyer` (number `972-800-6670`) for Reverse Mortgage + Retirement Planner if none exists.

- [ ] **Step 1: Write the failing test** `src/lib/static/medicare-seed.test.ts` (in-memory fake db):
```ts
import { describe, it, expect } from "vitest";
import { ensureMedicareSubtree } from "./medicare-seed";

function fakeDb() {
  const words: any[] = [];
  const buyers: any[] = [];
  let n = 0;
  return {
    _words: words, _buyers: buyers,
    staticMoneyWord: {
      findFirst: async ({ where }: any) => words.find((w) => w.slug === where.slug) || null,
      create: async ({ data }: any) => { const row = { id: `w${++n}`, ...data }; words.push(row); return row; },
      update: async ({ where, data }: any) => { const w = words.find((x) => x.id === where.id); Object.assign(w, data); return w; },
    },
    staticBuyer: {
      findFirst: async ({ where }: any) => buyers.find((b) => b.moneyWordId === where.moneyWordId) || null,
      create: async ({ data }: any) => { const row = { id: `b${++n}`, ...data }; buyers.push(row); return row; },
    },
  };
}

describe("ensureMedicareSubtree", () => {
  it("creates Medicare (flowKey) + 3 children + 972 buyers, and is idempotent", async () => {
    const db: any = fakeDb();
    await ensureMedicareSubtree(db);
    const medicare = db._words.find((w: any) => w.slug === "medicare");
    expect(medicare.flowKey).toBe("medicare");
    expect(medicare.parentId).toBeNull();
    const slugs = db._words.map((w: any) => w.slug).sort();
    expect(slugs).toEqual(["medicare", "medicare-insurance", "retirement-planner", "reverse-mortgage"]);
    const rm = db._words.find((w: any) => w.slug === "reverse-mortgage");
    const rp = db._words.find((w: any) => w.slug === "retirement-planner");
    expect(db._buyers.find((b: any) => b.moneyWordId === rm.id).defaultNumber).toBe("972-800-6670");
    expect(db._buyers.find((b: any) => b.moneyWordId === rp.id).defaultNumber).toBe("972-800-6670");
    const wordCount = db._words.length, buyerCount = db._buyers.length;
    await ensureMedicareSubtree(db); // second run: no duplicates
    expect(db._words.length).toBe(wordCount);
    expect(db._buyers.length).toBe(buyerCount);
  });
});
```

- [ ] **Step 2: Run → FAIL**.

- [ ] **Step 3: Implement** `src/lib/static/medicare-seed.ts`:
```ts
type AnyDb = any;

async function upsertWord(db: AnyDb, slug: string, data: Record<string, unknown>) {
  const existing = await db.staticMoneyWord.findFirst({ where: { slug } });
  if (existing) {
    // keep it current on flowKey/parent without disturbing user edits to value/states/prompts
    await db.staticMoneyWord.update({ where: { id: existing.id }, data: { flowKey: data.flowKey ?? existing.flowKey } });
    return existing;
  }
  return db.staticMoneyWord.create({ data: { slug, ...data } });
}

async function ensureBuyer(db: AnyDb, moneyWordId: string, name: string, number: string) {
  const existing = await db.staticBuyer.findFirst({ where: { moneyWordId } });
  if (existing) return existing;
  return db.staticBuyer.create({
    data: { moneyWordId, name, defaultNumber: number, active: true, dailyCap: 0, priorityWeight: 1, payoutCents: 0, states: "[]", billableSeconds: 0 },
  });
}

// Idempotent: add the Medicare custom-flow subtree without disturbing the rest of the tree.
export async function ensureMedicareSubtree(db: AnyDb): Promise<void> {
  const medicare = await upsertWord(db, "medicare", {
    word: "Medicare", parentId: null, flowKey: "medicare", active: true, sortOrder: 100,
    valueCents: 0, states: "[]", ageRule: "{}",
  });
  const insurance = await upsertWord(db, "medicare-insurance", {
    word: "Medicare Insurance", parentId: medicare.id, flowKey: "", active: true, sortOrder: 1,
    valueCents: 0, states: "[]", ageRule: "{}",
  });
  const reverse = await upsertWord(db, "reverse-mortgage", {
    word: "Reverse Mortgage", parentId: medicare.id, flowKey: "", active: true, sortOrder: 2,
    valueCents: 0, states: "[]", ageRule: "{}",
  });
  const retire = await upsertWord(db, "retirement-planner", {
    word: "Retirement Planner", parentId: medicare.id, flowKey: "", active: true, sortOrder: 3,
    valueCents: 0, states: "[]", ageRule: "{}",
  });
  void insurance;
  await ensureBuyer(db, reverse.id, "Reverse Mortgage Desk", "972-800-6670");
  await ensureBuyer(db, retire.id, "Retirement Planner Desk", "972-800-6670");
}
```
> **Implementer note:** confirm the real `StaticMoneyWord`/`StaticBuyer` required columns in `prisma/schema.prisma` and include any that lack a default in the `create` data (the fake db ignores extras; the real create will reject a missing required column). Match the field names exactly.

- [ ] **Step 4: Wire into `prisma/seed.ts`** — after the existing `seedStaticMoneyWords()` call, add:
```ts
import { ensureMedicareSubtree } from "../src/lib/static/medicare-seed";
// ...inside the seed main(), after seedStaticMoneyWords():
await ensureMedicareSubtree(prisma);
```
(Match the file's existing import style and the actual PrismaClient variable name.)

- [ ] **Step 5: Run → PASS**; `npm test` green.
- [ ] **Step 6: Commit** — `git add src/lib/static/medicare-seed.ts src/lib/static/medicare-seed.test.ts prisma/seed.ts && git commit -m "feat(static): idempotent Medicare subtree seeder (flowKey + 972 buyers)"`.

---

### Task 7: Wire the Medicare phases into the call engine

**Files:** Modify `src/app/api/voice/static-step/route.ts`.

**Interfaces:**
- Consumes: everything from Tasks 2–5 + existing route helpers (`gather`, `step`, `xml`, `transfer`, `logTurn`, `topMenu`, `pickBuyerFor`, `buildMenuPrompt`, `nodeById`).
- Produces: new phases `mcare_intent`, `mcare_buy`, `mcare_gov_confirm`, `mcare_gov_life`, `mcare_gov_phi`, `mcare_gov_reverse`, `mcare_gov_retire`, `mcare_plan`; flowKey dispatch from `menu`/`submenu`.

This task has no separate unit test (it's TwiML wiring over already-tested pure logic); verification is `npx tsc --noEmit` clean + `npm test` still green + the Task 8 build. Keep each added block small and mirror the existing phase style.

- [ ] **Step 1: Add imports** at the top of `static-step/route.ts`:
```ts
import { classifyMedicareIntent, classifyMedicareIntentAI, detectYesNo, medicareInterrupt } from "@/lib/static/medicare";
import * as MС from "@/lib/static/medicare-scripts";
import { medicarePhoneForState, ssPhoneForState } from "@/lib/static/statephones";
import { sendStaticSms } from "@/lib/static/sms";
```
> Use a plain ASCII alias, e.g. `import * as SCRIPT from "@/lib/static/medicare-scripts";` (avoid non-ASCII identifiers). Below, `SCRIPT.GREETING` etc.

- [ ] **Step 2: flowKey dispatch.** In the `menu` phase, immediately after `const hitId = matchSelection(...)` resolves non-null AND before the `hasActiveBuyers` check, add:
```ts
    const hitNode = await nodeById(hitId);
    if (hitNode?.flowKey === "medicare") {
      await db.call.update({ where: { id: callId }, data: { moneyWord: hitId } }).catch(() => {});
      await logTurn(callId, "bot", SCRIPT.GREETING);
      return xml(gather(step("mcare_intent", callId), voice, SCRIPT.GREETING));
    }
```
Add the identical guard in the `submenu` phase after its `matchSelection` (so a Medicare node nested as a child also dispatches). Do not remove any existing logic.

- [ ] **Step 3: Add a shared helper** near the other route-local helpers for the menu repeat used by interrupts:
```ts
async function medicareMenuLine(): Promise<string> {
  const menu = await topMenu();
  return buildMenuPrompt(menu);
}
// Re-speak a Medicare prompt after a "what"/"customer service" interrupt.
async function medicareInterruptReply(callId: string, voice: string, phase: string, kind: "what" | "service", prompt: string): Promise<Response> {
  const ctx = kind === "what" ? SCRIPT.WHAT_CONTEXT : SCRIPT.CUSTOMER_SERVICE_CONTEXT;
  const line = `${ctx} ${await medicareMenuLine()} ${prompt}`;
  await logTurn(callId, "bot", line);
  return xml(gather(step(phase, callId), voice, line));
}
```

- [ ] **Step 4: Add the Medicare phase blocks** (place after the `offer` phase block, before the final `return xml(... Goodbye ...)`). Full code:
```ts
  // ---- Medicare: intent detection (hybrid keyword + AI) ----
  if (phase === "mcare_intent") {
    const intr = medicareInterrupt(speech);
    if (intr) return medicareInterruptReply(callId, voice, "mcare_intent", intr, SCRIPT.GREETING);
    let intent = classifyMedicareIntent(speech);
    if (!intent && speech) intent = await classifyMedicareIntentAI(speech);
    if (!intent) {
      const line = `I can help with three things. ${SCRIPT.GREETING}`;
      await logTurn(callId, "bot", line);
      return xml(gather(step("mcare_intent", callId), voice, line));
    }
    if (intent === "buy") return medicareRouteBySlug(callId, "medicare-insurance", voice, call, "Medicare Insurance");
    if (intent === "plan") {
      await logTurn(callId, "bot", SCRIPT.PLAN_SS);
      return xml(gather(step("mcare_plan", callId), voice, SCRIPT.PLAN_SS));
    }
    // gov
    await logTurn(callId, "bot", SCRIPT.GOV_CONFIRM);
    return xml(gather(step("mcare_gov_confirm", callId), voice, SCRIPT.GOV_CONFIRM));
  }

  // ---- Medicare: GOV confirm → text the state Medicare number, then upsell cascade ----
  if (phase === "mcare_gov_confirm") {
    const yn = detectYesNo(speech, digit);
    if (yn === "no") { await logTurn(callId, "bot", SCRIPT.GOODBYE); return xml(`<Say voice="${voice}">${esc(SCRIPT.GOODBYE)}</Say><Hangup/>`); }
    if (yn !== "yes") { await logTurn(callId, "bot", SCRIPT.GOV_CONFIRM); return xml(gather(step("mcare_gov_confirm", callId), voice, SCRIPT.GOV_CONFIRM)); }
    // yes → send the state Medicare office number now
    const num = medicarePhoneForState(call.state || "");
    await sendStaticSms({ to: call.fromNumber || "", body: `Thank you for calling 1-800-MEDIGAP. Here is the number you requested: ${num}`, leadId: call.leadId });
    const line = `${SCRIPT.GOV_YES_ACK} ${SCRIPT.LIFE_PITCH}`;
    await logTurn(callId, "bot", line);
    return xml(gather(step("mcare_gov_life", callId), voice, line));
  }

  // ---- Medicare: upsell 1 — Life Insurance ----
  if (phase === "mcare_gov_life") {
    const yn = detectYesNo(speech, digit);
    if (yn === "yes") return medicareRouteBySlug(callId, "life-insurance", voice, call, "Life Insurance");
    const line = yn === "no" ? SCRIPT.PHI_PITCH : SCRIPT.LIFE_PITCH;
    await logTurn(callId, "bot", line);
    return xml(gather(step(yn === "no" ? "mcare_gov_phi" : "mcare_gov_life", callId), voice, line));
  }

  // ---- Medicare: upsell 2 — Private Health Insurance ----
  if (phase === "mcare_gov_phi") {
    const yn = detectYesNo(speech, digit);
    if (yn === "yes") return medicareRouteBySlug(callId, "private-health-insurance", voice, call, "Private Health Insurance");
    const line = yn === "no" ? SCRIPT.REVERSE_PITCH : SCRIPT.PHI_PITCH;
    await logTurn(callId, "bot", line);
    return xml(gather(step(yn === "no" ? "mcare_gov_reverse" : "mcare_gov_phi", callId), voice, line));
  }

  // ---- Medicare: upsell 3 — Reverse Mortgage ----
  if (phase === "mcare_gov_reverse") {
    const yn = detectYesNo(speech, digit);
    if (yn === "yes") return medicareRouteBySlug(callId, "reverse-mortgage", voice, call, "Reverse Mortgage");
    const line = yn === "no" ? SCRIPT.RETIRE_PITCH : SCRIPT.REVERSE_PITCH;
    await logTurn(callId, "bot", line);
    return xml(gather(step(yn === "no" ? "mcare_gov_retire" : "mcare_gov_reverse", callId), voice, line));
  }

  // ---- Medicare: upsell 4 — Retirement Planner ----
  if (phase === "mcare_gov_retire") {
    const yn = detectYesNo(speech, digit);
    if (yn === "yes") return medicareRouteBySlug(callId, "retirement-planner", voice, call, "Retirement Planner");
    await logTurn(callId, "bot", SCRIPT.GOODBYE);
    return xml(`<Say voice="${voice}">${esc(SCRIPT.GOODBYE)}</Say><Hangup/>`);
  }

  // ---- Medicare: PLAN — Social Security + Educational Program enroll ----
  if (phase === "mcare_plan") {
    const yn = detectYesNo(speech, digit);
    const enrolled = yn === "yes";
    await db.educationalProgram.create({ data: { phone: call.fromNumber || "", state: call.state || "", source: "medicare-plan", enrolled, leadId: call.leadId } }).catch(() => {});
    const ss = ssPhoneForState(call.state || "");
    const body = enrolled
      ? `Thanks for calling 1-800-MEDIGAP. Here is the Social Security number you requested: ${ss}. You're enrolled in our free notification service — we'll text you timely reminders.`
      : `Thanks for calling 1-800-MEDIGAP. Here is the Social Security number you requested: ${ss}.`;
    await sendStaticSms({ to: call.fromNumber || "", body, leadId: call.leadId });
    const line = `Here is the number for Social Security: ${ss}. ${SCRIPT.GOODBYE}`;
    await logTurn(callId, "bot", line);
    return xml(`<Say voice="${voice}">${esc(line)}</Say><Hangup/>`);
  }
```

- [ ] **Step 5: Add the `medicareRouteBySlug` helper** near `routeLeaf` (speaks the transfer script, then routes by slug; reuses the no-buyer fallback):
```ts
// Speak the transfer script for a target money word (by slug) then route to its buyer, or fall back.
async function medicareRouteBySlug(callId: string, slug: string, voice: string, call: any, label: string) {
  const node = await db.staticMoneyWord.findFirst({ where: { slug } });
  if (!node) {
    await logTurn(callId, "bot", SCRIPT.GOODBYE);
    return xml(`<Say voice="${voice}">${esc(SCRIPT.GOODBYE)}</Say><Hangup/>`);
  }
  const res = await pickBuyerFor(node.id, { zip: call.zip || undefined, state: call.state || undefined }, Date.now());
  if (!res) {
    await captureCallback({ moneyWordId: node.id, word: node.word, state: call.state || "", zip: call.zip || "", phone: call.fromNumber || "", note: "medicare route: no buyer" });
    await db.call.update({ where: { id: callId }, data: { disposition: "static-nobuyer", moneyWord: node.word } }).catch(() => {});
    const line = `We don't have a ${label} professional available right now, but we have you and will follow up. ${SCRIPT.GOODBYE}`;
    await logTurn(callId, "bot", line);
    return xml(`<Say voice="${voice}">${esc(line)}</Say><Hangup/>`);
  }
  const revenueCents = res.payoutCents > 0 ? res.payoutCents : (node.valueCents || 0);
  await db.call.update({ where: { id: callId }, data: { moneyWord: node.word, disposition: "static" } }).catch(() => {});
  const say = `<Say voice="${voice}">${esc(SCRIPT.transferScript(label))}</Say>`;
  return xml(say + (await transfer(callId, res.number, voice, res.buyerId, revenueCents, res.billableSeconds)));
}
```

- [ ] **Step 6: Verify** — `npx tsc --noEmit 2>&1 | grep static-step` → empty; `npm test` → all green.
- [ ] **Step 7: Commit** — `git add src/app/api/voice/static-step/route.ts && git commit -m "feat(static): wire Medicare branching flow (intent/gov-upsell/plan) into the call engine"`.

---

### Task 8: Full test + isolated build + additive deploy (NO engine flip yet)

**Files:** none (ops task). Controller-run.

- [ ] **Step 1:** `npm test` — all green.
- [ ] **Step 2:** Isolated build (git worktree + CoW `node_modules`): `git worktree add --detach $WT HEAD && cp -Rc node_modules $WT/ && cd $WT && npm run build` → exit 0; `/api/voice/static-step` compiles.
- [ ] **Step 3: Deploy additively to the box** (137.220.56.129, pm2 `medigap`):
  - rsync the new/changed files: `src/lib/static/{medicare-scripts,statephones,medicare,sms,medicare-seed}.ts`, `src/app/api/voice/static-step/route.ts`, `prisma/seed.ts`.
  - **Add the column (raw SQL, idempotent):** `ALTER TABLE "StaticMoneyWord" ADD COLUMN IF NOT EXISTS "flowKey" TEXT NOT NULL DEFAULT '';` (confirm the real table name from the box schema `@@map`, likely `StaticMoneyWord`).
  - **Create the table (raw SQL, idempotent):** `CREATE TABLE IF NOT EXISTS "educational_program" ("id" TEXT PRIMARY KEY, "phone" TEXT NOT NULL, "state" TEXT NOT NULL DEFAULT '', "name" TEXT NOT NULL DEFAULT '', "source" TEXT NOT NULL DEFAULT '', "enrolled" BOOLEAN NOT NULL DEFAULT true, "leadId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`
  - **Append models to the box `schema.prisma`** guarded (add `flowKey` to the StaticMoneyWord block only if absent; append the `EducationalProgram` block only if `educational_program` absent), then `npx prisma generate` (NOT db push).
  - **Seed the subtree on the box** via a bare-PrismaClient tsx script calling `ensureMedicareSubtree(prisma)` (NOT full `db:seed`, which would reset the god password).
  - `npm run build` on the box (build-before-restart), then `pm2 restart medigap`.
- [ ] **Step 4: Verify (no flip yet):** homepage 200; `/dashboard/static` still 307 (god-gated); Medicare tab + 3 children visible in the dashboard; existing routes unregressed (`/rocketship/order` 200, `/dashboard/u65` 307). Engine still `fluid` (live calls unchanged).
- [ ] **Step 5:** Record progress in the ledger.

---

### Task 9: Go-live — flip Static to default + fix the stale toggle label

**Files:** Modify `src/components/static/EngineToggle.tsx` (label only). Box Setting change.

- [ ] **Step 1: Real verify call first.** With the box updated (Task 8) but engine still `fluid`, temporarily confirm the Medicare flow is reachable (either a staging toggle or a guarded test), walking gov / buy / plan; confirm the two SMS templates arrive and an `educational_program` row is written. (If a live test requires the flip, do Step 3 first and test immediately, ready to flip back.)
- [ ] **Step 2: Fix the stale label** in `EngineToggle.tsx` — replace `"(Phase 1: dashboard only — live calls stay on Fluid)"` with `"(controls live call routing)"`. Commit.
- [ ] **Step 3: Flip the engine on the box:** set `Setting activeEngine="static"` (via the god EngineToggle UI, or a one-off upsert: `db.setting.upsert({ where:{key:"activeEngine"}, update:{value:"static"}, create:{key:"activeEngine", value:"static"} })`).
- [ ] **Step 4: Verify live:** place a real inbound call → confirm the Static greeting answers, and a "Medicare" answer enters the new flow. Confirm non-Medicare menu paths still route. Watch the first calls' `Call` rows + any outbound `SmsMessage` rows.
- [ ] **Step 5:** Report to the user that Static is now the live default and the Medicare flow is handling Medicare callers; note the post-flip watch.

---

## Self-Review

**Spec coverage:** greeting + hybrid intent (T4/T7), gov confirm + state-Medicare SMS + 4-step upsell cascade + reuse Life/PHI by slug + new Reverse/Retire nodes with 972 buyers (T6/T7), buy→Medicare Insurance (T7), plan→SS + Educational Program capture + SS SMS (T1/T7), transfer script before every dial (T2/T7), what/customer-service interrupts (T4/T7), state phone tables both (T3), SMS-back from 1-800-MEDIGAP (T5), flowKey dispatch (T1/T7), additive deploy protecting box drift (T8), engine flip last (T9), stale-label fix (T9). All spec sections map to a task.

**Placeholder scan:** none — every code step carries full code. The two implementer notes (confirm real required columns in T6; box table name in T8) are verification instructions, not placeholders.

**Type consistency:** `classifyMedicareIntent`/`classifyMedicareIntentAI` return `"gov"|"buy"|"plan"|null` (T4) and are consumed as such (T7). `detectYesNo` → `"yes"|"no"|null` (T4/T7). `sendStaticSms({to,body,leadId?})` (T5) called with those args (T7). `pickBuyerFor` result `{number,buyerId,payoutCents,billableSeconds}` used identically to the existing `routeLeaf` (T7). `ensureMedicareSubtree(db)` (T6) used in seed + box seed (T6/T8). `transferScript(word)` (T2) used in `medicareRouteBySlug` (T7).

**Deferred (Phase B, not in this plan):** the 🚀 Notification Service page, event calendar/add-to-calendar, recurring scheduled text+email sends, responses→unified inbox/bell. Phase A only writes `EducationalProgram` rows.
