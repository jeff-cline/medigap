# Unified Consumer Comms + Canned Answers + Shortener — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** A God/staff `/dashboard/unified` page (linked from the notifications "texts to respond" count and the left nav) showing inbound consumer texts across ALL our numbers; keyword→canned-answer automation (auto-reply on match, "need human response" flag on no-match); manage canned answers; and an el.ag link shortener for building replies.

**Architecture:** Capture the receiving number on inbound SMS (into `SmsMessage.fromLabel`, no schema change). New `CannedResponse` table + seed. Inbound handler auto-replies on a canned-keyword match (from the number the consumer texted) and marks the text handled; no match leaves it unread ("needs human"). New `src/lib/comms.ts` (threads + canned + reply), `src/lib/shorten.ts` (configurable el.ag), staff-gated `/api/comms/*` + `/api/shorten`, a `/dashboard/unified` page, and a "Unified" nav entry.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma/SQLite dev + Postgres prod, Twilio, Vitest.

## Global Constraints

- Reuse existing: `SmsMessage` (to=sender for inbound, body, direction, leadId, readAt, fromLabel, status, createdAt), `sendSms` (`@/lib/sms`), `getTwilioCfg`, `normalizePhone`. The JV `/unified` page + `sms/inbound` STOP/START + JV auto-reply logic must stay intact — only ADD the consumer canned automation.
- **Receiving number**: on inbound, store Twilio form `To` (our number, E.164) into `SmsMessage.fromLabel` (empty today for inbound). The unified page groups/filters by it.
- **"Needs human response"** = `SmsMessage` `direction:"inbound"` AND `readAt:null`. A canned auto-reply OR a human reply sets `readAt` (= handled). (The notifications "texts to respond" count already = inbound + readAt null, so this stays consistent.)
- **Canned match**: case-insensitive; a canned answer matches if ANY of its `keywords` appears as a whole-word/substring in the inbound body. First active match (by `sortOrder`, then createdAt) wins → auto-send its `reply` → mark the inbound handled + log a `LeadNote` if there's a lead. No match → leave unread.
- **Reply from the same number** the consumer texted: send with `From = that number` (pass `cfg` with `messagingSid:""` + `tollFree:<that number>` so Twilio uses it, not the pooled sender).
- **el.ag shortener** is configurable via Integration key `"elag"` config JSON `{ endpoint, apiKey?, urlField?, method? }` (defaults: `endpoint:"https://el.ag/short"`, `urlField:"url"`, `method:"POST"`, Bearer `apiKey` if present). `shortenUrl(long)` returns the short link, or the original long URL on any failure/unconfigured (never throws).
- Staff-gate all `/api/comms/*` + `/api/shorten` (role ∈ `["god","marketing","accounting","assistant"]`). The page is staff-only.
- Prisma sqlite dev; JSON as String; extended `db`. Tests colocated; `npm test`. Canned-match logic is pure + TDD.

## File Structure

- `prisma/schema.prisma` — **modify (isolated)**: add `CannedResponse` model.
- `src/lib/canned.ts` — **create**: pure `matchCanned(body, canneds)` + types (+ test).
- `src/lib/canned-seed.ts` — **create**: `CANNED_SEED` + `seedCanned(prisma)` idempotent; wired into `prisma/seed.ts`.
- `src/lib/comms.ts` — **create**: `unifiedThreads()`, `cannedList/create/update/delete`, `markHandled(id)`, `sendReply(...)` (+ test for threads/markHandled).
- `src/lib/shorten.ts` — **create**: `shortenUrl(long)` (configurable el.ag) (+ test for fallback).
- `src/app/api/sms/inbound/route.ts` — **modify**: capture `To`→fromLabel; canned auto-reply on match.
- `src/app/api/comms/reply/route.ts`, `.../handle/route.ts`, `.../canned/route.ts` — **create**: staff-gated.
- `src/app/api/shorten/route.ts` — **create**: staff-gated.
- `src/app/dashboard/unified/page.tsx` — **create**: server page.
- `src/components/comms/UnifiedComms.tsx` — **create**: client (threads + reply box + canned picker + shorten + canned mgmt).
- `src/components/dash/Nav.tsx` — **modify**: add `["Unified", "/dashboard/unified", "💬"]`.
- `src/components/dash/Notifications.tsx` — **modify**: make "Texts to respond" link to `/dashboard/unified`.

