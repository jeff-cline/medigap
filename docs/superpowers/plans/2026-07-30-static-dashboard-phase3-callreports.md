# Static Dashboard — Phase 3 Plan (Call Reports + Revenue + No-Buyer Upgrade Offer)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Add a God "Call Reports" view of Static calls (routing, revenue, duration with red/yellow/green thresholds, money word, to-number, state, timestamp, where-it-landed), record revenue per call (money-word Value by default, optional per-buyer payout override), and upgrade the no-buyer voice path to offer a private-health-insurance comparison (default → PHI buyers, optional → a fixed fallback number).

**Architecture:** Additive `StaticBuyer.payoutCents`. Revenue recorded on the existing `Call` (`priceCents`) at Static transfer. A read-only report page `/dashboard/static/calls` + a green "Call Reports" button on `/dashboard/static`. A no-buyer offer sub-flow in the (dormant) `static-step` state machine, plus a `staticHealthFallbackNumber` Setting + a small God control. All Static-scoped, additive; live flow stays dormant behind `activeEngine==="static"`.

**Tech Stack:** Next.js 16 App Router, Prisma/SQLite dev + Postgres prod, Twilio TwiML, Vitest. `@/`→`src/`.

## Global Constraints

- DORMANT: voice changes run only when `activeEngine==="static"`; the Fluid path stays untouched.
- Revenue rule: on a Static transfer, `Call.priceCents = buyer.payoutCents > 0 ? buyer.payoutCents : leaf.valueCents`. (Default = money-word Value; upgrade = per-buyer payout when set.)
- Duration color thresholds (report): `durationSec` 0–30 = red, 31–90 = yellow, 91+ = green (use the `Call.durationSec` populated by `/api/calls/status`).
- Health fallback rule: no-buyer → offer "compare private individual health insurance quotes"; on **yes** → if Setting `staticHealthFallbackNumber` is non-empty, dial it; else route into the **Private Health Insurance** money word's buyers (SWRR); if that also yields no buyer → the polite sorry+hangup+capture. On **no** → "Sorry, we cannot help. We'll contact you when we have a money word available. Have a great day." + Hangup + `captureCallback`.
- Report is God-only (`getSession`+`isGod`), read-only, Static calls only (`disposition` LIKE `static%`).
- Additive only: `StaticBuyer.payoutCents` is a new nullable-defaulted column; no change to `Call` model shape; no Fluid file changes except none (report is new files). Prisma provider sqlite dev; JSON as String; extended `db` client. Reuse `esc`,`getVoiceAgent` (`@/lib/voice`), `normalizePhone` (`@/lib/sms`), `getSettings` (`@/lib/logic`), `usd2` (`@/lib/format`), `Card`/`Section` (`@/components/ui`).
- Tests colocated; `npm test`. `/api/calls/inbound` + `/api/voice/static-step` carry isolated-commit needs only where they overlap WIP — `static-step` is OURS (committed, no WIP), so normal staging; `schema.prisma` uses isolated staging (Pd/tv WIP).

## File Structure

- `prisma/schema.prisma` — **modify (isolated)**: add `StaticBuyer.payoutCents`.
- `src/lib/static/buyers.ts` — **modify**: whitelist `payoutCents` in `updateBuyer`.
- `src/lib/static/routing.ts` — **modify**: `pickBuyerFor` returns the chosen buyer's `payoutCents` too (for revenue).
- `src/lib/static/report.ts` — **create**: `staticCallReport()` (+ test).
- `src/lib/static/settings.ts` — **create**: `getHealthFallbackNumber`/`setHealthFallbackNumber` over Setting `staticHealthFallbackNumber` (+ test).
- `src/app/api/voice/static-step/route.ts` — **modify**: record revenue on transfer; no-buyer offer sub-flow (phases `offer`, route on yes/no).
- `src/components/static/BuyerPanel.tsx` — **modify**: add "Payout/call ($)" field.
- `src/app/dashboard/static/calls/page.tsx` — **create**: God report page (table + color-coded duration).
- `src/app/dashboard/static/page.tsx` — **modify**: green "Call Reports" link + a small "Health-insurance fallback #" control.
- `src/app/api/static/settings/route.ts` — **create**: god-gated GET/POST for the fallback number.

---

### Task 1: `StaticBuyer.payoutCents` (schema)

**Files:** Modify `prisma/schema.prisma`.

