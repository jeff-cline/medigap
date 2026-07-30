# Static Call-Routing Dashboard — Design Spec

**Date:** 2026-07-30
**App:** medigap Core (`~/Desktop/core`, Next.js 16 App Router, deploys to 137.220.56.129)
**Status:** Phase 1 — approved to build. Phase 2 — documented, shovel-ready (additive).

---

## 1. Overview & Goal

The current inbound-call AI ("**Fluid**") isn't converting the way we want. **Static** is a second,
independent call-routing engine and dashboard that the God account can toggle live against Fluid.
Static is organized around **Money Word tabs** — a sortable, arbitrarily-deep tree of verticals — where
each money word is spoken as part of the AI menu, carries its own routing config, and reports its own
revenue.

**Guiding principle (per owner):** *Build Phase 1 now, but design it so Phase 2 is purely additive —
new tables and code only, never a rewrite or a data-losing migration.* Phase 1's schema and UI are laid
out so Phase 2 (buyers + live routing) bolts on without touching a single Phase-1 row.

## 2. Phasing (whole platform)

1. **Phase 1 — Static shell + Money-Word tab tree + Fluid⇄Static toggle** ← *this spec builds this.*
2. **Phase 2 — Buyer routing engine + live AI call flow** ← *this spec documents this in full.*
3. **Phase 3 — Call tracking (All Calls) + revenue dashboard.** (Summarized for forward-compat.)
4. **Phase 4 — Follow-up texting + AI model/voice pickers + Money-Word Cloud / hot list.** (Summarized.)

## 3. Architecture & Isolation

- **Static is its own namespace.** New tables (`Static*`), new pages under `/dashboard/static`, new lib
  in `src/lib/static/*`. The Fluid flow (`/api/voice/step`, `MoneyWord`, `/dashboard/u65`, `src/lib/u65*`,
  `src/lib/voice.ts`) is **not modified** in Phase 1.
- **One global switch:** `Setting` key **`activeEngine`** = `"fluid" | "static"` (default `"fluid"`).
  - Phase 1: the God top-nav toggle flips this flag and swaps which dashboard renders. It is **admin-only** —
    live calls keep running on Fluid regardless.
  - Phase 2: the live voice webhook reads `activeEngine` at call start and branches to Static routing when
    it's `"static"`. Cutover = one deliberate flip; flipping back = instant rollback.
- **Follows existing conventions:** async server components with `export const dynamic = "force-dynamic"`;
  `?tab=`/`?node=` query-driven navigation (mirrors `/dashboard/u65`, `/fire`); config saved via a JSON
  API route to a client `<Controls>` component; Tailwind v4 dark theme + `src/components/ui` primitives
  (`Card`, `Stat`, `Section`, `Badge`); money format via `src/lib/format.ts`.
- **Auth:** God-only. Gate with `isGod(session)` from `src/lib/auth.ts` (redirect non-god to their portal).

## 4. Data Model

### 4.1 Phase 1 table — `StaticMoneyWord` (the tab / tree node)

```prisma
model StaticMoneyWord {
  id                String   @id @default(cuid())
  parentId          String?                     // self-relation → hierarchy, any depth
  parent            StaticMoneyWord?  @relation("StaticTree", fields: [parentId], references: [id], onDelete: Cascade)
  children          StaticMoneyWord[] @relation("StaticTree")
  sortOrder         Int      @default(0)         // left-to-right order within its parent
  active            Boolean  @default(true)      // on/off — off = not spoken in the menu
  word              String                       // display + spoken name, e.g. "Precision Medicine"
  slug              String   @unique              // url/id slug, e.g. "precision-medicine"
  valueCents        Int      @default(0)          // dollar value of a monetized call for this word
  states            String   @default("[]")       // JSON array of enabled 2-letter state codes ([] = all)
  ageRule           String   @default("{}")       // JSON { min?: number, max?: number }
  contextPrompt     String   @default("")         // AI context text for this word (may include price/desc + 911 for medical)
  askQuestionPrompt String   @default("")         // spoken after selection, before transfer (micro-commercial)
  // --- reserved for later phases so they never need a breaking migration ---
  textTemplate      String?                       // Phase 4: follow-up SMS template
  aiModel           String?                       // Phase 4: LLM choice override
  aiVoice           String?                       // Phase 4: TTS voice choice override
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Phase 2 back-relations (declared now; tables added in Phase 2):
  // buyers   StaticBuyer[]
  // zipRules StaticZipRule[]

  @@index([parentId, sortOrder])
}
```