---

### Task 1: `CannedResponse` model + seed

**Files:** Modify `prisma/schema.prisma`; create `src/lib/canned-seed.ts`; modify `prisma/seed.ts`.

- [ ] **Step 1:** Append to `prisma/schema.prisma`:
```prisma
// Keyword-triggered canned SMS answers for the unified consumer inbox.
model CannedResponse {
  id        String   @id @default(cuid())
  label     String   @default("")
  keywords  String   @default("[]") // JSON lowercase string[]; any match triggers
  reply     String   @default("")
  active    Boolean  @default(true)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  @@map("canned_response")
}
```
- [ ] **Step 2:** `npm run db:push`; verify with a throwaway probe (create/read/delete a CannedResponse; print ok).
- [ ] **Step 3:** Create `src/lib/canned-seed.ts`:
```ts
export const CANNED_SEED: { label: string; keywords: string[]; reply: string; sortOrder: number }[] = [
  { label: "Callback request", keywords: ["call me", "please call", "give me a call", "call back"], reply: "Thanks! A licensed Medigap specialist will call you shortly. You can also reach us at 1-800-MEDIGAP (1-800-633-4427).", sortOrder: 1 },
  { label: "Flex/food card", keywords: ["food card", "spending card", "flex card", "grocery"], reply: "For help with your benefits card, a specialist will reach out. Reply with your name and ZIP so we can pull up your plan.", sortOrder: 2 },
  { label: "Agent handoff", keywords: ["agent", "human", "representative", "someone", "talk to"], reply: "You've got it — a real specialist will contact you right away. If it's urgent, call 1-800-633-4427.", sortOrder: 3 },
  { label: "STOP already handled", keywords: [], reply: "", sortOrder: 99 },
];
export async function seedCanned(prisma: { cannedResponse: any }): Promise<void> {
  const n = await prisma.cannedResponse.count();
  if (n > 0) return;
  for (const c of CANNED_SEED.filter((x) => x.keywords.length)) {
    await prisma.cannedResponse.create({ data: { label: c.label, keywords: JSON.stringify(c.keywords.map((k) => k.toLowerCase())), reply: c.reply, sortOrder: c.sortOrder } });
  }
}
```
Wire into `prisma/seed.ts`: `import { seedCanned } from "../src/lib/canned-seed";` and `await seedCanned(db);`.
- [ ] **Step 4:** `npm run db:seed` (idempotent), confirm 3 canned rows. `npm test` green.
- [ ] **Step 5:** Commit `feat(comms): CannedResponse model + seed`.
> Controller: isolate-stage the schema hunk (Pd WIP uncommitted); prisma/seed.ts is clean.

---

### Task 2: Pure canned matcher (`src/lib/canned.ts`)

**Files:** Create `src/lib/canned.ts` + `src/lib/canned.test.ts`.

**Interfaces:**
- `type Canned = { id: string; keywords: string; reply: string; active: boolean; sortOrder: number }`
- `matchCanned(body: string, canneds: Canned[]): Canned | null` — lowercase the body; consider only `active`; sort by `sortOrder` asc then stable; return the first whose parsed `keywords` array has a member contained in the body; else null.

- [ ] **Step 1: Failing test** — `src/lib/canned.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { matchCanned, type Canned } from "./canned";
const C = (id: string, kws: string[], sortOrder = 0, active = true): Canned => ({ id, keywords: JSON.stringify(kws), reply: id, active, sortOrder });
describe("matchCanned", () => {
  const list = [C("agent", ["agent", "human"], 3), C("call", ["please call", "call me"], 1)];
  it("matches a keyword substring, case-insensitive", () => {
    expect(matchCanned("Can you PLEASE CALL me back", list)?.id).toBe("call");
    expect(matchCanned("I want to talk to an Agent", list)?.id).toBe("agent");
  });
  it("respects sortOrder when multiple match (lowest wins)", () => {
    expect(matchCanned("please call an agent", list)?.id).toBe("call"); // sortOrder 1 < 3
  });
  it("skips inactive and returns null on no match", () => {
    expect(matchCanned("agent", [C("agent", ["agent"], 1, false)])).toBeNull();
    expect(matchCanned("random text", list)).toBeNull();
  });
  it("ignores empty-keyword canneds", () => {
    expect(matchCanned("anything", [C("empty", [], 0)])).toBeNull();
  });
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `src/lib/canned.ts`:**
```ts
export type Canned = { id: string; keywords: string; reply: string; active: boolean; sortOrder: number };

