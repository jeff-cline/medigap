# Static Dashboard — Phase 3.2 Plan (Buyers on Any Tab · Twilio Webhook Hardening)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Let every money-word tab (leaf OR category) manage buyers and route calls to them; and harden the Twilio webhooks — validate the request signature on the Static voice webhook (protects the forgeable billing params) and allowlist the recording URL on the shared status webhook (without risking the live Fluid flow).

**Architecture:** New `hasActiveBuyers(moneyWordId)`; the Static intake routes a selected node to its buyers when it has active buyers, else shows the sub-menu (if children), else the no-buyer offer — replacing the leaf-only rule. `BuyerPanel` shows on every node. A pure `twilio-verify` helper (HMAC-SHA1, node crypto) gates `/api/voice/static-step` (fail-open only when no auth token is configured). `/api/calls/status` accepts a recording URL only from Twilio's domain. Voice changes dormant behind `activeEngine==="static"`.

**Tech Stack:** Next.js 16 App Router, Prisma/SQLite dev + Postgres prod, Twilio TwiML, node `crypto`, Vitest.

## Global Constraints

- DORMANT: routing/voice changes run only at `activeEngine==="static"`.
- Buyer precedence (NEW rule, replaces "only leaf routes"): when a caller selects a node, if it `hasActiveBuyers` → route to its buyers (terminal); else if it has active children → present the sub-menu; else → the no-buyer health-insurance offer. `hasActiveBuyers(id)` = at least one `StaticBuyer` for that node with `active=true` AND a non-blank `defaultNumber`.
- Every tab (leaf or category) shows the `BuyerPanel` in the config editor. For a node that ALSO has sub-tabs, show a one-line note that buyers take precedence over the sub-menu.
- Twilio signature validation (`/api/voice/static-step`): compute Twilio's HMAC-SHA1 over the PUBLIC URL (`https://medigap.plus` + path + query) + alphabetically-sorted POST params, base64; timing-safe compare to the `X-Twilio-Signature` header. **Fail-OPEN only when no `authToken` is configured** (so nothing breaks pre-setup); when a token IS set, reject invalid/missing signatures with 403. Auth token from `getTwilioCfg()` (`@/lib/sms`).
- `/api/calls/status` (SHARED with live Fluid — do NOT add request-signature gating here): only accept `RecordingUrl` if it starts with `https://api.twilio.com/` (else store `""`). This is the ONLY change to that file; the rest (status/duration writes) is untouched, so the Fluid flow is unaffected.
- Additive/no-Fluid-logic changes beyond the recording allowlist; reuse `getTwilioCfg` (`@/lib/sms`), `db` (`@/lib/db`). Prisma sqlite dev. Tests colocated; `npm test`.

## File Structure

- `src/lib/static/buyers.ts` — **modify**: add `hasActiveBuyers(moneyWordId)`.
- `src/lib/static/buyers.test.ts` — **modify**: test `hasActiveBuyers`.
- `src/app/api/voice/static-step/route.ts` — **modify**: buyer-precedence selection; Twilio signature gate.
- `src/components/static/StaticControls.tsx` — **modify**: BuyerPanel on every node.
- `src/lib/twilio-verify.ts` — **create**: pure signature computation + request verifier.
- `src/lib/twilio-verify.test.ts` — **create**: known-vector test.
- `src/app/api/calls/status/route.ts` — **modify**: recording-URL allowlist.

---

### Task 1: `hasActiveBuyers` + buyer-precedence routing

**Files:** Modify `src/lib/static/buyers.ts`, `src/lib/static/buyers.test.ts`, `src/app/api/voice/static-step/route.ts`.

**Interfaces:** `hasActiveBuyers(moneyWordId: string): Promise<boolean>`.