- [ ] **Step 1:** In `model StaticBuyer`, after the `priorityWeight` line, add:
```prisma
  payoutCents      Int             @default(0) // per-call payout ($ we get); 0 = use money-word Value
```
- [ ] **Step 2:** `npm run db:push`; verify:
```bash
npx tsx -e "import { db } from './src/lib/db'; (async()=>{const m=await db.staticMoneyWord.findFirst(); const b=await db.staticBuyer.create({data:{moneyWordId:m.id,name:'__p__',defaultNumber:'+15550000000',payoutCents:7500}}); console.log('ok',b.payoutCents); await db.staticBuyer.delete({where:{id:b.id}});})()"
```
Expected: `ok 7500`.
- [ ] **Step 3:** Commit `feat(static): StaticBuyer.payoutCents (Phase 3)`.
> Controller: isolate-stage the one added line (Pd/tv WIP stays uncommitted); db:push against full working schema.

---

### Task 2: Buyer payout in store + routing return

**Files:** Modify `src/lib/static/buyers.ts`, `src/lib/static/routing.ts` + `src/lib/static/routing.test.ts`.

**Interfaces:** `pickBuyerFor` return type becomes `{ buyerId: string; number: string; payoutCents: number } | null`.

- [ ] **Step 1 (buyers.ts):** add `"payoutCents"` to the `EDITABLE_BUYER` set.
- [ ] **Step 2 (routing.ts):** in `pickBuyerFor`, include the chosen buyer's `payoutCents` in the returned object:
```ts
          return { buyerId: chosen.id, number, payoutCents: chosen.payoutCents };
```
(Update the `RouteResult` type: `{ buyerId: string; number: string; payoutCents: number } | null`.)
- [ ] **Step 3 (test):** extend the "routes to the only active buyer" test to also assert `r.payoutCents` equals the buyer's `payoutCents` (default 0), and add a case where a buyer with `payoutCents: 5000` returns `payoutCents: 5000`.
- [ ] **Step 4:** `npx vitest run src/lib/static/routing.test.ts` + `npm test` green.
- [ ] **Step 5:** Commit `feat(static): buyer payoutCents through store + routing (Phase 3)`.

---

### Task 3: Revenue recorded on Static transfer

**Files:** Modify `src/app/api/voice/static-step/route.ts`.

**Interfaces:** consumes `pickBuyerFor` (now returns `payoutCents`).

- [ ] **Step 1:** In `routeLeaf`, after a successful `pickBuyerFor` (non-null `res`), compute revenue and pass it to `transfer`:
```ts
  const node = await nodeById(leafId);
  const nowMs = Date.now();
  const res = await pickBuyerFor(leafId, { zip: call.zip || undefined }, nowMs);
  if (!res) { /* ...existing no-buyer path (replaced in Task 5)... */ }
  const revenueCents = res.payoutCents > 0 ? res.payoutCents : (node?.valueCents || 0);
  await db.call.update({ where: { id: callId }, data: { moneyWord: node?.word || leafId } }).catch(() => {});
  return xml(await transfer(callId, res.number, voice, res.buyerId, revenueCents));
```
- [ ] **Step 2:** Update `transfer(...)` signature to accept `revenueCents` and persist it:
```ts
async function transfer(callId: string, number: string, voice: string, buyerId: string, revenueCents: number): Promise<string> {
  const call = await db.call.findUnique({ where: { id: callId } });
  const s = await getSettings();
  const dest = normalizePhone(number) || number;
  const callerId = normalizePhone(call?.fromNumber || "") || s.raw["tollFreeCallerId"] || "+18006334427";
  await db.call.update({ where: { id: callId }, data: { forwardedTo: dest, status: "transferring", disposition: "static", priceCents: revenueCents, realized: true } }).catch(() => {});
  const action = step("backup", callId, `&buyer=${buyerId}`);
  return `<Dial timeout="25" callerId="${callerId}" record="record-from-answer-dual" action="${action}"><Number>${dest}</Number></Dial>`;
}
```
- [ ] **Step 3:** `npx tsc --noEmit` (zero from static-step) + `npm test` green.
- [ ] **Step 4:** Commit `feat(static): record per-call revenue on Static transfer (Phase 3)`.

---

### Task 4: Buyer "Payout/call ($)" field in the admin UI

**Files:** Modify `src/components/static/BuyerPanel.tsx`.

