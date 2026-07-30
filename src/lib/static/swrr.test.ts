import { describe, it, expect } from "vitest";
import { eligible, selectBuyer, cstDayKey, applyDailyReset, type SwrrBuyer } from "./swrr";

const B = (id: string, w: number, over: Partial<SwrrBuyer> = {}): SwrrBuyer =>
  ({ id, priorityWeight: w, swrrCurrent: 0, active: true, dailyCap: 0, dailyCount: 0, ...over });

describe("eligible", () => {
  it("drops inactive and capped buyers", () => {
    const pool = eligible([
      B("a", 1),
      B("b", 1, { active: false }),
      B("c", 1, { dailyCap: 5, dailyCount: 5 }),
      B("d", 1, { dailyCap: 5, dailyCount: 4 }),
    ]);
    expect(pool.map((p) => p.id)).toEqual(["a", "d"]);
  });
});

describe("selectBuyer SWRR", () => {
  it("returns null when no buyer is eligible", () => {
    const r = selectBuyer([B("a", 1, { active: false })]);
    expect(r.chosenId).toBeNull();
    expect(r.next).toHaveLength(1);
  });

  it("distributes 9:1 interleaved (not blocky) over 10 picks", () => {
    let buyers = [B("a", 9), B("b", 1)];
    const seq: string[] = [];
    for (let i = 0; i < 10; i++) {
      const r = selectBuyer(buyers);
      seq.push(r.chosenId!);
      buyers = r.next;
    }
    const counts = seq.reduce<Record<string, number>>((m, id) => ((m[id] = (m[id] ?? 0) + 1), m), {});
    expect(counts).toEqual({ a: 9, b: 1 });
    // interleaved: b must NOT be the very first or last of a "9 then 1" block — it lands mid-sequence
    expect(seq.indexOf("b")).toBeGreaterThan(0);
    expect(seq.indexOf("b")).toBeLessThan(9);
  });

  it("redistributes a disabled buyer's share to the rest", () => {
    // c is off → only a(8) and b(2) split 10 picks 8:2
    let buyers = [B("a", 8), B("b", 2), B("c", 90, { active: false })];
    const seq: string[] = [];
    for (let i = 0; i < 10; i++) {
      const r = selectBuyer(buyers);
      seq.push(r.chosenId!);
      buyers = r.next;
    }
    const counts = seq.reduce<Record<string, number>>((m, id) => ((m[id] = (m[id] ?? 0) + 1), m), {});
    expect(counts).toEqual({ a: 8, b: 2 });
  });

  it("is deterministic on a tie (lowest index wins)", () => {
    const r = selectBuyer([B("a", 1), B("b", 1)]);
    expect(r.chosenId).toBe("a");
  });
});

describe("cstDayKey", () => {
  it("formats an epoch ms as America/Chicago YYYY-MM-DD", () => {
    // 2026-07-15 03:00 UTC = 2026-07-14 22:00 CDT (still the 14th in Chicago)
    expect(cstDayKey(Date.UTC(2026, 6, 15, 3, 0, 0))).toBe("2026-07-14");
    // 2026-07-15 12:00 UTC = 2026-07-15 07:00 CDT
    expect(cstDayKey(Date.UTC(2026, 6, 15, 12, 0, 0))).toBe("2026-07-15");
  });
});

describe("applyDailyReset", () => {
  it("zeroes dailyCount on a new CST day", () => {
    const r = applyDailyReset([B("a", 1, { dailyCount: 7 })], "2026-07-14", "2026-07-15");
    expect(r.reset).toBe(true);
    expect(r.next[0].dailyCount).toBe(0);
  });
  it("leaves counts untouched on the same day", () => {
    const r = applyDailyReset([B("a", 1, { dailyCount: 7 })], "2026-07-15", "2026-07-15");
    expect(r.reset).toBe(false);
    expect(r.next[0].dailyCount).toBe(7);
  });
});