- [ ] **Step 1 (buyers.ts):**
```ts
export async function hasActiveBuyers(moneyWordId: string): Promise<boolean> {
  const n = await db.staticBuyer.count({ where: { moneyWordId, active: true, NOT: { defaultNumber: "" } } });
  return n > 0;
}
```
- [ ] **Step 2 (buyers.test.ts):** add a test — a leaf with no buyers → false; after `createBuyer` with a defaultNumber → true; after `updateBuyer` setting `active:false` → false; a buyer with blank defaultNumber → false. Reuse the self-cleaning pattern.
- [ ] **Step 3 (static-step):** import `hasActiveBuyers` from `@/lib/static/buyers`. In the `menu` and `submenu` phases, replace the current "`kids.length>0` → submenu else finishLeaf" decision with buyer-precedence. Currently menu does:
```ts
    const kids = await childMenu(hitId);
    if (kids.length > 0) { await db.call.update(...moneyWord: hitId...); return xml(gather(step("submenu",...), voice, buildMenuPrompt(kids))); }
    return finishLeaf(callId, hitId, voice, call);
```
Change both `menu` and `submenu` to:
```ts
    if (await hasActiveBuyers(hitId)) return finishLeaf(callId, hitId, voice, call);
    const kids = await childMenu(hitId);
    if (kids.length > 0) { await db.call.update({ where: { id: callId }, data: { moneyWord: hitId } }).catch(() => {}); await logTurn(callId, "bot", buildMenuPrompt(kids)); return xml(gather(step("submenu", callId), voice, buildMenuPrompt(kids))); }
    return finishLeaf(callId, hitId, voice, call);
```
(so buyers win; else sub-menu; else the leaf/no-buyer path). `finishLeaf`→`routeLeaf` already routes to buyers or the no-buyer offer; no change needed there.
- [ ] **Step 4:** `npx vitest run src/lib/static/buyers.test.ts` + `npx tsc --noEmit` (zero from the 2 files) + `npm test` green.
- [ ] **Step 5:** Commit `feat(static): buyers routable on any node (buyer-precedence over sub-menu) (Phase 3.2)`.

---

### Task 2: BuyerPanel on every tab

**Files:** Modify `src/components/static/StaticControls.tsx`.

- [ ] **Step 1:** In `NodeForm`, replace the leaf-gated block:
```tsx
      {isLeaf
        ? <BuyerPanel moneyWordId={row.id} />
        : <div className="text-xs text-[var(--muted)] mb-3">This is a <b>category</b> (has sub-tabs) — only leaf money words route to buyers.</div>}
```
with (buyers on every node + an accurate note when it also has sub-tabs):
```tsx
      {!isLeaf && <div className="text-xs text-[var(--muted)] mb-2">This tab has sub-tabs. If you add buyers here, callers route to the <b>buyers</b>; with no buyers they hear the sub-tab menu.</div>}
      <BuyerPanel moneyWordId={row.id} />
```
(`isLeaf` is still passed in and now only drives the note. Keep everything else — Save config button, Phase-4 note — unchanged.)
- [ ] **Step 2:** `npx tsc --noEmit` (zero from StaticControls) + `npm test` green.
- [ ] **Step 3:** Commit `feat(static): buyer management on every tab (leaf or category) (Phase 3.2)`.

---

### Task 3: Twilio signature verifier + gate the Static webhook

**Files:** Create `src/lib/twilio-verify.ts` + `src/lib/twilio-verify.test.ts`; modify `src/app/api/voice/static-step/route.ts`.

**Interfaces:** `twilioSignature(authToken, url, params): string`; `verifyTwilioRequest(req: NextRequest, params: Record<string,string>): Promise<boolean>`.