export function matchCanned(body: string, canneds: Canned[]): Canned | null {
  const b = (body || "").toLowerCase();
  const active = canneds.filter((c) => c.active).sort((a, z) => a.sortOrder - z.sortOrder);
  for (const c of active) {
    let kws: string[]; try { kws = JSON.parse(c.keywords || "[]"); } catch { kws = []; }
    if (!Array.isArray(kws)) kws = [];
    if (kws.some((k) => k && b.includes(String(k).toLowerCase()))) return c;
  }
  return null;
}
```
- [ ] **Step 4: Run → PASS**; `npm test` green.
- [ ] **Step 5: Commit** `feat(comms): pure canned-answer matcher`.

---

### Task 3: el.ag shortener (`src/lib/shorten.ts`)

**Files:** Create `src/lib/shorten.ts` + `src/lib/shorten.test.ts`.

**Interfaces:** `shortenUrl(long: string): Promise<string>` — never throws; returns the short link on success, else the original `long`.

- [ ] **Step 1:** Implement `src/lib/shorten.ts`:
```ts
import { db } from "@/lib/db";

type ElagCfg = { endpoint?: string; apiKey?: string; urlField?: string; method?: string; respField?: string };

async function elagCfg(): Promise<ElagCfg> {
  const row = await db.integration.findUnique({ where: { key: "elag" } }).catch(() => null);
  try { return row ? JSON.parse(row.config) : {}; } catch { return {}; }
}

// Shorten via el.ag; falls back to the original URL on any failure or if unconfigured.
export async function shortenUrl(long: string): Promise<string> {
  const url = (long || "").trim();
  if (!/^https?:\/\//i.test(url)) return long;
  const cfg = await elagCfg();
  const endpoint = cfg.endpoint || "https://el.ag/short";
  const urlField = cfg.urlField || "url";
  const respField = cfg.respField || ""; // "" = auto-detect
  try {
    const res = await fetch(endpoint, {
      method: cfg.method || "POST",
      headers: { "Content-Type": "application/json", ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}) },
      body: JSON.stringify({ [urlField]: url }),
    });
    if (!res.ok) return long;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json();
      const cand = respField ? j?.[respField] : (j?.short || j?.shortUrl || j?.url || j?.link || j?.result);
      return typeof cand === "string" && /^https?:\/\//i.test(cand) ? cand : long;
    }
    const text = (await res.text()).trim();
    return /^https?:\/\//i.test(text) ? text : long;
  } catch { return long; }
}
```
- [ ] **Step 2:** `src/lib/shorten.test.ts` — a non-URL input returns itself unchanged (`await shortenUrl("not a url")` === "not a url"); and (unconfigured/dev, fetch to el.ag will fail/return non-2xx) `await shortenUrl("https://example.com/x")` returns the original URL (fallback). (Deterministic without network mocking: assert it returns a string and, for a bad input, the identity.)
```ts
import { describe, it, expect } from "vitest";
import { shortenUrl } from "./shorten";
describe("shortenUrl", () => {
  it("returns non-URL input unchanged", async () => { expect(await shortenUrl("hello world")).toBe("hello world"); });
  it("never throws and returns a string for a URL", async () => { const r = await shortenUrl("https://example.com/abc"); expect(typeof r).toBe("string"); });
});
```
- [ ] **Step 3:** `npx vitest run src/lib/shorten.test.ts` + `npm test` green.
- [ ] **Step 4: Commit** `feat(comms): configurable el.ag URL shortener (fallback-safe)`.

---

### Task 4: Inbound auto-reply + receiving-number capture

**Files:** Modify `src/app/api/sms/inbound/route.ts`.

- [ ] **Step 1:** Capture the receiving number: read `const to = String(form?.get("To") || "");` and set it as `fromLabel` on the inbound insert:
```ts
  await db.smsMessage.create({ data: { to: e164, body, direction: "inbound", status: "received", leadId: lead?.id, fromLabel: normalizePhone(to) || to } });
