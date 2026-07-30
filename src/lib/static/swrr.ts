// Pure Smooth-Weighted-Round-Robin (nginx algorithm) over buyers, plus CST daily helpers.
// No DB, no Date.now() — all time flows in as epoch ms so it stays deterministic and testable.

export type SwrrBuyer = {
  id: string;
  priorityWeight: number;
  swrrCurrent: number;
  active: boolean;
  dailyCap: number;   // 0 = unlimited
  dailyCount: number;
};

export function eligible(buyers: SwrrBuyer[]): SwrrBuyer[] {
  return buyers.filter((b) => b.active && (b.dailyCap === 0 || b.dailyCount < b.dailyCap));
}

// One SWRR step. Returns the chosen id and a NEW buyers array with updated swrrCurrent
// for the eligible pool (ineligible buyers are returned unchanged). Does not touch dailyCount.
export function selectBuyer(buyers: SwrrBuyer[]): { chosenId: string | null; next: SwrrBuyer[] } {
  const pool = eligible(buyers);
  if (pool.length === 0) return { chosenId: null, next: buyers.map((b) => ({ ...b })) };

  const total = pool.reduce((s, b) => s + Math.max(0, b.priorityWeight), 0);
  // add each pool buyer's weight to its current
  const cur = new Map<string, number>();
  for (const b of pool) cur.set(b.id, b.swrrCurrent + Math.max(0, b.priorityWeight));

  // pick the highest current; on a tie the earliest in the pool wins (deterministic)
  let chosen = pool[0];
  for (const b of pool) if ((cur.get(b.id) ?? 0) > (cur.get(chosen.id) ?? 0)) chosen = b;

  // subtract total weight from the chosen buyer's current
  cur.set(chosen.id, (cur.get(chosen.id) ?? 0) - total);

  const next = buyers.map((b) => (cur.has(b.id) ? { ...b, swrrCurrent: cur.get(b.id)! } : { ...b }));
  return { chosenId: chosen.id, next };
}

// YYYY-MM-DD in America/Chicago (DST-correct). Pure: depends only on the input ms.
export function cstDayKey(epochMs: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(epochMs));
  return parts; // en-CA formats as YYYY-MM-DD
}

// Reset dailyCount to 0 for every buyer when the CST day has rolled over.
export function applyDailyReset(
  buyers: SwrrBuyer[],
  prevKey: string,
  nowKey: string,
): { reset: boolean; next: SwrrBuyer[] } {
  if (prevKey === nowKey) return { reset: false, next: buyers.map((b) => ({ ...b })) };
  return { reset: true, next: buyers.map((b) => ({ ...b, dailyCount: 0 })) };
}
