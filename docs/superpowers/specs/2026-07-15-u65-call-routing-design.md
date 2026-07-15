# U65 Inbound Call Routing & Ringba Reconciliation — Design

**Date:** 2026-07-15
**Status:** Approved design → ready for implementation plan
**Owner:** Jeff Cline

## 1. Goal

Stand up a new **under‑65 ("U65") private‑health‑insurance call product** for a new buyer who pays
**$75.00 per call where the transferred leg lasts ≥ 121 seconds**. Deliver a single control‑and‑reporting
page at **`/dashboard/u65`** that:

- Routes qualifying U65 calls to the buyer's number and tracks the **transfer‑leg** clock.
- Marks each call **BILLABLE ($75)** when that transfer leg reaches ≥ 121 seconds.
- Reconciles our billable count against what the buyer **actually paid** in Ringba/BrokerCalls.
- Lets us control eligibility (states), the destination number, the hours, and the after‑hours behavior.

This is **purely additive**. Every existing flow (the AI voice agent, the ping tree, the auction, all
current dashboards and reporting) keeps working unchanged. U65 is a branch that only intercepts when a
call matches the U65 criteria.

## 2. Context — what we build on (already in the codebase)

| Existing piece | File | How U65 uses it |
|---|---|---|
| Twilio inbound webhook (1‑800‑633‑4427) | `src/app/api/calls/inbound/route.ts` | Add a U65 branch after intake |
| AI voice flow (intake → open, money words) | `src/app/api/voice/step/route.ts` | Inject a U65 qualifying step; captures DOB already |
| Age from spoken DOB | `ageFromSpeech()` in `src/lib/voice.ts` | Determines under‑65 with **no extra caller question** |
| Money‑word detection | `detectMoneyWord()` in `src/lib/voice.ts` | Recognizes "private / health insurance / medical insurance" |
| Call routing / auction | `routeCall()` in `src/lib/logic.ts` | The "no" path: run the ping tree unchanged |
| Twilio `<Dial>` status callback | `src/app/api/calls/status/route.ts` | Twilio's `DialCallDuration` = **transfer‑leg seconds** (our 121s clock) |
| Key/value settings + writer | `Setting` model, `src/app/api/settings/route.ts` | Stores U65 config |
| Call log referencing a call | `AffiliatePing` model (references `callId`) | Precedent for the new `U65Call` model |
| Dashboard page + UI kit | `src/app/dashboard/ping-tree/page.tsx`, `Card/Stat/Section/Badge` | The `/dashboard/u65` page follows this exact pattern |
| Dashboard nav | `src/components/dash/Nav.tsx` | Add the U65 entry |

**Key architectural fact:** Twilio's `<Dial action=...>` status callback returns **`DialCallDuration`**,
which is the duration of the *bridged (transferred) leg only* — from the moment the buyer's number answers
until hangup — **not** total call time. This is exactly the billable clock the buyer bills on. We already
receive it; we just need to persist it per U65 call and apply the 121‑second threshold.

## 3. The two inbound sources

### 3a. 1‑800‑633‑4427 — the existing AI line (adds a U65 branch)

1. Call lands → existing `/api/calls/inbound` → existing AI intake captures **name, ZIP, DOB**.
2. After intake, compute **age** from DOB (`ageFromSpeech`). Two gates decide the branch:
   - **age < 65** (U65), **AND**
   - the caller's **state is enabled**, **AND**
   - the current Ringba‑clock time is **within configured hours**.
3. If all gates pass → the AI asks the **U65 qualifying question**:
   > *"Are you looking for private or individual health insurance?"*
   - **Yes / money word** (`private`, `health insurance`, `medical insurance`) → **transfer to the SET
     number**, log a `U65Call`, and bridge with `<Dial action=/api/u65/status>` so we capture the
     transfer‑leg clock.
   - **No** → fall through to the **existing open‑phase flow** (money words → auction → ping tree),
     completely unchanged. The ping‑tree result for that call still shows on the U65 page ("ran ping tree").