- [ ] **Step 1:** In the `Buyer` type add `payoutCents: number`. In `BuyerRow`, add state `const [payout, setPayout] = useState(((buyer.payoutCents ?? 0) / 100).toString());` and include it in `save()`:
```ts
    payoutCents: Math.round((parseFloat(payout) || 0) * 100),
```
Add an input in the grid (next to Weight/Cap):
```tsx
        <div><label className={L}>Payout/call ($, 0=use word value)</label><input className={F} value={payout} onChange={(e) => setPayout(e.target.value)} /></div>
```
- [ ] **Step 2:** `npx tsc --noEmit` (zero from BuyerPanel) + `npm test` green.
- [ ] **Step 3:** Commit `feat(static): buyer payout/call field in admin UI (Phase 3)`.

---

### Task 5: Call Reports store + page + button

**Files:** Create `src/lib/static/report.ts` (+ test), `src/app/dashboard/static/calls/page.tsx`; modify `src/app/dashboard/static/page.tsx`.

**Interfaces:** `staticCallReport(limit?: number): Promise<CallRow[]>` where `CallRow = { id, createdAt, moneyWord, state, toNumber, fromNumber, forwardedTo, disposition, durationSec, priceCents, costCents }`.

- [ ] **Step 1 (report.ts):**
```ts
import { db } from "@/lib/db";

export type CallRow = {
  id: string; createdAt: Date; moneyWord: string; state: string; toNumber: string;
  fromNumber: string; forwardedTo: string; disposition: string; durationSec: number;
  priceCents: number; costCents: number;
};

// Static calls only (disposition starts with "static"), newest first.
export async function staticCallReport(limit = 500): Promise<CallRow[]> {
  const rows = await db.call.findMany({ where: { disposition: { startsWith: "static" } }, orderBy: { createdAt: "desc" }, take: limit });
  return rows.map((c) => ({
    id: c.id, createdAt: c.createdAt, moneyWord: c.moneyWord || "", state: c.state, toNumber: c.toNumber,
    fromNumber: c.fromNumber, forwardedTo: c.forwardedTo, disposition: c.disposition, durationSec: c.durationSec,
    priceCents: c.priceCents, costCents: c.costCents,
  }));
}

// Color band for a call duration (seconds): red 0-30, yellow 31-90, green 91+.
export function durationBand(sec: number): "red" | "yellow" | "green" {
  if (sec <= 30) return "red";
  if (sec <= 90) return "yellow";
  return "green";
}
```
- [ ] **Step 2 (report.test.ts):** create 3 `Call` rows with `disposition: "static"` and durations 10 / 60 / 120 + one `disposition: "u65"` (must be EXCLUDED); assert `staticCallReport()` returns only the 3 static rows newest-first, and `durationBand(10)==="red"`, `durationBand(60)==="yellow"`, `durationBand(120)==="green"`. Self-clean: delete the created calls in `afterEach` (track their ids).
- [ ] **Step 3 (calls/page.tsx):** God-only page rendering a table. Duration cell colored via `durationBand` → `text-[var(--danger)]` (red) / `text-[var(--gold)]` (yellow) / `text-[color:#3fb950]` (green). Money in `usd2`. Timestamp via `toLocaleString`. Columns: Time · Money Word · State · To # · From # · Landed (forwardedTo) · Duration · Paid · Cost.
```tsx
import { redirect } from "next/navigation";
import { getSession, isGod } from "@/lib/auth";
import { staticCallReport, durationBand } from "@/lib/static/report";
import { usd2 } from "@/lib/format";
import { Card, Section } from "@/components/ui";

export const dynamic = "force-dynamic";
const DUR: Record<string, string> = { red: "text-[var(--danger)]", yellow: "text-[var(--gold)]", green: "text-[color:#3fb950]" };

export default async function StaticCallsPage() {
  const session = await getSession();
  if (!isGod(session)) redirect("/dashboard");
  const rows = await staticCallReport();
  return (
    <div className="space-y-6">
      <Section title="Static — Call Reports" action={<a className="text-sm text-[var(--gold)]" href="/dashboard/static">← Money Words</a>}>
        <Card>
          <div className="text-xs text-[var(--muted)] mb-3">Static-engine calls, newest first. Duration: <span className="text-[var(--danger)]">0–30s</span> · <span className="text-[var(--gold)]">31–90s</span> · <span className="text-[color:#3fb950]">91s+</span>.</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[var(--muted)] text-xs uppercase">
                <th className="py-1 pr-3">Time</th><th className="pr-3">Money Word</th><th className="pr-3">State</th><th className="pr-3">To #</th><th className="pr-3">From #</th><th className="pr-3">Landed</th><th className="pr-3">Duration</th><th className="pr-3">Paid</th><th className="pr-3">Cost</th>
              </tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={9} className="py-3 text-[var(--muted)]">No Static calls yet.</td></tr>}
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--border)]">
                    <td className="py-1 pr-3 whitespace-nowrap">{r.createdAt.toLocaleString()}</td>
                    <td className="pr-3">{r.moneyWord || "—"}</td>
                    <td className="pr-3">{r.state || "—"}</td>
                    <td className="pr-3 font-mono">{r.toNumber}</td>
                    <td className="pr-3 font-mono">{r.fromNumber}</td>
                    <td className="pr-3 font-mono">{r.forwardedTo || (r.disposition === "static-nobuyer" ? "no buyer" : "—")}</td>
                    <td className={`pr-3 font-semibold ${DUR[durationBand(r.durationSec)]}`}>{r.durationSec}s</td>
                    <td className="pr-3">{usd2(r.priceCents)}</td>
                    <td className="pr-3 text-[var(--muted)]">{usd2(r.costCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>
    </div>
  );
}
```
- [ ] **Step 4 (page.tsx):** add a prominent green button linking to the report, at the top of the returned `<div className="space-y-6">`:
```tsx
      <a href="/dashboard/static/calls" className="inline-block rounded-md bg-[color:#238636] hover:bg-[color:#2ea043] text-white font-semibold px-4 py-2">Call Reports</a>
```
- [ ] **Step 5:** `npx vitest run src/lib/static/report.test.ts` + `npx tsc --noEmit` (zero from the new files + page) + `npm test` green.
- [ ] **Step 6:** Commit `feat(static): Call Reports page + green button + duration color bands (Phase 3)`.