```
- [ ] **Step 2:** After the STOP/START handling (which returns early) and after the JV block, add consumer canned automation — BEFORE the final `return twiml()`. Only when NOT opted out and NOT already handled:
```ts
  // Consumer canned auto-answer: keyword match → reply from the number they texted + mark handled.
  const { matchCanned } = await import("@/lib/canned");
  const canneds = await db.cannedResponse.findMany({ where: { active: true } });
  const hit = matchCanned(body, canneds as any);
  if (hit && hit.reply) {
    const ourNumber = normalizePhone(to) || to;
    const cfg = { ...(await (await import("@/lib/sms")).getTwilioCfg()), messagingSid: "", tollFree: ourNumber };
    const sent = await sendSms({ to: e164, body: hit.reply, leadId: lead?.id, cfg });
    if (sent.ok) {
      await db.smsMessage.updateMany({ where: { to: e164, direction: "inbound", readAt: null }, data: { readAt: new Date() } }).catch(() => {});
      if (lead) await db.leadNote.create({ data: { leadId: lead.id, authorName: "Canned", body: `🤖 Auto-answered (${hit.label || "canned"}): ${hit.reply}` } }).catch(() => {});
    }
    return twiml();
  }
  // else: no match → leave unread → shows as "need human response" in the unified inbox