4. If **age ≥ 65**, or state disabled → skip U65 entirely; normal flow, no U65 row.
5. **After hours** (all gates pass except time): still logged as a `U65Call` (marked `afterHours`), and
   handled per **after‑hours mode** (§6): default **REGULAR FLOW** = continue the normal AI/money‑word
   flow (no U65 transfer); alternative = dial the **backup number**.

### 3b. (346) 220‑3471 — the direct line (no AI)

A Twilio number in our account pointed at a **new** webhook `/api/u65/direct`:

1. Call lands → immediately `<Dial action=/api/u65/status>` to the **SET number**. No AI, no intake.
2. Log a `U65Call` (`source = direct_220`), capturing caller number and `FromState` if Twilio provides it.
3. **After hours** → route to the **backup number** if set (REGULAR FLOW has no meaning without AI), else
   still bridge to the SET number; either way it is logged and marked `afterHours`.

Both sources produce `U65Call` rows that appear on the page — **including after‑hours calls**.

## 4. Under‑65 determination

Use the **DOB the AI already collects during intake**; `ageFromSpeech()` yields the age; **age < 65 = U65**.
No new question is asked of the caller for age. If DOB was not captured (rare), the call does **not** enter
the U65 transfer branch (it flows normally) and is not counted as U65. The direct line (3b) has no age data
and is treated as U65 by definition of the number's purpose.

## 5. Billable clock ($75 @ ≥121s)

- The U65 `<Dial>` uses `action=/api/u65/status`. On the dial's completion Twilio POSTs
  **`DialCallDuration`** = transfer‑leg seconds.
- `/api/u65/status` writes `transferSec` on the `U65Call`; if `transferSec >= 121`, set
  `billable = true`, `billableCents = 7500`.
- This measures **only** transfer‑to‑hangup, never total call time, per the requirement.
- The week‑to‑date "billable (our data)" figure = `count(billable) * $75`.

## 6. Configuration (page‑editable, stored as one JSON `Setting`, key `u65Config`)

```jsonc
{
  "setNumber": "+13809790146",         // buyer destination; editable + saved
  "backupNumber": "+19728006670",      // after-hours alternative
  "afterHoursMode": "regular",         // "regular" (money-word flow) | "backup" (dial backupNumber)
  "hours": { "start": "08:30", "end": "18:30", "days": { "mon": true, "tue": true, "wed": true,
             "thu": true, "fri": true, "sat": true, "sun": true } },
  "timezone": "UTC-6",                 // FIXED -6, no DST (matches the Ringba/BrokerCalls clock)
  "states": { "AL": true, "AK": true, /* … all 50, editable, all-on / all-off control */ },
  "ringbaAccountId": "CA5f21b5af6efb48eda821bff312693e3f",
  "ringbaCampaignId": ""               // the buyer's U65 campaign filter; picked from /campaigns once API is authorized
}
```

- Written via the existing `Setting` upsert pattern (`/api/u65/config` → `db.setting.upsert`).
- **The Ringba API token is NOT stored here.** It lives only in the server env var `RINGBA_API_TOKEN`.

### Time handling (fixed UTC−6)

All U65 time logic — hours on/off, `afterHours` flag, "week to date" boundary, and the reconciliation
window sent to Ringba — is computed against a **fixed UTC−6** offset (no daylight saving). This matches the
BrokerCalls/Ringba clock the buyer manages from (verified 2026‑07‑15: Ringba 05:43 ↔ 11:43 UTC = −6). The
timezone is a saved setting, so if the buyer's clock ever changes we adjust one value. "Week to date" =
since **Monday 00:00 at UTC−6**.

## 7. Data model — new `U65Call` (additive; mirrors `AffiliatePing`)