---

### Task 6: No-buyer health-insurance upgrade offer + fallback setting

**Files:** Create `src/lib/static/settings.ts` (+ test), `src/app/api/static/settings/route.ts`; modify `src/app/api/voice/static-step/route.ts`, `src/app/dashboard/static/page.tsx`.

**Interfaces:** `getHealthFallbackNumber(): Promise<string>`, `setHealthFallbackNumber(v: string): Promise<void>` over Setting `staticHealthFallbackNumber`.

- [ ] **Step 1 (settings.ts):** mirror `src/lib/static/engine.ts` (Setting read/write):
```ts
import { db } from "@/lib/db";
const KEY = "staticHealthFallbackNumber";
export async function getHealthFallbackNumber(): Promise<string> {
  const row = await db.setting.findUnique({ where: { key: KEY } });
  return row?.value ?? "";
}
export async function setHealthFallbackNumber(v: string): Promise<void> {
  await db.setting.upsert({ where: { key: KEY }, update: { value: v.trim() }, create: { key: KEY, value: v.trim() } });
}
```
- [ ] **Step 2 (settings.test.ts):** integration — set to "+15551239999", read back equals it, then reset to "" (afterAll cleanup deletes the key).
- [ ] **Step 3 (api/static/settings/route.ts):** god-gated GET → `{ healthFallbackNumber }`; POST `{ healthFallbackNumber }` → set. Same `guard()` pattern as `/api/static/engine`.
- [ ] **Step 4 (static-step no-buyer offer):** replace the current no-buyer block in `routeLeaf` with an OFFER, and add an `offer` phase. In `routeLeaf`, when `pickBuyerFor` returns null:
```ts
  if (!res) {
    await captureCallback({ moneyWordId: leafId, word: node?.word || "", state: call.state || "", zip: call.zip || "", phone: call.fromNumber || "", note: "no buyer in area" });
    await db.call.update({ where: { id: callId }, data: { disposition: "static-nobuyer", moneyWord: node?.word || leafId } }).catch(() => {});
    return xml(gather(step("offer", callId), voice, `We're sorry, we don't have a professional in your area for ${esc(node?.word || "that")}. Would you like to compare private individual health insurance quotes to save time and money while we have you on the line? Say yes or no.`));
  }
```
Add the `offer` phase in `POST` (near the other phases). On yes → fallback number if set, else route PHI buyers; on no → sorry + hangup:
```ts
  if (phase === "offer") {
    const yes = /\byes|yeah|sure|ok|okay|please\b/i.test(speech) || digit === "1";
    if (!yes) {
      return xml(`<Say voice="${voice}">Sorry, we cannot help. We'll contact you when we have a money word available. Have a great day.</Say><Hangup/>`);
    }
    const fallback = await getHealthFallbackNumber();
    if (fallback) return xml(await transfer(callId, fallback, voice, "health-fallback", 0));
    // else route into the Private Health Insurance money word's buyers
    const phi = await db.staticMoneyWord.findFirst({ where: { word: "Private Health Insurance", parentId: null } });
    if (phi) {
      const r = await pickBuyerFor(phi.id, { zip: call.zip || undefined }, Date.now());
      if (r) {
        await db.call.update({ where: { id: callId }, data: { moneyWord: "Private Health Insurance" } }).catch(() => {});
        return xml(await transfer(callId, r.number, voice, r.buyerId, r.payoutCents > 0 ? r.payoutCents : (phi.valueCents || 0)));
      }
    }
    return xml(`<Say voice="${voice}">Sorry, we cannot help. We'll contact you when we have a money word available. Have a great day.</Say><Hangup/>`);
  }
