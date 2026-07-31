# Dashboard Notifications Button — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** A round notifications button in the dashboard top header (next to the Fluid⇄Static toggle) showing: outstanding unified texts to respond to, live calls, and calls today / this week / this month / total — auto-refreshing.

**Architecture:** A `notificationCounts()` lib (CST day/week/month boundaries, pure-testable given `now`), a staff-gated `GET /api/notifications`, and a client `Notifications` bell+badge+popover that polls the API, wired into `dashboard/layout.tsx` for all staff.

**Tech Stack:** Next.js 16 App Router, Prisma/SQLite dev + Postgres prod, Vitest. `@/`→`src/`.

## Global Constraints

- Counts (all from existing models, no schema change):
  - **textsOutstanding** = `SmsMessage` where `direction:"inbound"` AND `readAt:null` (unread inbound in the unified inbox).
  - **liveCalls** = `Call` where `status ∈ {"in-progress","ringing","connected","transferring"}` AND `createdAt` within the last 3 hours (recency guard so a Twilio-never-completed call can't inflate the count forever).
  - **callsToday/Week/Month** = `Call` count with `createdAt >= start of today / week (Sunday) / month`, boundaries in **America/Chicago** (box is UTC; user is CST).
  - **callsTotal** = `Call` count (all).
- `GET /api/notifications` is staff-gated: `getSession()` + role ∈ `["god","marketing","accounting","assistant"]` (else 403). Returns the 6 counts as JSON.
- The button renders for all staff (the layout already gates to staff). It sits in the header row with the engine toggle. Poll every 45s. The badge shows `textsOutstanding` (red) when > 0.
- No schema change. Reuse `db` (`@/lib/db`), `getSession` (`@/lib/auth`). Tests colocated; `npm test`. The boundary helper is pure (takes `now: Date`) and TDD-tested.

## File Structure

- `src/lib/notifications.ts` — **create**: `cstStartOf(now, unit)` (pure) + `notificationCounts()` (DB).
- `src/lib/notifications.test.ts` — **create**: boundary + counts tests.
- `src/app/api/notifications/route.ts` — **create**: staff-gated GET.
- `src/components/dash/Notifications.tsx` — **create**: bell + badge + popover, polls the API.
- `src/app/dashboard/layout.tsx` — **modify**: render `<Notifications />` in the header row.

---

### Task 1: Counts lib + CST boundaries (`src/lib/notifications.ts`)

**Files:** Create `src/lib/notifications.ts` + `src/lib/notifications.test.ts`.

**Interfaces:**
- `type Counts = { textsOutstanding: number; liveCalls: number; today: number; week: number; month: number; total: number }`
- `cstStartOf(now: Date, unit: "day" | "week" | "month"): Date` — the UTC instant of the start of the current CST day / week (Sunday 00:00 CST) / month (1st 00:00 CST).
- `notificationCounts(now?: Date): Promise<Counts>`

- [ ] **Step 1: Write the failing test** — `src/lib/notifications.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { cstStartOf } from "./notifications";

describe("cstStartOf", () => {
  it("start of day = CST/CDT midnight as a UTC instant", () => {
    // 2026-07-15 18:00 UTC = 2026-07-15 13:00 CDT (UTC-5). Start of that CDT day = 2026-07-15 05:00 UTC.
    const now = new Date(Date.UTC(2026, 6, 15, 18, 0, 0));
    expect(cstStartOf(now, "day").toISOString()).toBe("2026-07-15T05:00:00.000Z");
  });
  it("winter uses CST (UTC-6)", () => {
    // 2026-01-15 18:00 UTC = 12:00 CST. Start of day = 2026-01-15 06:00 UTC.
    const now = new Date(Date.UTC(2026, 0, 15, 18, 0, 0));
    expect(cstStartOf(now, "day").toISOString()).toBe("2026-01-15T06:00:00.000Z");
  });
  it("start of week = most recent Sunday 00:00 CST", () => {
    // 2026-07-15 is a Wednesday. Sunday 2026-07-12 00:00 CDT = 2026-07-12 05:00 UTC.
    const now = new Date(Date.UTC(2026, 6, 15, 18, 0, 0));
    expect(cstStartOf(now, "week").toISOString()).toBe("2026-07-12T05:00:00.000Z");
  });
  it("start of month = 1st 00:00 CST", () => {
    const now = new Date(Date.UTC(2026, 6, 15, 18, 0, 0));
    expect(cstStartOf(now, "month").toISOString()).toBe("2026-07-01T05:00:00.000Z");
  });
});
```

- [ ] **Step 2: Run — expect FAIL** — `npx vitest run src/lib/notifications.test.ts` (module missing).

- [ ] **Step 3: Implement `src/lib/notifications.ts`**

```ts
import { db } from "@/lib/db";

export type Counts = { textsOutstanding: number; liveCalls: number; today: number; week: number; month: number; total: number };

// Offset (minutes) of America/Chicago at the given instant: wall-clock-as-UTC minus real UTC (negative, west).
function chicagoOffsetMin(dt: Date): number {
  const s = dt.toLocaleString("en-US", { timeZone: "America/Chicago", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const [datePart, timePart] = s.split(", ");
  const [mo, da, yr] = datePart.split("/").map(Number);
  const [hh, mm, ss] = (timePart || "00:00:00").split(":").map(Number);
  const wall = Date.UTC(yr, mo - 1, da, hh % 24, mm, ss);
  return Math.round((wall - dt.getTime()) / 60000);
}

// The CST/CDT calendar Y-M-D (and weekday 0=Sun) for the given instant.
function chicagoYMD(dt: Date): { y: number; m: number; d: number; wd: number } {
  const s = dt.toLocaleString("en-US", { timeZone: "America/Chicago", weekday: "short", year: "numeric", month: "2-digit", day: "2-digit" });
  // e.g. "Wed, 07/15/2026"
  const [wdStr, rest] = s.split(", ");
  const [mo, da, yr] = rest.split("/").map(Number);
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { y: yr, m: mo, d: da, wd: wdMap[wdStr] ?? 0 };
}

// UTC instant for Chicago-local midnight of the given Y-M-D.
function chicagoMidnightUTC(y: number, m: number, d: number): Date {
  const noon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)); // noon UTC that day → safe for the offset lookup
  const off = chicagoOffsetMin(noon);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - off * 60000);
}

export function cstStartOf(now: Date, unit: "day" | "week" | "month"): Date {
  const { y, m, d, wd } = chicagoYMD(now);
  if (unit === "month") return chicagoMidnightUTC(y, m, 1);
  const startToday = chicagoMidnightUTC(y, m, d);
  if (unit === "day") return startToday;
  return new Date(startToday.getTime() - wd * 86400000); // back up to Sunday
}

const LIVE = ["in-progress", "ringing", "connected", "transferring"];

export async function notificationCounts(now: Date = new Date()): Promise<Counts> {
  const threeHoursAgo = new Date(now.getTime() - 3 * 3600_000);
  const [textsOutstanding, liveCalls, today, week, month, total] = await Promise.all([
    db.smsMessage.count({ where: { direction: "inbound", readAt: null } }),
    db.call.count({ where: { status: { in: LIVE }, createdAt: { gte: threeHoursAgo } } }),
    db.call.count({ where: { createdAt: { gte: cstStartOf(now, "day") } } }),
    db.call.count({ where: { createdAt: { gte: cstStartOf(now, "week") } } }),
    db.call.count({ where: { createdAt: { gte: cstStartOf(now, "month") } } }),
    db.call.count(),
  ]);
  return { textsOutstanding, liveCalls, today, week, month, total };
}
```

- [ ] **Step 4: Run — expect PASS** — `npx vitest run src/lib/notifications.test.ts`; then `npm test` → green.

- [ ] **Step 5: Commit** — `git add src/lib/notifications.ts src/lib/notifications.test.ts && git commit -m "feat(dash): notification counts + CST day/week/month boundaries"`

---

### Task 2: Staff-gated API (`GET /api/notifications`)

**Files:** Create `src/app/api/notifications/route.ts`.

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { notificationCounts } from "@/lib/notifications";

const STAFF = ["god", "marketing", "accounting", "assistant"];

export async function GET() {
  const s = await getSession();
  if (!s || !STAFF.includes(s.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json(await notificationCounts());
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit` (zero from the route; unrelated followup/ WIP ignored) + `npm test` green.
- [ ] **Step 3: Commit** — `git add src/app/api/notifications/route.ts && git commit -m "feat(dash): staff-gated /api/notifications route"`

---

### Task 3: Notifications button component + layout wiring

**Files:** Create `src/components/dash/Notifications.tsx`; modify `src/app/dashboard/layout.tsx`.

- [ ] **Step 1: Create `src/components/dash/Notifications.tsx`**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";

type Counts = { textsOutstanding: number; liveCalls: number; today: number; week: number; month: number; total: number };
const ZERO: Counts = { textsOutstanding: 0, liveCalls: 0, today: 0, week: 0, month: 0, total: 0 };

export default function Notifications() {
  const [c, setC] = useState<Counts>(ZERO);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/notifications").then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive && d) setC(d); }).catch(() => {});
    load();
    const t = setInterval(load, 45000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const badge = c.textsOutstanding;
  const rows: [string, number, string?][] = [
    ["Texts to respond", c.textsOutstanding, "var(--danger)"],
    ["Live calls", c.liveCalls, "#3fb950"],
    ["Calls today", c.today],
    ["Calls this week", c.week],
    ["Calls this month", c.month],
    ["Total calls", c.total],
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        className="relative w-9 h-9 rounded-full border border-[var(--border)] bg-[var(--panel)] flex items-center justify-center hover:border-[var(--gold)]"
      >
        <span aria-hidden className="text-base">🔔</span>
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold flex items-center justify-center">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-lg z-50 p-3">
          <div className="text-xs uppercase text-[var(--muted)] mb-2">Notifications</div>
          <ul className="space-y-1 text-sm">
            {rows.map(([label, val, color]) => (
              <li key={label} className="flex items-center justify-between">
                <span>{label}</span>
                <span className="font-bold tabular-nums" style={color ? { color } : undefined}>{val}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into `src/app/dashboard/layout.tsx`** — add the import and render it in the header row alongside the engine toggle. Add import:
```tsx
import Notifications from "@/components/dash/Notifications";
```
Replace the current header line:
```tsx
        {engine && <EngineToggle current={engine} />}
```
with a flex header row that holds the (god-only) toggle on the left and the (staff) bell on the right:
```tsx
        <div className="flex items-center justify-between gap-2 px-6 pt-2">
          <div>{engine && <EngineToggle current={engine} />}</div>
          <Notifications />
        </div>
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit` (zero from Notifications.tsx + layout.tsx; unrelated followup/ WIP ignored) + `npm test` green. Confirm the layout still renders the toggle for god and adds the bell for all staff.
- [ ] **Step 4: Commit** — `git add src/components/dash/Notifications.tsx src/app/dashboard/layout.tsx && git commit -m "feat(dash): notifications bell in the dashboard header (texts + call counts)"`

---

### Task 4: Full test + isolated build + deploy

- [ ] `npm test` green.
- [ ] Isolated worktree build → exit 0, `/api/notifications` in the manifest.
- [ ] Deploy (controller, additive, NO schema change): rsync `src/lib/notifications.ts`, `src/app/api/notifications/route.ts`, `src/components/dash/Notifications.tsx`, `src/app/dashboard/layout.tsx`; build-before-restart; verify site 200 + `/api/notifications` 403 for a non-staff/anon request (god sees counts when logged in).

## Self-Review

**Coverage:** all 6 counts (outstanding inbound texts, live calls w/ 3h recency guard, calls today/week/month/total on CST boundaries), staff-gated API, bell+badge+popover polling every 45s, placed in the header next to the engine toggle for all staff.
**Boundaries:** CST via `chicagoOffsetMin`/`chicagoMidnightUTC` (DST-correct via Intl), TDD-tested with summer (CDT-5) + winter (CST-6) + week(Sunday) + month vectors.
**No schema change.** No Fluid/Static/voice change — this is a read-only dashboard widget.
**Types:** `Counts` shape shared across lib → API → component.