```prisma
model U65Call {
  id             String    @id @default(cuid())
  callId         String?   // links to Call when the AI line created one
  source         String    @default("ai_633")  // ai_633 | direct_220
  fromNumber     String    @default("")
  name           String    @default("")
  state          String    @default("")
  u65            Boolean   @default(true)       // age < 65 (true for direct line by definition)
  answer         String    @default("")         // e.g. "yes · private", "no"
  afterHours     Boolean   @default(false)
  forwardedTo    String    @default("")
  transferSec    Int       @default(0)          // DialCallDuration — transfer leg only
  billable       Boolean   @default(false)      // transferSec >= 121
  billableCents  Int       @default(0)          // 7500 when billable
  ringbaCallId   String    @default("")
  ringbaSec      Int       @default(0)          // their connected seconds
  ringbaPaid     Boolean   @default(false)      // their >120s / payout > 0
  reconciled     Boolean   @default(false)
  reconciledAt   DateTime?
  isTest         Boolean   @default(false)      // simulated rows, clearable (matches AffiliatePing)
  createdAt      DateTime  @default(now())

  @@index([createdAt])
  @@index([billable])
  @@index([reconciled])
}
```

No changes to the `Call` model — the central model stays clean; U65 specifics are isolated here.

## 8. Ringba / BrokerCalls reconciliation (read‑only)

**Platform:** the buyer's calls are managed in **BrokerCalls**, a white‑labeled Ringba. Verified facts:

- API host: `https://api.ringba.com/v2/{accountId}/…`; auth header `Authorization: Token {RINGBA_API_TOKEN}`.
- Account ID (BrokerCalls path segment): **`CA5f21b5af6efb48eda821bff312693e3f`** (confirmed the recognized
  account route — `/…/campaigns` returns 403 *forbidden* not 404 *not found*).
- The token authenticates (`Token` scheme → 403; `Bearer` → 401), so the value is valid.

**Current blocker:** every resource (`/campaigns`, `/calllogs`, `/insights`) returns a blanket empty‑body
`403`, unchanged even from the allowlisted IP → this is a **token permission / account API‑entitlement**
setting on the BrokerCalls side, not a wrong ID and not our IP. Resolution is on BrokerCalls: grant the
`MEDIGAP` token read access to **Campaigns + Call Logs**, or have the BrokerCalls rep enable API access.
When live, the reconciliation calls run **server‑side from medigap.plus**, whose egress IP we add to the
token's allowlist.

**Reconciliation logic** (`src/lib/ringba.ts`):

1. `POST /v2/{ringbaAccountId}/calllogs` for the reporting window (week‑to‑date, UTC−6), optionally filtered
   to `ringbaCampaignId`, requesting columns: `callDt`, `inboundPhoneNumber`, `connectedCallLengthInSeconds`,
   `hasConnected`, `payoutAmount`, `campaignName`.
2. Match each Ringba row to a `U65Call` by **caller phone (last 10 digits) + time proximity**.
3. Store `ringbaCallId`, `ringbaSec`, `ringbaPaid` (their connected seconds > 120 / payout > 0),
   `reconciled = true`.
4. Triggered by a **"Sync Ringba"** button on the page (a scheduled cron can be added later).

**Graceful‑degrade:** until the token is authorized, the page renders fully on our own data and the
"Actually paid (Ringba)" column shows **"connect Ringba"**; it lights up automatically once authorized.

## 9. The `/dashboard/u65` page (server component, ping‑tree style)

**Week‑to‑date header (4 stats), in order:**
1. **Total U65 calls** (this week, UTC−6)
2. **Over 121s** (our data — count where `transferSec ≥ 121`)
3. **Billable (our data)** — count × $75
4. **Actually paid (Ringba)** — sum of reconciled `ringbaPaid` rows (or "connect Ringba")

**Controls (client component → `POST /api/u65/config`):**
- **50‑state grid**, on/off per state, with **All on / All off**.
- **SET number** — editable text, saved.
- **Hours editor** — start/end + per‑day toggles; labeled **UTC−6 (Ringba clock)**.
- **After‑hours mode** — toggle **REGULAR FLOW** (default) vs **Backup number** (+ editable backup number).
- **Sync Ringba** button.

