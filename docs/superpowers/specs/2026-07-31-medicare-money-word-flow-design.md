# Medicare Money-Word Voice Flow (Static engine) — Phase A Design

**Date:** 2026-07-31
**App:** medigap Core (`~/Desktop/core`), Next.js 16 App Router, Prisma (SQLite dev / Postgres prod), Twilio voice, deploys to Vultr box `137.220.56.129` as pm2 `medigap`.
**Scope:** Phase A only — the Medicare branching voice flow, its sub-money-words, state→phone SMS-back, Educational-Program signup capture, and flipping the Static engine to the live default. The 🚀 Notification Service (calendar/scheduler, recurring sends, responses→unified inbox) is **Phase B** (separate spec).

Decisions locked with the user: **hybrid intent detection** (keyword fast-path + AI fallback); **Medicare flow first, Notification Service next**; **flip Static to default only after Medicare is built + deployed + verified**; **reuse existing Life Insurance / Private Health Insurance money words** for those upsell steps (route by slug, no duplicates); **scripts hardcoded in one editable module** for now (in-UI editing is a fast-follow).

---

## 1. Goal

Medicare callers (any caller whose intent maps to the word "Medicare") get a bespoke conversational flow that figures out whether they want (1) the government medicare.gov office, (2) to **buy** insurance, or (3) to **plan** their retirement / start Social Security — then serves that need: texts them the right government number, runs a monetizing upsell cascade, or routes them to a money-word buyer. The overarching principle (user's words): *"figure out how to help people while they're on the line. As soon as we know we can satisfy their need, we text them a phone number if we can't help them; then get them into one of our money words that actually is currently paying in their state and age bracket."*

## 2. Architecture — how it plugs into the existing Static engine

The Static engine (mapped in the codebase) works like this and is **not** being rearchitected:
- Single call-entry seam: `src/app/api/calls/inbound/route.ts` reads `getActiveEngine()`; if `"static"`, returns `staticGreeting(call.id)`.
- Every subsequent Twilio hit lands on `POST src/app/api/voice/static-step/route.ts`, a `phase`-switch. **Conversation state = the `phase=` (+extras) baked into the `<Gather action>` URL, plus durable facts persisted on the `Call` row** (`call.moneyWord`, `call.state`, `call.zip`). No session store. Twilio re-POSTs to whatever `action` URL we return.
- Menu selection is pure keyword/DTMF substring matching (`matchSelection` in `src/lib/static/voice.ts`). No AI today.
- Buyer selection = `pickBuyerFor(leafId, {zip,state}, nowMs)` (`src/lib/static/routing.ts`), nginx SWRR (`swrr.ts`), exact-ZIP override, after-hours numbers, `payoutCents` = per-buyer revenue. Transfer = `<Dial callerId=… record=… action=step("backup")>`.

**New seam — custom-flow dispatch.** Add an additive column `StaticMoneyWord.flowKey String @default("")`. In `static-step`'s `menu`/`submenu` handling, after `matchSelection` resolves a node, if that node's `flowKey` is non-empty, dispatch to the matching custom-flow handler **instead of** descending into the generic submenu/leaf logic. Phase A registers exactly one: `flowKey="medicare"` → the Medicare handler. This keeps all Medicare logic isolated and leaves the generic engine untouched.

**Medicare handler module:** `src/lib/static/medicare.ts` — pure decision logic + TwiML fragment builders for each Medicare sub-phase; the route delegates to it. Spoken copy lives in `src/lib/static/medicare-scripts.ts` (named constants, verbatim wording — §7). New phases (encoded in the `action` URL exactly like existing phases):

```
mcare_intent        greet + classify → gov | buy | plan
mcare_buy           (BUY) transfer-script → route to "Medicare Insurance" leaf
mcare_gov_confirm   (GOV) "want us to text you the number?" yes/no
mcare_gov_life      upsell 1: Life Insurance          yes→transfer  no→next
mcare_gov_phi       upsell 2: Private Health Insurance yes→transfer+bye  no→next
mcare_gov_reverse   upsell 3: Reverse Mortgage         yes→transfer  no→next
mcare_gov_retire    upsell 4: Retirement Planner       yes→transfer  no→bye
mcare_plan          (PLAN) SS script + enroll offer → capture Educational Program → text SS number
```

Durable per-call facts needed beyond `call.state`: which intent/branch we're in is carried by `phase=`; a "pending SMS to send after this call" is written to the `Call` row via a new nullable column `pendingSms String?` (or sent inline at the yes-moment — see §6). Chosen: **send the government-number SMS inline at the moment the caller says "yes, text me"** (we already have `call.state` + caller `from`), so no new call column is needed and the text arrives even if the caller hangs up early.

## 3. Intent classification (hybrid) — `classifyMedicareIntent`

Pure keyword classifier first (synchronous, testable), AI fallback only on a miss:

- **gov** keywords: `card`, `replace`, `my card`, `lost my card`, `didn't get`, `did not get`, `bill`, `bill paid`, `medicare.gov`, `government`, `office`, `new card`.
- **buy** keywords: `buy`, `quote`, `how much`, `save money on insurance`, `advantage`, `medicare advantage`, `drug`, `drug coverage`, `part d`, `supplement`, `medigap`, `plan g`, `plan n`, `coverage`, `insurance quote`, `need insurance`.
- **plan** keywords: `retire`, `retiring`, `ready to retire`, `sign up`, `enroll`, `part a`, `part b`, `start medicare`, `get on medicare`, `social security`, `how do i get`.

`classifyMedicareIntent(speech): "gov" | "buy" | "plan" | null` — lowercase substring match, checked in a defined priority order (plan-specific tokens like `part b`/`social security` beat generic `insurance`; explicit `buy`/`quote` beats `plan`). Returns `null` on no hit.

**AI fallback** (`classifyMedicareIntentAI`): on `null`, call the existing AI provider (`getAIProvider()` in `src/lib/voice.ts`, the Fluid engine's precedent) with a tight system prompt: given the caller utterance and the three intent definitions, return exactly one of `gov|buy|plan`. Parse strictly; if the response isn't one of the three, treat as unresolved → one re-prompt, then default to speaking the full menu again. Wrapped so it's mockable in tests; failures/timeouts degrade to the re-prompt path (never dead-air).

## 4. Yes/No detection — `detectYesNo`

Reuse the existing `offer`-phase pattern. `detectYesNo(speech, digit): "yes" | "no" | null`:
- yes: `/\b(yes|yeah|yep|sure|ok|okay|please|correct|let me join|join|i do|do it)\b/i`, or DTMF `1`.
- no: `/\b(no|nope|nah|don'?t|not interested|no thanks)\b/i`, or DTMF `2`.
- else `null` → re-ask once, then default (per-branch default noted in §5).

Pure + unit-tested.

## 5. The flow, branch by branch (verbatim scripts in §7)

**Entry:** caller says "Medicare" at the top menu → `mcare_intent`. Speak the Medicare greeting, gather speech → `classifyMedicareIntent` → AI fallback → branch. On unresolved: re-prompt once with an explicit 3-way question, then default to `mcare_buy` is **not** assumed — default is to re-speak the greeting menu.

**BUY → `mcare_buy`:** speak the transfer script (§7 transfer, money word = "Medicare Insurance") → route to the **Medicare Insurance** leaf via `pickBuyerFor`. If a buyer exists → `<Dial>` (existing transfer path, billing, backup). If none → existing no-buyer capture (`captureCallback`) + PHI fallback offer (existing `offer` behavior). Medicare Insurance is "sold by state and highest bidder, possibly by zip" = the standard StaticBuyer/SWRR/`payoutCents`/`StaticZipRule` config the user fills in later.

**GOV → `mcare_gov_confirm`:** speak the "we're 1-800-MEDIGAP, a free private service… it looks like you're looking for medicare.gov… would you like us to text you the appropriate number?" script → yes/no.
- **yes:** **immediately send the state Medicare-office SMS** (§6) → speak "Great, we'll text the appropriate number to you shortly. We have you." → proceed to `mcare_gov_life`.
- **no:** thank + hang up (still no government need we can't meet; capture nothing further). (Edge: "no" here means they don't want the text — end politely.)

**Upsell cascade (GOV, after yes):**
- `mcare_gov_life` — Life-insurance actuarial pitch → **yes:** transfer to **Life Insurance** money word (by slug). **no:** `mcare_gov_phi`.
- `mcare_gov_phi` — $29/mo critical-illness Medigap pitch, "May I send you information on that as well?" → **yes:** transfer to **Private Health Insurance** money word, then (its transfer script covers the handoff). **no:** `mcare_gov_reverse`.
- `mcare_gov_reverse` — reverse-mortgage pitch → **yes:** transfer to **Reverse Mortgage** money word (default buyer 972-800-6670). **no:** `mcare_gov_retire`.
- `mcare_gov_retire` — retirement-planner pitch → **yes:** transfer to **Retirement Planner** money word (default buyer 972-800-6670). **no:** "Thank you for calling 1-800-MEDIGAP. Goodbye." + `<Hangup>`.

**PLAN → `mcare_plan`:** speak the Social-Security script (§7) → gather yes/no on joining the free notification service → **either way**: (a) **write an `EducationalProgram` row** (phone=caller `from`, state=`call.state`, source="medicare-plan", enrolled = (answer==yes)), (b) **send the Social-Security SMS** (§6), (c) speak "Here's the number for Social Security" + thank + `<Hangup>`.

**Transfer script (every money-word transfer):** before the `<Dial>`, speak (money word substituted): *"Great — transferring you to a {moneyWord} professional now. Thank you for calling 1-800-MEDIGAP. We'll text you the information you need and connect you with a professional who handles {moneyWord}."* Implemented as a spoken `<Say>` prepended to the existing transfer TwiML, parameterized by the target money word's display label.

## 6. State→phone SMS-back — `src/lib/static/statephones.ts` + `sendStaticSms`

Two pure lookup tables keyed by normalized state name (via existing `normalizeState`), full verbatim data below. `medicarePhoneForState(state)` and `ssPhoneForState(state)` return the number or a national fallback (`1-800-MEDICARE` / `800-772-1213`) if state unknown.

New helper `sendStaticSms({ to, body, callId })` in `src/lib/static/sms.ts` — thin wrapper over `src/lib/sms.ts` `sendSms`, forces From = 1-800-MEDIGAP main number, logs a `SmsMessage` (so replies thread into the unified inbox), never throws (logs + returns `{ok}`). Called inline from the GOV-yes and PLAN branches.

Message templates (verbatim intent):
- GOV: `"Thank you for calling 1-800-MEDIGAP. Here is the number you requested: {medicarePhone}"`.
- PLAN/SS: `"Thanks for calling 1-800-MEDIGAP. Here is the Social Security number you requested: {ssPhone}. You're enrolled in our free notification service — we'll text you timely reminders."` (drop the enrollment sentence if they declined).

**Medicare state office numbers** (SHIP/SHIBA lines as provided):
Alabama 800-243-5463 · Alaska 800-478-6065 · Arizona 800-432-4040 · Arkansas 800-224-6330 · California 800-434-0222 · Colorado 888-696-7213 · Connecticut 800-994-9422 · Delaware 800-336-9500 · Florida 800-963-5337 · Georgia 866-552-4464 · Hawaii 888-875-9229 · Idaho 800-247-4422 · Illinois 800-252-8966 · Indiana 800-452-4800 · Iowa 800-351-4664 · Kansas 800-860-5260 · Kentucky 877-293-7447 · Louisiana 800-259-5300 · Maine 800-262-2232 · Maryland 800-243-3425 · Massachusetts 800-243-4636 · Michigan 800-803-7174 · Minnesota 800-333-2433 · Mississippi 844-822-4622 · Missouri 800-390-3330 · Montana 800-551-3191 · Nebraska 800-234-7119 · Nevada 800-307-4444 · New Hampshire 866-634-9412 · New Jersey 800-792-8820 · New Mexico 800-432-2080 · New York 800-701-0501 · North Carolina 855-408-1212 · North Dakota 888-575-6611 · Ohio 800-686-1578 · Oklahoma 800-763-2828 · Oregon 800-722-4134 · Pennsylvania 800-783-7067 · Rhode Island 888-884-8721 · South Carolina 800-868-9095 · South Dakota 800-536-8197 · Tennessee 877-801-0044 · Texas 800-252-9240 · Utah 800-541-7735 · Vermont 800-642-5119 · Virginia 800-552-3402 · Washington 800-562-6900 · West Virginia 877-987-4463 · Wisconsin 800-242-1060 · Wyoming 800-856-4398 · District of Columbia 202-727-8370 · Puerto Rico 877-725-4300 · U.S. Virgin Islands 340-774-2991.

**Social Security number** is `800-772-1213` for every state/territory (national line) — table stored uniformly for future per-state overrides.

## 7. Spoken scripts — `src/lib/static/medicare-scripts.ts` (verbatim)

Named constants, used by the handler. Wording is the user's, lightly punctuated for TTS:
- `GREETING`: "Great. Are you looking to buy Medicare insurance? Are you on Medicare looking to save money on life insurance? Or are you just getting ready to retire? Let us know how we can help."
- `GOV_CONFIRM`: "We're 1-800-MEDIGAP, a free private service, and we'd be happy to help you save money or connect you with an insurance agent. But based on what you said, it sounds like you're looking for medicare.gov. Would you like us to text you the appropriate number?"
- `GOV_YES_ACK`: "Great, we'll text the appropriate number to you shortly. We have you."
- `LIFE_PITCH`: "Would you like to save money on life insurance? The actuarial tables have changed, allowing most of our clients to save 20 to 50 percent on their life insurance."
- `PHI_PITCH`: "Did you know there is a new Medigap plan that pays you directly for surprise expenses caused by an accident, cancer, stroke, heart attack, and critical illness? It lets you pay your light bill, lawn care, and life expenses when you need it most, for as low as 29 dollars a month in your age bracket. May I send you information on that as well?"
- `REVERSE_PITCH`: "Do you have any interest in a reverse mortgage, allowing you to take out needed money to live life?"
- `RETIRE_PITCH`: "Would you like help from a professional retirement planner to maximize your retirement?"
- `GOODBYE`: "Thank you for calling 1-800-MEDIGAP. Goodbye."
- `PLAN_SS`: "1-800-MEDIGAP is America's trusted source. If you're looking to start Social Security, you're going to need many of our services in the future, like Medicare insurance, retirement planning, Medicare gap coverage, and more. Right now we think you should start with Social Security. We're happy to text you the appropriate phone number and enroll you in our free notification service, notifying you by text about important dates and opportunities to save time and money and not miss out on time-specific events. Just say 'yes, let me join,' or 'no.' Thanks again for calling 1-800-MEDIGAP."
- `TRANSFER(moneyWord)`: "Great — transferring you to a {moneyWord} professional now. Thank you for calling 1-800-MEDIGAP. We'll text you the information you need and connect you with a professional who handles {moneyWord}."
- `WHAT_CONTEXT`: "1-800-MEDIGAP is America's first autonomous voice engine in training, also known as Multi-source Expert Data Intelligence Guidance And Precision — MEDIGAP GPT — and we're here to serve you as best we can as we grow. We may be going through periods where we don't have professionals already onboarded. Please listen to the following list and let us know how we can help."
- `CUSTOMER_SERVICE_CONTEXT`: same MEDIGAP-GPT intro + "Please listen to the following list, pick from the list, and we'll transfer you to the customer service person best suited to your needs."

## 8. Cross-cutting "what?" and "customer service" handlers

Before branching in any Medicare gather, `medicareInterrupt(speech)` checks: whole-word `what` (`/\bwhat\b/i` with no other intent tokens) → speak `WHAT_CONTEXT` + repeat the money-word menu, re-gather the same phase. `customer service|representative|rep|agent|speak to someone` → speak `CUSTOMER_SERVICE_CONTEXT` + repeat the menu, re-gather. Pure detector + tested. (Scope: Medicare phases only; generalizing to the whole engine is a later option.)

## 9. Data model changes (all additive)

1. `StaticMoneyWord.flowKey String @default("")` — custom-flow dispatch key.
2. New `EducationalProgram` model:
   ```
   model EducationalProgram {
     id String @id @default(cuid())
     phone String
     state String @default("")
     name  String @default("")
     source String @default("")      // e.g. "medicare-plan"
     enrolled Boolean @default(true)  // false = declined the notification service but still captured
     leadId String?
     createdAt DateTime @default(now())
     @@map("educational_program")
   }
   ```
3. Seed additions (idempotent, must NOT trip the existing "no-op if any StaticMoneyWord exists" guard — use a separate `ensureMedicareSubtree()` that upserts by slug): **Medicare** (top-level, `flowKey="medicare"`), and children **Medicare Insurance**, **Reverse Mortgage** (+ StaticBuyer default 972-800-6670), **Retirement Planner** (+ StaticBuyer default 972-800-6670). Life Insurance + Private Health Insurance are the existing seeded nodes (referenced by slug `life-insurance`, `private-health-insurance`).

## 10. Dashboard

The Medicare node + children render automatically as tabs/sub-tabs in `StaticControls`; buyer config (Medicare Insurance by state/bidder/zip; the 972 numbers) uses the existing `BuyerPanel`. Phase A adds no new dashboard surface (the 🚀 Notification Service button is Phase B). The scripts are code constants for now; the design notes in-UI editing as a fast-follow.

## 11. Testing

Colocated vitest, `npm test`:
- `classifyMedicareIntent` — each intent's keywords, priority conflicts (`part b` beats `insurance`; `quote` beats `retire`), no-hit → null.
- `detectYesNo` — yes/no/DTMF/null.
- `medicarePhoneForState` / `ssPhoneForState` — a sample of states, unknown→fallback, normalization ("calif"/"CA"/"California").
- `medicareInterrupt` — "what", "customer service", plain intent → null.
- `TRANSFER(word)` interpolation.
- AI fallback: provider mocked; miss→AI→gov; AI garbage→null.

## 12. Error handling / safety

- AI or keyword unresolved → one explicit re-prompt, then re-speak the greeting menu. Never dead-air (`<Redirect>` safety net stays, as in the existing engine).
- Transfer target with no active buyer → existing no-buyer capture + PHI fallback offer; the caller is never dropped silently.
- `sendStaticSms` failure → logged, call continues.
- All new work is additive; the box's schema drift (145k-row `tv_audience`) is protected — deploy new tables/columns via raw `ALTER`/`CREATE ... IF NOT EXISTS` + guarded schema append + `prisma generate` (never `db push`).

## 13. Go-live (final step)

After the flow is built, deployed to the box, and verified (a real test call walks gov/buy/plan; the two SMS templates arrive; Educational-Program row written), flip the engine: set `Setting activeEngine="static"` (via the god EngineToggle or a one-off), and correct the stale toggle label ("live calls stay on Fluid" → reflect that the toggle now controls live routing).

## 14. Deferred to Phase B (Notification Service)

The 🚀 Notification Service page next to Call Reports (black button, white outline/text): signup list (top/last 20, truncated), an event **calendar** of scheduled notifications, **Add to Calendar** (date/time/month + message + text link, e.g. the Oct 15 "Open Enrollment is coming" → `https://el.ag/medicare-plans` example), recurring scheduled **text + email** sends off the app's cron/tick, and responses threading into the unified inbox + notification bell. Phase A only writes `EducationalProgram` rows; Phase B builds everything that acts on them.

## Self-Review

- **Coverage:** greeting, 3-way intent (hybrid), gov confirm + 4-step upsell + state-Medicare SMS, buy→Medicare Insurance, plan→SS + Educational Program + SS SMS, transfer script, what/customer-service handlers, sub-money-words + 972 buyers, engine flip. All present.
- **Consistency:** state = phase-URL + Call row (matches existing engine); SMS sent inline (no new call column); flowKey dispatch is additive; upsell reuse-by-slug vs new-nodes is explicit.
- **Ambiguity resolved:** GOV "no" (don't text) → polite end; unresolved intent → re-prompt then menu (no silent default to a paid path); SS number national for all states; Educational Program captures both joiners and decliners (enrolled flag).
- **Scope:** Phase A is one coherent voice-flow subsystem; the scheduler subsystem is cleanly deferred to Phase B.
