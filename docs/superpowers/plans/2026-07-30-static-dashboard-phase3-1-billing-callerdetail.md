# Static Dashboard — Phase 3.1 Plan (Per-Buyer States · Connect-Time Billing · Caller Detail)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Move state targeting to the buyer; add buyer-leg **Connect Time** and bill the buyer's amount **only when Connect Time ≥ the buyer's billable seconds** (revising the current bill-at-transfer); make the caller number on Call Reports a link to a **caller detail** page (full lead data, their answers, how the call ended, audio recording, a text transcript of the AI conversation, and the caller's other calls).

**Architecture:** Additive columns `StaticBuyer.states`, `StaticBuyer.billableSeconds`, `Call.connectSec`. Routing filters buyers by caller state. The Static transfer stops billing at transfer; the dial-end callback records `connectSec` (from `DialCallDuration`) and bills when it crosses the buyer's threshold. The Static intake logs a transcript to `Call.transcript`. A god-only `/dashboard/static/calls/[id]` detail page. All Static-scoped/additive; voice stays dormant behind `activeEngine==="static"`.

**Tech Stack:** Next.js 16 App Router, Prisma/SQLite dev + Postgres prod, Twilio TwiML, Vitest. `@/`→`src/`.

## Global Constraints

- DORMANT: voice changes run only at `activeEngine==="static"`; Fluid untouched.
- Buyer states: `StaticBuyer.states` JSON String array of 2-letter codes; `"[]"` = all states. Routing includes a buyer iff its states are empty OR contain the caller's state (case-insensitive, 2-letter).
- Billing rule (REVISED): at transfer, DO NOT bill (Call `priceCents=0, realized=false`). At dial-end, `connectSec = DialCallDuration`; if `connectSec >= buyer.billableSeconds` AND `billableSeconds > 0` → `priceCents = buyer.payoutCents` (else the money-word `valueCents` fallback stays for payout amount), `realized=true`; else `priceCents=0, realized=false`. Charge once (binary threshold).
- Connect Time column sits immediately RIGHT of Duration on `/dashboard/static/calls`, using `Call.connectSec` (seconds). (Duration color bands stay on `durationSec`.)
- Caller detail is God-only (`getSession`+`isGod`), read-only. Shows: Lead profile, `LeadAnswer` Q&A, this call's fields incl. disposition ("how it ended"), `durationSec`, `connectSec`, `priceCents`, `recordingUrl` (HTML5 `<audio>` if present), the parsed `Call.transcript` (AI conversation), and the caller's other Static calls.
- Transcript: the Static flow appends `{role,text}` turns to `Call.transcript` (JSON String array) as it runs — AI prompt lines (`bot`) and caller responses (`caller`).
- Additive only: three new columns (nullable-defaulted); `Call` gains `connectSec` (additive, safe for Fluid — Fluid ignores it). Reuse `Lead`/`LeadAnswer`/`Call`. No Fluid/u65/voice.ts/inbound changes. Prisma provider sqlite dev; JSON as String; extended `db`. Reuse `esc`,`getVoiceAgent` (`@/lib/voice`), `normalizePhone` (`@/lib/sms`), `getSettings` (`@/lib/logic`), `usd2` (`@/lib/format`), `Card`/`Section` (`@/components/ui`).
- Tests colocated; `npm test`.

## File Structure

- `prisma/schema.prisma` — **modify (isolated)**: `StaticBuyer.states`, `StaticBuyer.billableSeconds`, `Call.connectSec`.
- `src/lib/static/buyers.ts` — **modify**: whitelist `states`,`billableSeconds`; JSON.stringify `states`.
- `src/lib/static/routing.ts` — **modify**: filter by caller state; return `billableSeconds`; add `ctx.state`.
- `src/lib/static/routing.test.ts` — **modify**: state-filter + billableSeconds tests.
- `src/app/api/voice/static-step/route.ts` — **modify**: pass `ctx.state`; stop billing at transfer; dial-end connectSec+billing; transcript logging.
- `src/components/static/BuyerPanel.tsx` — **modify**: `states` + `billableSeconds` fields.
- `src/lib/static/report.ts` — **modify**: add `connectSec` to `CallRow`.
- `src/lib/static/caller.ts` — **create**: `callerDetail(callId)` → lead + answers + this call + other calls (+ test).
- `src/app/dashboard/static/calls/page.tsx` — **modify**: Connect Time column + clickable from-number link.
- `src/app/dashboard/static/calls/[id]/page.tsx` — **create**: caller detail page.