```
Do NOT change the STOP/START or JV logic. Keep the existing final `return twiml(...)`.
- [ ] **Step 3:** `npx tsc --noEmit` (zero from inbound route; unrelated followup/ WIP ignored) + `npm test` green.
- [ ] **Step 4: Commit** `feat(comms): capture receiving number + canned auto-answer on inbound SMS`.
> Controller note: `sms/inbound/route.ts` is uncommitted WIP + the box runs the WIP version — add these changes to the working tree, isolate-commit only the comms hunks, and deploy the working-tree version (diff box vs local first).

---

### Task 5: Comms lib (threads, canned CRUD, reply, handle)

**Files:** Create `src/lib/comms.ts` + `src/lib/comms.test.ts`.

**Interfaces:**
- `type Thread = { sender: string; ourNumber: string; leadId: string | null; name: string; lastAt: string; needsHuman: boolean; messages: { id: string; direction: string; body: string; at: string; read: boolean }[] }`
- `unifiedThreads(limit?: number): Promise<{ threads: Thread[]; numbers: string[] }>` — inbound+outbound consumer SMS (exclude JV-scope? keep simple: all SMS not tied to a JV lead is fine; group by `sender` = the consumer number = `to` for inbound / `to` for outbound reply). Group by the consumer number; `ourNumber` = the inbound `fromLabel`; `needsHuman` = any inbound in the thread with `readAt:null`; `numbers` = distinct `ourNumber`s seen (for filtering).
- `cannedList()`, `cannedCreate({label,keywords,reply,sortOrder})`, `cannedUpdate(id,patch)`, `cannedDelete(id)`.
- `markHandled(sender: string)` — set `readAt` on all that sender's unread inbound.
- `sendReply(input: { sender: string; ourNumber: string; body: string; leadId?: string | null }): Promise<{ ok: boolean; error?: string }>` — send FROM `ourNumber` TO `sender` via `sendSms` with the forced-From cfg; on success mark the sender's inbound handled.

- [ ] **Step 1:** Implement (grouping by the consumer number; reply forces From=ourNumber). See interfaces; mirror the JV `/unified` grouping shape but by phone number, SMS-only, no JV wall. Canned CRUD whitelists `label,keywords(JSON.stringify array),reply,active,sortOrder`.
- [ ] **Step 2:** `src/lib/comms.test.ts` (integration, self-cleaning by `zzz` phone prefix): create 2 inbound SMS from a `+1999zzz...`-style test sender (use a fixed odd test number, cleanup by `to`), assert `unifiedThreads` groups them into one thread with `needsHuman:true`; `markHandled` clears it; `cannedCreate`→`cannedList` round-trips. Delete created SmsMessage/CannedResponse rows by tracked id in afterEach.
- [ ] **Step 3:** `npx vitest run src/lib/comms.test.ts` + `npm test` green.
- [ ] **Step 4: Commit** `feat(comms): unified threads + canned CRUD + reply/handle store`.

---

### Task 6: API routes (staff-gated)

**Files:** Create `src/app/api/comms/reply/route.ts`, `src/app/api/comms/handle/route.ts`, `src/app/api/comms/canned/route.ts`, `src/app/api/shorten/route.ts`.

- [ ] **Step 1:** All four: `getSession()` + role ∈ STAFF (`["god","marketing","accounting","assistant"]`) else 403.
  - `POST /api/comms/reply` `{sender, ourNumber, body, leadId?}` → `sendReply(...)`.
  - `POST /api/comms/handle` `{sender}` → `markHandled(sender)`.
  - `/api/comms/canned` GET → `cannedList()`; POST `{action:"create"|"update"|"delete", ...}`.
  - `POST /api/shorten` `{url}` → `{ short: await shortenUrl(url) }`.
- [ ] **Step 2:** `npx tsc --noEmit` (zero from the 4 routes) + `npm test` green.
- [ ] **Step 3: Commit** `feat(comms): staff-gated comms + shorten API routes`.

---

### Task 7: Unified page + nav + notification link

**Files:** Create `src/app/dashboard/unified/page.tsx`, `src/components/comms/UnifiedComms.tsx`; modify `src/components/dash/Nav.tsx`, `src/components/dash/Notifications.tsx`.

- [ ] **Step 1 (page):** God/staff server page: `getSession()` + STAFF gate (else redirect `/dashboard`); load `unifiedThreads()` + `cannedList()`; render `<UnifiedComms threads={...} numbers={...} canned={...} />`.
- [ ] **Step 2 (UnifiedComms.tsx):** client:
  - Left: number filter (All + each ourNumber), thread list (needs-human first, red dot), showing sender + last body + which number.
  - Right: selected thread messages (inbound/outbound bubbles), a reply box with: a **canned-answer picker** (dropdown inserting a saved reply), a **"Shorten link"** control (input a URL → `POST /api/shorten` → insert the returned short link into the reply), **Send** (`POST /api/comms/reply`), and **Mark handled** (`POST /api/comms/handle`). Refresh via `router.refresh()`. Robust fetch (res.ok + try/catch/finally + error banner).
  - A collapsible **Canned answers** manager (list + add/edit/delete via `/api/comms/canned`).
- [ ] **Step 3 (Nav):** add `["Unified", "/dashboard/unified", "💬"]` to `LEFT_NAV` (near the top, e.g. after Overview).
- [ ] **Step 4 (Notifications):** make the "Texts to respond" row a link to `/dashboard/unified` (wrap the row in an `<a href="/dashboard/unified">` and close the popover on click).
- [ ] **Step 5:** `npx tsc --noEmit` (zero from the new/changed files) + `npm test` green.
- [ ] **Step 6: Commit** `feat(comms): unified consumer inbox page + Unified nav + notification link`.

---

### Task 8: Full test + isolated build + deploy

- [ ] `npm test` green.
- [ ] Isolated build → exit 0, `/dashboard/unified` + `/api/comms/reply` + `/api/shorten` in manifest.
- [ ] Deploy (controller): raw SQL `CREATE TABLE canned_response (...)` on the box (NOT db push); append CannedResponse model to box schema (guard on the unique `canned_response` map) + `prisma generate`; seed canned rows on prod (bare PrismaClient, not full db:seed); rsync changed runtime files INCLUDING the working-tree `sms/inbound/route.ts` (diff box vs local first); build-before-restart; verify site 200 + `/api/comms/*` + `/api/shorten` 403 for anon + `/dashboard/unified` 307. Backfill note: existing inbound SMS have empty `fromLabel` (received before capture) — they'll show under "unknown number"; new ones capture correctly.

## Self-Review

**Coverage:** clickable texts count → `/dashboard/unified` (Task 7 Notifications link); unified page across ALL numbers (Task 5 threads by number + Task 7 filter); canned auto-answer on keyword (Tasks 2/4), "need human response" on no-match (Task 4 leaves unread); manage canned answers (Tasks 5/6/7); auto-response "already set up" (Task 1 seed); el.ag shortener (Task 3 + Task 6 `/api/shorten` + Task 7 UI); Unified nav (Task 7).
**el.ag:** configurable via Integration `"elag"` — finalize with the real endpoint/key once provided; falls back to the long URL until then (never breaks a reply).
**Isolation:** JV `/unified` + JV/STOP inbound logic untouched (only added consumer canned block + `To` capture). `CannedResponse` additive; `fromLabel` reuse = no schema change beyond the new table.
**Deferred:** reply-from-exact-number depends on those numbers being send-capable in Twilio (fallback = default sender if a specific From fails); email channel in the consumer inbox (SMS-first).