Notes:
- `states` / `ageRule` are JSON-in-`String` (SQLite-safe; matches app's `Setting`/`logic` JSON convention).
- **Only leaf nodes route to buyers** (Phase 2). A node with children is a *category*: picking it makes the
  AI speak its enabled children as a sub-menu.
- `onDelete: Cascade` on the self-relation — deleting a parent deletes its subtree (with a confirm in UI).

### 4.2 Phase 2 tables (documented, additive — DO NOT build in Phase 1)

```prisma
model StaticBuyer {
  id             String   @id @default(cuid())
  moneyWordId    String
  moneyWord      StaticMoneyWord @relation(fields: [moneyWordId], references: [id], onDelete: Cascade)
  name           String
  defaultNumber  String                 // primary DID we transfer to (E.164)
  afterHoursNumber String?              // used during this buyer's after-hours window
  backupNumber   String?                // used if default/after-hours don't connect
  afterHoursDays String  @default("[]") // JSON array of weekday numbers this buyer is "after hours"
  afterHoursStart Int?                  // minutes-from-midnight (CST) after-hours window start
  afterHoursEnd   Int?                  // minutes-from-midnight (CST) after-hours window end
  active         Boolean  @default(true)
  dailyCap       Int      @default(0)   // 0 = unlimited
  priorityWeight Int      @default(1)   // relative weight for weighted round-robin
  dailyCount     Int      @default(0)   // resets daily (CST)
  swrrCurrent    Int      @default(0)   // smooth-weighted-round-robin running counter
  lastAssignedAt DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  @@index([moneyWordId, active])
}

model StaticZipRule {
  id          String  @id @default(cuid())
  moneyWordId String
  moneyWord   StaticMoneyWord @relation(fields: [moneyWordId], references: [id], onDelete: Cascade)
  buyerId     String
  zip         String              // center ZIP
  radiusMiles Int    @default(0)  // 0 = exact ZIP only
  createdAt   DateTime @default(now())
  @@index([moneyWordId, zip])
}
```

Adding these in Phase 2 is a **pure forward migration** — `StaticMoneyWord` rows (your whole tab tree,
prompts, states, values) are untouched. That is the "never redo Phase 1" guarantee.

### 4.3 Reuse (not duplicate)

- **Calls** — Phase 2/3 write to the existing `Call` model (already has `moneyWord`, `state`, `zip`,
  `forwardedTo`, `disposition`, `transcript`, `providerSid`). A thin `StaticCallLeg` may be added in P3 for
  stage tracking; still additive.
- **Twilio** creds — reuse `Integration` key `twilio` + `src/lib/sms.ts` helpers.
- **Tracking numbers** — reuse `TV_NUMBERS` in `src/lib/tv.ts` (main 1-800-MEDIGAP + A/B/C).

## 5. Phase 1 — Build Detail

### 5.1 Pages / routes

- `src/app/dashboard/static/page.tsx` — God-only server component. Renders the tab bar + selected node's
  config panel + the `{money words list}` preview. Query nav: `?node=<slug>`.
- `src/app/api/static/tree/route.ts` — JSON API: create node, update node (fields), reorder (sortOrder),
  toggle active, make-sub-tab (create child), delete node. Native-form-post *or* client `fetch` (match
  existing `U65Controls` fetch pattern).
- `src/app/api/static/engine/route.ts` — POST to set `activeEngine` (god-only); GET to read it.

### 5.2 Lib

- `src/lib/static/tree.ts` — pure functions: `buildTree(nodes)`, `flattenTopLevel(tree)`,
  `moneyWordsList(tree)` (the spoken list = enabled top-level nodes, left-to-right, by `sortOrder`),
  `reorder(nodes, id, dir)`, slug generation. **Unit-tested.**
- `src/lib/static/store.ts` — DB-backed CRUD over `StaticMoneyWord` (Prisma).
- `src/lib/static/seed.ts` — idempotent seeder (§5.5).

### 5.3 God top-nav toggle

- Add a **Fluid ⇄ Static** switch to the God nav (`src/components/dash/Nav.tsx`), visible only when
  `isGod`. Shows the current `activeEngine`; flipping posts to `/api/static/engine` and routes to the
  active dashboard (`/dashboard/u65` for Fluid, `/dashboard/static` for Static).
- Copy makes it explicit this is the **active engine** switch (Phase 1: dashboard only; Phase 2: live).

### 5.4 Dashboard UI (`/dashboard/static`)

- **Tab bar across the top** = top-level money words, left-to-right by `sortOrder`. Each tab shows its name
  and an **on/off** state. Controls: **+ Add tab** (creates a new top-level node), **↑/↓ reorder** (up/down
  buttons are the Phase-1 baseline; drag-and-drop is an optional nice-to-have), **Make sub-tab** (creates a
  child of the currently-selected node), **on/off**.
  - Selecting a **parent** tab reveals its **children** as a sub-tab row and lets you manage them the same way
    (add/reorder/toggle/make-sub-tab recurse at every level).
- **Config panel** for the selected node: `word`, `valueCents` ($), `states` (multi-select of US states,
  empty = all), `ageRule` (min/max), `contextPrompt` (textarea), `askQuestionPrompt` (textarea), `active`,
  `sortOrder`. Save via the JSON API.
- **`{money words list}` preview** card — renders exactly what the AI will speak for the top menu (enabled
  top-level nodes in order), so sorting here == what the caller hears.
- **Buyers / ZIP / text / voice** sections appear as **disabled placeholders labeled "Phase 2/4"** so the
  layout is already right and nothing surprises later.

### 5.5 Seed data (idempotent)

Top-level, in order (Home Services last / default):
1. Precision Medicine
2. Concierge Medicine
3. Private Health Insurance
4. Weight Loss
5. Peptides
6. Life Insurance
7. **Doctor** — context prompt opens with: *"If this is a medical emergency, hang up and dial 911. We are
   only a concierge voice engine."* Children: Plastic Surgery, Chiropractor, Allergy, Sexual Wellness,
   Weight Loss, General.
8. **Home Services** (last, default) — Children: Roofing, Plumbing, Air-Conditioning, Electrical, Lawn,
   Gardening, Pool Maintenance, Handyman.

Seeder only inserts if `StaticMoneyWord` is empty (safe to re-run).

### 5.6 Testing

- `src/lib/static/tree.test.ts` (Vitest, colocated): `moneyWordsList` respects order + skips inactive +
  top-level-only; `buildTree` nests children; `reorder` moves within siblings; slug uniqueness.
- Manual: create/reorder/toggle/sub-tab/delete a node; flip the engine toggle and confirm dashboard swap +
  no change to Fluid.

### 5.7 Caveats (from codebase mapping)

- Dev DB is **SQLite** (`prisma/schema.prisma` provider `sqlite`); prod intended Postgres. Static models
  are written **SQLite-safe** (JSON as `String`, no Postgres-only raw SQL). If/when prod moves to Postgres,
  these migrate cleanly.
- Existing schema drift (`FollowupText` missing from schema; some `tv.ts` raw Postgres SQL) is **not touched**
  by this work.

## 6. Phase 2 — Documented (shovel-ready, additive)

*Not built now. Captured so it's a clean bolt-on with no Phase-1 rework.*

### 6.1 The live intake flow (Static)

When `activeEngine === "static"`, the voice webhook branches to a Static handler that runs this script
(text editable from a **Training tab**, defaults below):

1. **Greeting + age:** *"Thanks for calling. In order to serve you better, please tell me your age."*
   (Caller phone comes from caller ID.) → store `age` on the Lead → for routing.
2. **State:** *"What state are you calling from?"* → store `state` → for routing.
3. **Menu:** *"Great — please listen to the options menu in its entirety and select the one that serves you
   best…"* then speak the **`{money words list}`** (enabled top-level nodes, in order).
4. **Selection:** deterministic match on the money word → if the node has children, speak the child sub-menu
   and repeat; on a **leaf**, run its `askQuestionPrompt` (micro-commercial, may include price/description),
   then transfer to the selected buyer.

### 6.2 Buyer routing engine (per leaf money word)

- Multiple buyers; each with **default / after-hours / backup** numbers, **on/off**, **daily cap**, and a
  **priority weight**.
- **Weighted round-robin (interleaved, not blocky)** across *active, under-cap* buyers using **Smooth
  Weighted Round Robin (SWRR)** — the nginx algorithm. Weights are effectively percentages of total; e.g.
  weight 9 vs 1 → over 10 calls, 9 go to A and 1 to B, but **interleaved** (A, B, A, A, A…), not "9 then 1."
  With three buyers 80/10/10, distribution tracks those ratios and interleaves. Turning a buyer **off** (or
  hitting its cap) removes it from the pool and its share **redistributes** to the remaining active buyers
  automatically.
- **After-hours:** if within a buyer's after-hours window (days + start/end, CST), dial `afterHoursNumber`.
- **Backup:** if the chosen number doesn't connect, dial `backupNumber`.
- **DID passthrough (programming note):** the transfer to the buyer **must** present the **inbound consumer's
  DID** as caller ID (same passthrough the Fluid flow already does — `callerId = caller's own number`).
- **Granular ZIP:** each leaf can toggle a **"Granular"** mode → the AI asks the caller's **ZIP**, and
  routing matches `StaticZipRule` (exact ZIP, or ZIP + radius 5/10/20 mi → all ZIPs in radius → that buyer).
- **No default buyer / none in area:** *"We're sorry, but we don't have {money word} in your area. Would you
  like us to notify you when we do?"* → write a **future callback** record + add to the **hot list / money-word
  cloud** (bigger = more unsold demand, so we know what to sell next).

### 6.3 Behavior rules (global AI context, editable)

- **Speaks before hearing the full list:** gently ask them to listen to the list in its entirety and pick the
  one that serves them best.
- **Frustrated:** remind them 1-800-MEDIGAP is here 24/7 to save them time and money — please listen to the
  list and pick the one that serves you best.
- **Asks for agent/manager/human:** explain 1-800-MEDIGAP is designed to save time and money; if they'll listen
  to all options, we'll happily connect them to a customer-service rep **within that money word** — so please
  listen to the menu in its entirety and pick the one that serves you best.
- **Medical (Doctor tree):** lead with the **911 disclaimer** (§5.5).
- **"Other":** *"We're America's first voice answer engine and growing as fast as we can to serve you — we'll
  gladly notify you when we bring on a partner who can help."* Ask what they're looking for → add to the
  money-word cloud. Optionally offer a **voice-drive training game**: let Medigap-GPT get smarter — they can
  ask/answer up to 10 questions (examples: "what color is a firetruck?", "how high is the tallest mountain?").
- **After-hours callback:** ask if they'd like a callback during business hours; if yes, ask what time works,
  then send a follow-up text with the buyer number and their money word.

### 6.4 Twilio test numbers (buy-use-release)

The buyer-signup system we integrate with allows only **one number at a time**. Provide a helper to
**provision a Twilio number, use it for one test, then release it** (Twilio API: create IncomingPhoneNumber →
route to test webhook → delete number). Surface as a "Get test number / Release" control in the buyer tab.

### 6.5 Reads the engine flag

The Static voice branch activates only when `activeEngine === "static"`. Flipping back to `fluid` is instant
rollback. No shared state with Fluid beyond the single flag.

## 7. Phase 3 & 4 — Summary (for forward-compat only)

- **Phase 3 — Call tracking + revenue.** `/dashboard/static` gains an **All Calls** tab (default view) with
  stages: **initiated → reached money-word → transferred → >2 min = $75-qualified**; drill into any phone
  number to see appended data (age/state/money word/route). **Revenue dashboard** totals by day/week/month and
  by money word using `StaticMoneyWord.valueCents`. Any number on screen is click-through to its appended data.
- **Phase 4 — Texting + voice/model + cloud.** 44-minute post-call **follow-up text** (send if 9-5 M-F CST,
  else defer to next business day 11:00 CST), **per-money-word template** editable in each tab, signed
  "MEDIGAP.AI", managed by its own tool. **AI model + voice pickers** (with "listen to sample") using the
  reserved `aiModel`/`aiVoice`/`textTemplate` columns. **Money-Word Cloud / hot list** of unsold demand.

## 8. Forward-Compatibility Guarantees (why Phase 1 never gets redone)

1. Static tables are namespaced and separate → Fluid untouched, no collisions.
2. Phase 2/3/4 only **add** tables (`StaticBuyer`, `StaticZipRule`, `StaticCallLeg`) and columns that are
   **already reserved nullable** (`textTemplate`, `aiModel`, `aiVoice`) → additive migrations, zero data loss.
3. The `activeEngine` flag exists from Phase 1 → Phase 2 just teaches the voice flow to honor it.
4. The tab tree, prompts, states, and values entered in Phase 1 are the exact inputs Phase 2 routing consumes.