---

### Task 1: Schema — buyer states, billableSeconds, Call.connectSec

**Files:** Modify `prisma/schema.prisma`.

- [ ] **Step 1:** In `model StaticBuyer`, after the `payoutCents` line, add:
```prisma
  states           String          @default("[]") // JSON 2-letter state codes this buyer takes; [] = all
  billableSeconds  Int             @default(0)     // connect secs to bill (0 = never auto-bill)
```
In `model Call`, after the `durationSec` line, add:
```prisma
  connectSec    Int      @default(0) // buyer-leg talk time (DialCallDuration) — Static billing clock
```
- [ ] **Step 2:** `npm run db:push`; verify:
```bash
npx tsx -e "import { db } from './src/lib/db'; (async()=>{const m=await db.staticMoneyWord.findFirst(); const b=await db.staticBuyer.create({data:{moneyWordId:m.id,name:'__p__',defaultNumber:'+15550000000',states:JSON.stringify(['TX']),billableSeconds:120}}); const c=await db.call.create({data:{connectSec:75}}); console.log('ok',b.states,b.billableSeconds,c.connectSec); await db.staticBuyer.delete({where:{id:b.id}}); await db.call.delete({where:{id:c.id}});})()"
```
Expected: `ok ["TX"] 120 75`.
- [ ] **Step 3:** Commit `feat(static): buyer states + billableSeconds + Call.connectSec (Phase 3.1)`.
> Controller: isolate-stage the three added lines only (Pd/tv WIP uncommitted); db:push against full working schema.

---

### Task 2: Store whitelist + routing state-filter + billableSeconds return

**Files:** Modify `src/lib/static/buyers.ts`, `src/lib/static/routing.ts` + `src/lib/static/routing.test.ts`.

**Interfaces:** `pickBuyerFor(leafId, ctx: { zip?: string; state?: string }, nowMs)` → `{ buyerId, number, payoutCents, billableSeconds } | null`.