- [ ] **Step 1 (twilio-verify.ts):**
```ts
import crypto from "crypto";
import { NextRequest } from "next/server";
import { getTwilioCfg } from "@/lib/sms";

const BASE = "https://medigap.plus";

// Twilio's algorithm: HMAC-SHA1( url + concat(sortedKey+value) ) with the auth token, base64.
export function twilioSignature(authToken: string, url: string, params: Record<string, string>): string {
  let data = url;
  for (const k of Object.keys(params).sort()) data += k + params[k];
  return crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a); const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

// Returns true if the request is a valid Twilio request.
// FAIL-OPEN only when no auth token is configured (pre-setup); otherwise a valid signature is required.
export async function verifyTwilioRequest(req: NextRequest, params: Record<string, string>): Promise<boolean> {
  const { authToken } = await getTwilioCfg();
  if (!authToken) return true; // not configured → don't block
  const sig = req.headers.get("x-twilio-signature") || "";
  if (!sig) return false;
  const url = BASE + req.nextUrl.pathname + req.nextUrl.search;
  return safeEqual(twilioSignature(authToken, url, params), sig);
}
```
- [ ] **Step 2 (twilio-verify.test.ts):** test `twilioSignature` against Twilio's published vector:
```ts
import { describe, it, expect } from "vitest";
import { twilioSignature } from "./twilio-verify";

describe("twilioSignature", () => {
  it("matches Twilio's canonical example", () => {
    const url = "https://mycompany.com/myapp.php?foo=1&bar=2";
    const params = { Digits: "1234", To: "+18005551212", From: "+14158675310", Caller: "+14158675310", CallSid: "CA1234567890ABCDE" };
    expect(twilioSignature("12345", url, params)).toBe("0/KCTR6DLpKmkAf8muzZqo1nDgQ=");
  });
});
```
- [ ] **Step 3 (static-step):** at the top of `POST`, after building the form, collect the POST params into a string map and verify BEFORE any work:
```ts
  const form = await req.formData().catch(() => null);
  const params: Record<string, string> = {};
  if (form) for (const [k, v] of form.entries()) params[k] = String(v);
  const { verifyTwilioRequest } = await import("@/lib/static/../twilio-verify"); // or a normal top import
  if (!(await verifyTwilioRequest(req, params))) {
    return new Response("forbidden", { status: 403 });
  }
```
Prefer a normal top-of-file import: `import { verifyTwilioRequest } from "@/lib/twilio-verify";` and call it right after the `form` is parsed (the existing code reads `speech`/`digit` from `form` — keep those; just add the params map + the guard before the phase logic). Do NOT change any phase logic.
- [ ] **Step 4:** `npx vitest run src/lib/twilio-verify.test.ts` + `npx tsc --noEmit` (zero from the new + modified files) + `npm test` green.
- [ ] **Step 5:** Commit `feat(static): validate Twilio signature on the Static voice webhook (Phase 3.2)`.

---

### Task 4: Recording-URL allowlist on the shared status webhook

**Files:** Modify `src/app/api/calls/status/route.ts`.

- [ ] **Step 1:** Change the recording capture to only accept Twilio-domain URLs (the ONLY change — leave status/duration writes exactly as-is):
```ts
  const recordingUrlRaw = String(form?.get("RecordingUrl") || "");
  const recordingUrl = recordingUrlRaw.startsWith("https://api.twilio.com/") ? recordingUrlRaw : "";
```
Keep `if (recordingUrl) data.recordingUrl = recordingUrl;` as-is. Do NOT add signature gating here (this endpoint serves the live Fluid flow).
- [ ] **Step 2:** `npx tsc --noEmit` (zero from status route) + `npm test` green.
- [ ] **Step 3:** Commit `fix(calls): only accept Twilio-domain recording URLs on the status webhook (Phase 3.2)`.

---

### Task 5: Full test + isolated build + deploy

- [ ] `npm test` green (buyers, twilio-verify vector).
- [ ] Isolated worktree build → exit 0.
- [ ] Deploy (controller, additive — NO schema change this phase): rsync the changed runtime files (`buyers.ts`, `static-step/route.ts`, `StaticControls.tsx`, `twilio-verify.ts`, `calls/status/route.ts`); build-before-restart; verify site 200 + report/detail god-gated + inbound POST 200 (dormant). Manual: God can add buyers to any tab (e.g. "Save Money").

## Self-Review

**Coverage:** buyers on any tab (Task 2 UI + Task 1 routing precedence via `hasActiveBuyers`), Twilio signature validation on the Static webhook (Task 3, fail-open pre-setup), recording-URL allowlist on the shared status webhook (Task 4, no request-gating risk to Fluid).
**Rule change:** "only leaf routes" → "buyers-precedence": buyers > sub-menu > no-buyer offer. `{money words list}` (top-level enabled, in order) unchanged.
**Isolation:** the only shared-file change is the `calls/status` recording allowlist (a pure string check, additive-safe for Fluid). No schema change. Voice changes dormant.
**Deferred:** geo-radius ZIP, Twilio test numbers, follow-up SMS, training game.
**Pre-flip note:** with a Twilio auth token configured, `/api/voice/static-step` now rejects unsigned requests — verify the public-URL reconstruction (`https://medigap.plus`+path+query) matches how the webhook is configured before flip-live.