```
(Import `getHealthFallbackNumber` from `@/lib/static/settings`.)
- [ ] **Step 5 (page.tsx fallback control):** add a small God input to set the fallback number. A tiny client component `FallbackNumber.tsx` (fetch GET/POST `/api/static/settings`) rendered on the static page, OR a compact form. Keep it minimal:
Create `src/components/static/FallbackNumber.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
export default function FallbackNumber() {
  const [val, setVal] = useState(""); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  useEffect(() => { fetch("/api/static/settings").then((r) => r.json()).then((d) => setVal(d.healthFallbackNumber || "")).catch(() => {}); }, []);
  const save = async () => {
    setBusy(true); setMsg("");
    try { const r = await fetch("/api/static/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ healthFallbackNumber: val }) }); if (!r.ok) throw new Error(); setMsg("Saved"); }
    catch { setMsg("Failed"); } finally { setBusy(false); }
  };
  return (
    <div className="flex items-end gap-2 text-sm">
      <div><label className="block text-xs uppercase text-[var(--muted)] mb-1">Health-insurance fallback # (blank = route to PHI buyers)</label>
        <input className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1" value={val} onChange={(e) => setVal(e.target.value)} placeholder="+15551239999" /></div>
      <button className="btn" disabled={busy} onClick={save}>Save</button>
      {msg && <span className="text-[var(--muted)]">{msg}</span>}
    </div>
  );
}
```
Render `<FallbackNumber />` inside a small `<Section title="No-buyer fallback">` on `page.tsx`.
- [ ] **Step 6:** `npx vitest run src/lib/static/settings.test.ts` + `npx tsc --noEmit` (zero from new/modified) + `npm test` green.
- [ ] **Step 7:** Commit `feat(static): no-buyer health-insurance offer + fallback number setting (Phase 3)`.

---

### Task 7: Full test + isolated build + deploy prep

- [ ] `npm test` all green.
- [ ] Isolated worktree build (2A pattern) → exit 0, `Compiled successfully`, `/dashboard/static/calls` + `/api/static/settings` in manifest.
- [ ] Deploy (controller, additive): `static_buyer.payoutCents` via raw SQL `ALTER TABLE "static_buyer" ADD COLUMN IF NOT EXISTS "payoutCents" INTEGER NOT NULL DEFAULT 0;`; rsync the changed runtime files; `npx prisma generate` on box; build-before-restart; verify dormant + report page god-gated (307).

## Self-Review

**Coverage:** revenue default+override (Tasks 1-3), buyer payout UI (Task 4), Call Reports with all requested columns + red/yellow/green duration (Task 5), no-buyer offer default→PHI + upgrade→fixed number + polite hangup (Task 6), fallback-number God control (Task 6). Duration source = `Call.durationSec` from the existing status callback the Static transfer already targets. Report Static-only via `disposition LIKE static%`.
**Deferred (later):** geo-radius ZIP, Twilio test numbers, follow-up SMS, training game, agent/manager deflection.
**Types:** `pickBuyerFor` return gains `payoutCents` (Tasks 2/3/6 consistent); `CallRow`/`durationBand` shared by report + page; `getHealthFallbackNumber`/`setHealthFallbackNumber` used by route + static-step + control.