**Call table** — every U65 call incl. after‑hours, newest first:
`Timestamp (UTC−6) · Name · Source (AI/Direct) · State · Answer · Transfer secs · BILLABLE ($75) · Ringba paid?`
The "no" path shows the ping‑tree outcome for that call.

**Nav:** add `["U65", "/dashboard/u65", "🎯"]` under 🌳 Ping Tree in `src/components/dash/Nav.tsx`.

## 10. New/changed files

| Path | Change |
|---|---|
| `prisma/schema.prisma` | **Add** `U65Call` model (+ migration) |
| `src/app/api/u65/direct/route.ts` | **New** — no‑AI webhook for 220‑3471 → dial SET number |
| `src/app/api/u65/status/route.ts` | **New** — Twilio dial callback → `transferSec` + billable |
| `src/app/api/u65/config/route.ts` | **New** — read/write `u65Config` setting |
| `src/app/api/u65/reconcile/route.ts` | **New** — "Sync Ringba" trigger |
| `src/lib/ringba.ts` | **New** — Ringba/BrokerCalls client + matcher (token from env) |
| `src/lib/u65.ts` | **New** — hours/state gating, UTC−6 helpers, config load/save |
| `src/app/api/voice/step/route.ts` | **Edit** — insert U65 qualifying step after intake (age<65 gate) |
| `src/app/dashboard/u65/page.tsx` | **New** — the page |
| `src/components/u65/U65Controls.tsx` | **New** — states/number/hours/after‑hours/sync controls |
| `src/components/dash/Nav.tsx` | **Edit** — add U65 nav entry |
| `.env` / server env | **Add** `RINGBA_API_TOKEN` (gitignored; never committed) |

## 11. Security

- **`RINGBA_API_TOKEN`** lives only in server env; never in the DB, page, or repo.
- The token pasted in chat is considered compromised → **rotate it in BrokerCalls** after wiring the new one.
- Reconciliation runs server‑side only; the medigap.plus server IP is added to the BrokerCalls token allowlist.
- `/dashboard/u65` and all `/api/u65/*` config/reconcile routes are behind the existing dashboard auth.

## 12. Verification / testability

Live telephony can't be exercised end‑to‑end locally (Twilio needs a public webhook + real calls). Plan:

- **Unit‑testable pure logic** (`src/lib/u65.ts`): hours/after‑hours gating at fixed UTC−6 (day rollover and
  the 08:30 / 18:30 edges), state gating, the 121‑second billable threshold (120 vs 121 vs 122), and the
  week‑to‑date Monday‑00:00 boundary. TDD these.
- **Simulated rows**: reuse the `isTest` pattern (as `AffiliatePing` does) + the existing
  `/api/calls/simulate` approach so the page and billable math can be seen pre‑go‑live and cleared after.
- **Ringba matcher**: unit‑test the phone+time matching against a captured sample `calllogs` response; the
  live pull is verified once BrokerCalls authorizes the token.
- **Manual live check**: one test call per source after deploy, confirming transfer‑leg capture and a row on
  the page.

## 13. Dependencies / open items (do not block the build)

1. **BrokerCalls token API permission** — grant `MEDIGAP` token read access to Campaigns + Call Logs (or
   rep enables account API access). Until then the Ringba column shows "connect Ringba".
2. **`ringbaCampaignId`** — the buyer's specific U65 campaign; selected from `/campaigns` once the API is
   authorized, then saved in config.
3. **medigap.plus server egress IP** — added to the BrokerCalls token allowlist for production reconciliation.
4. **Rotate the Ringba token** after go‑live.

## 14. Non‑goals

- No change to any existing flow, dashboard, or reporting.
- No writing to Ringba (read‑only reconciliation).
- No automated Ringba cron in v1 (manual "Sync Ringba" button; cron is a later add).
- No new caller‑facing age question (age comes from existing DOB intake).