- [ ] **Step 1 (buyers.ts):** add `"states"`, `"billableSeconds"` to `EDITABLE_BUYER`; after the existing `afterHoursDays` stringify, add: `if (Array.isArray(data.states)) data.states = JSON.stringify(data.states);`
- [ ] **Step 2 (routing.ts):** update `RouteResult` to `{ buyerId: string; number: string; payoutCents: number; billableSeconds: number } | null`. Add `ctx.state` handling: after `filtered` (the non-blank-number pool), add a state filter:
```ts
          const st = (ctx.state || "").trim().toUpperCase().slice(0, 2);
          const inState = (b: { states: string }) => {
            let arr: string[]; try { arr = JSON.parse(b.states || "[]"); } catch { arr = []; }
            return !Array.isArray(arr) || arr.length === 0 || (st !== "" && arr.map((x) => x.toUpperCase()).includes(st));
          };
          const stateFiltered = filtered.filter(inState);
          if (stateFiltered.length === 0) return null;
```
Use `stateFiltered` in place of `filtered` for the ZIP-override lookup, the SWRR pool, and the persist loop. In the success return add `billableSeconds: chosen.billableSeconds`.
- [ ] **Step 3 (test):** add cases — a buyer with `states: JSON.stringify(["FL"])` is skipped for a `{ state: "TX" }` call (returns null when it's the only buyer); a buyer with `states: "[]"` matches any state; assert `r!.billableSeconds` is returned. Keep self-cleaning.
- [ ] **Step 4:** `npx vitest run src/lib/static/routing.test.ts` + `npm test` green.
- [ ] **Step 5:** Commit `feat(static): per-buyer state routing + billableSeconds in routing (Phase 3.1)`.

---

### Task 3: Buyer admin UI — states + billable seconds

**Files:** Modify `src/components/static/BuyerPanel.tsx`.

- [ ] **Step 1:** In the `Buyer` type add `states: string; billableSeconds: number;`. In `BuyerRow` add state:
```ts
  const [statesCsv, setStatesCsv] = useState((() => { try { return (JSON.parse(buyer.states || "[]") as string[]).join(", "); } catch { return ""; } })());
  const [billSec, setBillSec] = useState(String(buyer.billableSeconds ?? 0));
```
Add to `save()`:
```ts
    states: statesCsv.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
    billableSeconds: Math.max(0, parseInt(billSec, 10) || 0),
```
Add inputs to the grid:
```tsx
        <div><label className={L}>States (CSV, blank=all)</label><input className={F} value={statesCsv} onChange={(e) => setStatesCsv(e.target.value)} placeholder="TX, FL" /></div>
        <div><label className={L}>Billable secs (0=off)</label><input className={F} value={billSec} onChange={(e) => setBillSec(e.target.value)} /></div>
```
Keep everything else (payout, weight, cap, numbers, ZIP rules) unchanged.
- [ ] **Step 2:** `npx tsc --noEmit` (zero from BuyerPanel) + `npm test` green.
- [ ] **Step 3:** Commit `feat(static): buyer states + billable-seconds fields in admin UI (Phase 3.1)`.

---

### Task 4: Connect-time billing + transcript in the voice flow

**Files:** Modify `src/app/api/voice/static-step/route.ts`.

**Interfaces:** consumes `pickBuyerFor` (now needs `ctx.state`, returns `billableSeconds`).

- [ ] **Step 1 — stop billing at transfer.** In `transfer(...)`, change the Call update to NOT bill (record intent, not revenue):
```ts
  await db.call.update({ where: { id: callId }, data: { forwardedTo: dest, status: "transferring", disposition: "static", priceCents: 0, realized: false } }).catch(() => {});
```
Keep the `buyerId` in the dial action (`step("backup", callId, `&buyer=${buyerId}`)`).
- [ ] **Step 2 — pass caller state + payout to routing.** In `routeLeaf`, call `pickBuyerFor(leafId, { zip: call.zip || undefined, state: call.state || undefined }, nowMs)`. The `revenueCents` (used for the eventual bill amount) is still `res.payoutCents > 0 ? res.payoutCents : (node?.valueCents || 0)` — but it is NOT written at transfer now; the dial-end step bills it. Encode the amount + threshold into the dial action so the callback can bill without re-reading routing: change the transfer signature to also take `billSec` and `amountCents`, and put them in the action query:
```ts
async function transfer(callId: string, number: string, voice: string, buyerId: string, amountCents: number, billSec: number): Promise<string> {
  const call = await db.call.findUnique({ where: { id: callId } });
  const s = await getSettings();
  const dest = normalizePhone(number) || number;
  const callerId = normalizePhone(call?.fromNumber || "") || s.raw["tollFreeCallerId"] || "+18006334427";
  await db.call.update({ where: { id: callId }, data: { forwardedTo: dest, status: "transferring", disposition: "static", priceCents: 0, realized: false } }).catch(() => {});
  const action = step("backup", callId, `&buyer=${buyerId}&amt=${amountCents}&bill=${billSec}`);
  return `<Dial timeout="25" callerId="${callerId}" record="record-from-answer-dual" action="${action}"><Number>${dest}</Number></Dial>`;
}
```
Update all `transfer(...)` call sites (routeLeaf primary, and the PHI offer route) to pass `amountCents` + `billSec` (for the PHI route: `r.payoutCents>0 ? r.payoutCents : (phi.valueCents||0)` and `r.billableSeconds`; for the fixed fallback number pass `0,0`).
- [ ] **Step 3 — dial-end: record connectSec + bill.** In the `phase === "backup"` branch, before the backup-retry logic, when the dial COMPLETED, record connect time + bill:
```ts
  if (phase === "backup") {
    const buyerId = url.searchParams.get("buyer") || "";
    const amt = parseInt(url.searchParams.get("amt") || "0", 10);
    const billSec = parseInt(url.searchParams.get("bill") || "0", 10);
    const dialDur = parseInt(String(form?.get("DialCallDuration") || "0"), 10);
    if (dialStatus === "completed") {
      const billed = billSec > 0 && dialDur >= billSec;
      await db.call.update({ where: { id: callId }, data: { connectSec: dialDur, ...(billed ? { priceCents: amt, realized: true } : {}) } }).catch(() => {});
      return xml(`<Hangup/>`);
    }
    // not completed → record whatever connect time (0) then try backup number once
    if (dialDur > 0) await db.call.update({ where: { id: callId }, data: { connectSec: dialDur } }).catch(() => {});
    const backup = await pickBackupNumber(buyerId);
    if (backup) {
      const call2 = await db.call.findUnique({ where: { id: callId } });
      const s = await getSettings();
      const callerId = normalizePhone(call2?.fromNumber || "") || s.raw["tollFreeCallerId"] || "+18006334427";
      const dest = normalizePhone(backup) || backup;
      const action = step("backup", callId, `&buyer=${buyerId}&amt=${amt}&bill=${billSec}`);
      return xml(`<Dial timeout="25" callerId="${callerId}" record="record-from-answer-dual" action="${action}"><Number>${dest}</Number></Dial>`);
    }
    return xml(`<Say voice="${voice}">We're sorry, our specialist is unavailable. We'll call you right back. Goodbye.</Say><Hangup/>`);
  }
```
(This makes the backup retry ALSO route its dial-end back through the same billing branch.)
- [ ] **Step 4 — transcript logging.** Add a helper near the top:
```ts
async function logTurn(callId: string, role: "bot" | "caller", text: string) {
  if (!text) return;
  const c = await db.call.findUnique({ where: { id: callId }, select: { transcript: true } });
  let arr: { role: string; text: string }[] = [];
  try { arr = JSON.parse(c?.transcript || "[]"); } catch { arr = []; }
  arr.push({ role, text });
  await db.call.update({ where: { id: callId }, data: { transcript: JSON.stringify(arr) } }).catch(() => {});
}
```
In `POST`, after reading `speech`/`digit`, if `speech` is present log the caller turn: `await logTurn(callId, "caller", speech);` (once, near the top of POST after `call` is loaded). In `staticGreeting`, `finishLeaf`, the menu/state/age/offer prompts, log the bot line before returning the gather — minimally: wrap `gather(...)`-producing lines by first `await logTurn(callId, "bot", <the line>)`. (Do this for the age, state, menu, submenu, ask, offer prompts and the no-buyer/decline Say lines. `staticGreeting` has no callId-less path — it receives callId, so log there too.)
- [ ] **Step 5:** `npx tsc --noEmit` (zero from static-step) + `npm test` green.
- [ ] **Step 6:** Commit `feat(static): connect-time billing + call transcript logging (Phase 3.1)`.

---

### Task 5: Report — Connect Time column + clickable caller

**Files:** Modify `src/lib/static/report.ts`, `src/app/dashboard/static/calls/page.tsx`.

- [ ] **Step 1 (report.ts):** add `connectSec: number` to `CallRow`; include `connectSec: c.connectSec` in the map.
- [ ] **Step 2 (calls/page.tsx):** add a `Connect` header + cell immediately AFTER the Duration cell:
```tsx
                    <td className={`pr-3 font-semibold ${DUR[durationBand(r.durationSec)]}`}>{r.durationSec}s</td>
                    <td className="pr-3">{r.connectSec}s</td>
```
(and the matching `<th className="pr-3">Connect</th>` right after the Duration `<th>`; bump the empty-row `colSpan` from 9 to 10). Make the From # cell a link to the detail page:
```tsx
                    <td className="pr-3 font-mono"><a className="text-[var(--gold)] underline" href={`/dashboard/static/calls/${r.id}`}>{r.fromNumber}</a></td>
```
- [ ] **Step 3:** `npx tsc --noEmit` (zero from the two files) + `npm test` green.
- [ ] **Step 4:** Commit `feat(static): Connect Time column + clickable caller on Call Reports (Phase 3.1)`.

---

### Task 6: Caller detail page

**Files:** Create `src/lib/static/caller.ts` (+ test), `src/app/dashboard/static/calls/[id]/page.tsx`.

**Interfaces:** `callerDetail(callId: string): Promise<{ call, lead, answers, otherCalls } | null>`.

- [ ] **Step 1 (caller.ts):**
```ts
import { db } from "@/lib/db";

export async function callerDetail(callId: string) {
  const call = await db.call.findUnique({ where: { id: callId } });
  if (!call) return null;
  const lead = call.leadId ? await db.lead.findUnique({ where: { id: call.leadId } }) : null;
  const answers = lead ? await db.leadAnswer.findMany({ where: { leadId: lead.id }, orderBy: { askedAt: "asc" } }) : [];
  const otherCalls = await db.call.findMany({
    where: { fromNumber: call.fromNumber, id: { not: callId }, disposition: { startsWith: "static" } },
    orderBy: { createdAt: "desc" }, take: 50,
  });
  return { call, lead, answers, otherCalls };
}

export function parseTranscript(s: string | null): { role: string; text: string }[] {
  try { const a = JSON.parse(s || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
}
```
- [ ] **Step 2 (caller.test.ts):** create a lead + a static Call (leadId set, transcript `[{"role":"bot","text":"hi"}]`, recordingUrl "http://x") + a LeadAnswer + another static Call same fromNumber; assert `callerDetail(callId)` returns the lead, the answer, parses the transcript, and lists the other call. Self-clean by tracked ids (leads/answers cascade or delete explicitly).
- [ ] **Step 3 (detail page):**
```tsx
import { redirect } from "next/navigation";
import { getSession, isGod } from "@/lib/auth";
import { callerDetail, parseTranscript } from "@/lib/static/caller";
import { usd2 } from "@/lib/format";
import { Card, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CallerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!isGod(session)) redirect("/dashboard");
  const { id } = await params;
  const data = await callerDetail(id);
  if (!data) return <div className="p-6">Call not found. <a className="text-[var(--gold)]" href="/dashboard/static/calls">← Call Reports</a></div>;
  const { call, lead, answers, otherCalls } = data;
  const turns = parseTranscript(call.transcript);
  const L = "text-xs uppercase text-[var(--muted)]";
  return (
    <div className="space-y-6">
      <Section title={`Caller — ${call.fromNumber}`} action={<a className="text-sm text-[var(--gold)]" href="/dashboard/static/calls">← Call Reports</a>}>
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><div className={L}>Money Word</div>{call.moneyWord || "—"}</div>
            <div><div className={L}>How it ended</div>{call.disposition}</div>
            <div><div className={L}>Duration</div>{call.durationSec}s</div>
            <div><div className={L}>Connect</div>{call.connectSec}s</div>
            <div><div className={L}>State</div>{call.state || "—"}</div>
            <div><div className={L}>To #</div><span className="font-mono">{call.toNumber}</span></div>
            <div><div className={L}>Landed</div><span className="font-mono">{call.forwardedTo || "—"}</span></div>
            <div><div className={L}>Billed</div>{call.realized ? usd2(call.priceCents) : "not billed"}</div>
          </div>
        </Card>
      </Section>

      <Section title="AI recording">
        <Card>
          {call.recordingUrl
            ? <audio controls src={call.recordingUrl.endsWith(".mp3") ? call.recordingUrl : `${call.recordingUrl}.mp3`} className="w-full" />
            : <div className="text-sm text-[var(--muted)]">No audio recording captured for this call.</div>}
          <div className="mt-4">
            <div className={L + " mb-1"}>Transcript</div>
            {turns.length === 0 ? <div className="text-sm text-[var(--muted)]">No transcript.</div> : (
              <div className="space-y-1 text-sm">
                {turns.map((t, i) => (
                  <div key={i}><span className={t.role === "bot" ? "text-[var(--gold)]" : "text-[color:#3fb950]"}>{t.role === "bot" ? "AI" : "Caller"}:</span> {t.text}</div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </Section>

      <Section title="Lead / known data">
        <Card>
          {lead ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                <div><div className={L}>Name</div>{lead.name || "—"}</div>
                <div><div className={L}>Phone</div><span className="font-mono">{lead.phone}</span></div>
                <div><div className={L}>Email</div>{lead.email || "—"}</div>
                <div><div className={L}>DOB</div>{lead.dob || "—"}</div>
                <div><div className={L}>State</div>{lead.state || "—"}</div>
                <div><div className={L}>Zip</div>{lead.zip || "—"}</div>
                <div><div className={L}>Source</div>{lead.source}</div>
                <div><div className={L}>Ref</div>{lead.refNum ? `444-${String(lead.refNum).padStart(10, "0")}` : "—"}</div>
              </div>
              <div className={L + " mb-1"}>Answers</div>
              {answers.length === 0 ? <div className="text-sm text-[var(--muted)]">No answers.</div> : (
                <ul className="text-sm space-y-1">{answers.map((a) => <li key={a.id}><b>{a.question}:</b> {a.answer}</li>)}</ul>
              )}
            </>
          ) : <div className="text-sm text-[var(--muted)]">No lead linked to this call.</div>}
        </Card>
      </Section>

      <Section title={`Other Static calls from ${call.fromNumber}`}>
        <Card>
          {otherCalls.length === 0 ? <div className="text-sm text-[var(--muted)]">None.</div> : (
            <ul className="text-sm space-y-1">
              {otherCalls.map((c) => (
                <li key={c.id}><a className="text-[var(--gold)] underline" href={`/dashboard/static/calls/${c.id}`}>{c.createdAt.toLocaleString()}</a> — {c.moneyWord || "—"} · {c.disposition} · {c.connectSec}s connect</li>
              ))}
            </ul>
          )}
        </Card>
      </Section>
    </div>
  );
}
```
- [ ] **Step 4:** `npx vitest run src/lib/static/caller.test.ts` + `npx tsc --noEmit` (zero from new files) + `npm test` green.
- [ ] **Step 5:** Commit `feat(static): caller detail page — lead, answers, recording, transcript, how-it-ended (Phase 3.1)`.

---

### Task 7: Full test + isolated build + deploy

- [ ] `npm test` green.
- [ ] Isolated worktree build → exit 0, `/dashboard/static/calls/[id]` in manifest.
- [ ] Deploy (controller, additive): raw SQL on box — `ALTER TABLE "static_buyer" ADD COLUMN IF NOT EXISTS "states" TEXT NOT NULL DEFAULT '[]'; ALTER TABLE "static_buyer" ADD COLUMN IF NOT EXISTS "billableSeconds" INTEGER NOT NULL DEFAULT 0; ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "connectSec" INTEGER NOT NULL DEFAULT 0;`. Add the 3 fields to the box schema **inside the correct model blocks** (guard by scanning the model block, NOT a global grep — a global `grep -q states/connectSec` false-matches other models and skips the insert, which breaks the client → build type-error → 502). `npx prisma generate`; rsync changed runtime files; build-before-restart; verify site 200 + report/detail god-gated (307) + inbound POST 200 (dormant).

## Self-Review

**Coverage:** buyer states (Tasks 1-3 + routing filter), connect time (Task 1 col + Task 4 capture + Task 5 report col), billable-on-connect (Task 4, revises transfer-time billing), caller detail w/ lead+answers+recording+transcript+how-it-ended+other-calls (Task 6), transcript logging (Task 4). 
**Revises:** Phase-3 bill-at-transfer → bill-at-connect-threshold. `payoutCents` = charge amount; new `billableSeconds` = threshold.
**Deferred:** geo-radius ZIP, Twilio test numbers, follow-up SMS, training game, agent/manager deflection.
**Isolation/additive:** 3 new columns (2 on StaticBuyer, 1 on the shared `Call` — additive, Fluid ignores it); no Fluid/u65/voice.ts/inbound changes; dormant.
**Deploy note:** box schema field-add MUST guard per model block (Phase-3 502 lesson).
