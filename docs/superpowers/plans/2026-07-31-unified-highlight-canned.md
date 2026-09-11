# Unified Inbox — Highlight→Canned + Green Keyword Highlighting — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** On `/dashboard/unified`, let a user highlight a keyword in a received text, write a reply, and hit **Can & Send** — which sends the reply to that person AND saves the highlighted text as a canned keyword (so future matching texts auto-answer). Also: highlight any known canned keyword **green** in the displayed messages so it's visible what's covered.

**Architecture:** A pure `highlightKeywords(body, keywords)` helper (tested) for the green rendering; a staff-gated `POST /api/inbox/can-and-send` (create canned + send reply in one call); and `UnifiedComms.tsx` gains selection capture, a "Can & Send" action, and green keyword rendering in message bubbles.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind, Prisma, Vitest.

## Global Constraints

- Green highlight: in every displayed message body (inbound AND outbound), any substring matching an ACTIVE canned keyword renders with a green background (case-insensitive). Keyword set = all active canneds' parsed `keywords` arrays.
- Highlight→canned: the user selects text inside the messages pane → that becomes the candidate keyword (shown, editable/clearable). "Can & Send" requires a selected keyword + a non-empty reply body.
- **Can & Send** = ONE action: (1) create a `CannedResponse` with `keywords:[selectedKeyword.toLowerCase()]`, `reply:<body>`, active; (2) send the reply to the consumer via `sendReply` (from the thread's ourNumber). The canned is SAVED even if the send fails (the keyword mapping is still wanted); the response reports both results so the UI can surface a send failure.
- Reuse existing: `matchCanned`-style substring semantics (keyword contained in body, case-insensitive). `cannedCreate` + `sendReply` from `@/lib/inbox`. Staff-gate the new route (`["god","marketing","accounting","assistant"]`, 403).
- No schema change. Tests colocated; `npm test`. The highlight helper is pure + TDD.

## File Structure

- `src/lib/highlight.ts` — **create**: `highlightKeywords(body, keywords)` (pure) (+ test).
- `src/app/api/inbox/can-and-send/route.ts` — **create**: staff-gated create-canned + send.
- `src/components/comms/UnifiedComms.tsx` — **modify**: green rendering + selection capture + Can & Send.

---

### Task 1: `highlightKeywords` pure helper

**Files:** Create `src/lib/highlight.ts` + `src/lib/highlight.test.ts`.

**Interfaces:** `highlightKeywords(body: string, keywords: string[]): { text: string; hit: boolean }[]` — split `body` into consecutive segments; a segment with `hit:true` is a case-insensitive match of one of `keywords` (longest keywords matched first; overlapping matches not double-counted). Non-matching text is emitted as `hit:false` segments. Empty/blank keywords are ignored. Returns `[{text: body, hit:false}]` when no keywords.

- [ ] **Step 1: Failing test** — `src/lib/highlight.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { highlightKeywords } from "./highlight";

const join = (segs: { text: string; hit: boolean }[]) => segs.map((s) => (s.hit ? `[${s.text}]` : s.text)).join("");

describe("highlightKeywords", () => {
  it("wraps a case-insensitive keyword match", () => {
    expect(join(highlightKeywords("My food card is broken", ["food card"]))).toBe("My [food card] is broken");
    expect(join(highlightKeywords("Please CALL ME back", ["call me"]))).toBe("Please [CALL ME] back");
  });
  it("preserves the original casing of the matched text", () => {
    const segs = highlightKeywords("Talk to an AGENT now", ["agent"]);
    expect(segs.find((s) => s.hit)?.text).toBe("AGENT");
  });
  it("matches the longest keyword when several overlap", () => {
    expect(join(highlightKeywords("food spending card issue", ["card", "food spending card"]))).toBe("[food spending card] issue");
  });
  it("handles multiple matches", () => {
    expect(join(highlightKeywords("agent, human please", ["agent", "human"]))).toBe("[agent], [human] please");
  });
  it("returns one non-hit segment when no keywords / no match", () => {
    expect(highlightKeywords("nothing here", [])).toEqual([{ text: "nothing here", hit: false }]);
    expect(highlightKeywords("nothing here", ["zzz"])).toEqual([{ text: "nothing here", hit: false }]);
  });
  it("ignores blank keywords", () => {
    expect(join(highlightKeywords("hello", ["", "  "]))).toBe("hello");
  });
});
```

- [ ] **Step 2: Run → FAIL** — `npx vitest run src/lib/highlight.test.ts`.

- [ ] **Step 3: Implement `src/lib/highlight.ts`:**
```ts
export type Seg = { text: string; hit: boolean };

function esc(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// Split body into consecutive segments; hit=true segments are case-insensitive matches
// of one of the keywords (longest first). Preserves the original casing of matches.
export function highlightKeywords(body: string, keywords: string[]): Seg[] {
  const kws = [...new Set(keywords.map((k) => (k || "").trim()).filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!body) return [{ text: "", hit: false }];
  if (kws.length === 0) return [{ text: body, hit: false }];
  const re = new RegExp(kws.map(esc).join("|"), "gi");
  const segs: Seg[] = [];
  let last = 0;
  for (const m of body.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) segs.push({ text: body.slice(last, i), hit: false });
    segs.push({ text: m[0], hit: true });
    last = i + m[0].length;
  }
  if (last < body.length) segs.push({ text: body.slice(last), hit: false });
  return segs.length ? segs : [{ text: body, hit: false }];
}
```

- [ ] **Step 4: Run → PASS**; `npm test` green.
- [ ] **Step 5: Commit** — `git add src/lib/highlight.ts src/lib/highlight.test.ts && git commit -m "feat(comms): highlightKeywords helper for green keyword rendering"`.

---

### Task 2: `POST /api/inbox/can-and-send`

**Files:** Create `src/app/api/inbox/can-and-send/route.ts`.

- [ ] **Step 1: Implement**
```ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cannedCreate, sendReply } from "@/lib/inbox";

const STAFF = ["god", "marketing", "accounting", "assistant"];

// Save the highlighted text as a canned keyword AND send the reply now.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !STAFF.includes(s.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({} as any));
  const keyword = String(b.keyword || "").trim();
  const body = String(b.body || "").trim();
  const sender = String(b.sender || "");
  const ourNumber = String(b.ourNumber || "");
  if (!keyword || !body || !sender) return NextResponse.json({ error: "keyword, body and sender are required" }, { status: 400 });

  // 1) Save the canned (keyword mapping is wanted regardless of send outcome).
  let saved = false;
  try { await cannedCreate({ label: keyword, keywords: [keyword], reply: body }); saved = true; } catch { saved = false; }
  // 2) Send the reply now.
  const sent = await sendReply({ sender, ourNumber, body, leadId: b.leadId ?? null });
  return NextResponse.json({ saved, sent: sent.ok, error: sent.ok ? undefined : sent.error });
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit` (zero from the route) + `npm test` green.
- [ ] **Step 3: Commit** — `git add src/app/api/inbox/can-and-send/route.ts && git commit -m "feat(comms): can-and-send route (save canned + send reply)"`.

---

### Task 3: UnifiedComms — green rendering + selection + Can & Send

**Files:** Modify `src/components/comms/UnifiedComms.tsx`.

- [ ] **Step 1: Green keyword rendering.** Build the active keyword set from the `canned` prop (parse each active canned's `keywords` JSON, flatten, lowercase, dedupe) — memoized. Add a small render helper inside the component that maps a message body through `highlightKeywords(body, activeKeywords)` and renders `hit` segments in a green span (e.g. `className="bg-[color:#12351f] text-[color:#3fb950] rounded px-0.5"`) and non-hit segments as plain text. Replace the plain `{m.body}` render in the message bubbles with this. Import `highlightKeywords` from `@/lib/highlight`.

- [ ] **Step 2: Selection capture.** On the messages-pane container, add `onMouseUp={captureSelection}` where `captureSelection` reads `window.getSelection()?.toString().trim()` and, if non-empty, sets a `selectedKeyword` state. Show a small chip near the composer: `Keyword: "<selectedKeyword>" ✕` (✕ clears it). Keep it simple.

- [ ] **Step 3: "Can & Send" button.** In the composer, next to Send, add a **Can & Send** button, disabled unless `selectedKeyword` AND the reply `body` are non-empty. On click, via the existing robust `run()` wrapper: `POST /api/inbox/can-and-send { sender, ourNumber, body, leadId, keyword: selectedKeyword }`; on the response, if `!json.sent` surface a note ("Saved as canned; reply could not send from that number"), else clear the composer + selectedKeyword; always `router.refresh()` (so the new canned's keyword starts rendering green). Keep the plain **Send** button as-is (send only, no save).

- [ ] **Step 4: Verify** — `npx tsc --noEmit` (zero from UnifiedComms.tsx; unrelated followup/ WIP ignored) + `npm test` green.
- [ ] **Step 5: Commit** — `git add src/components/comms/UnifiedComms.tsx && git commit -m "feat(comms): highlight→Can&Send + green keyword rendering in the unified inbox"`.

---

### Task 4: Full test + isolated build + deploy

- [ ] `npm test` green.
- [ ] Isolated build → exit 0, `/api/inbox/can-and-send` in manifest.
- [ ] Deploy (controller, additive, NO schema change): rsync `src/lib/highlight.ts`, `src/app/api/inbox/can-and-send/route.ts`, `src/components/comms/UnifiedComms.tsx`; build-before-restart; verify site 200 + `/api/inbox/can-and-send` 403 anon + `/dashboard/unified` 307. Manual: highlight a word in a text → Can & Send → reply goes out + a new canned appears + the word renders green thereafter.

## Self-Review

**Coverage:** highlight a keyword (Task 3 selection) → Create canned + Can & Send (Task 2 route: saves canned + sends) → future auto-answer (existing matchCanned in the inbound handler picks up the new canned) → green rendering of known keywords (Tasks 1/3). Save-even-if-send-fails handled. No schema change.
**Types:** `Seg`/`highlightKeywords` shared by helper + component; the route reuses `cannedCreate`/`sendReply`.
**Deferred:** editing a keyword's casing before save (uses the raw highlight); multi-keyword-per-canned from a single highlight (one keyword per Can & Send — add more via the canned manager).
