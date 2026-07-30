import { db } from "@/lib/db";
import { selectBuyer, cstDayKey, type SwrrBuyer } from "./swrr";
import { isAfterHours } from "./voice";

export type RouteResult = { buyerId: string; number: string } | null;

function toSwrr(b: { id: string; priorityWeight: number; swrrCurrent: number; active: boolean; dailyCap: number; dailyCount: number }): SwrrBuyer {
  return { id: b.id, priorityWeight: b.priorityWeight, swrrCurrent: b.swrrCurrent, active: b.active, dailyCap: b.dailyCap, dailyCount: b.dailyCount };
}

export async function pickBuyerFor(leafId: string, ctx: { zip?: string }, nowMs: number): Promise<RouteResult> {
  const nowKey = cstDayKey(nowMs);
  const buyers = await db.staticBuyer.findMany({ where: { moneyWordId: leafId } });
  if (buyers.length === 0) return null;

  // per-buyer daily reset (CST rollover since lastAssignedAt)
  const rolled = buyers.map((b) => {
    const stale = b.lastAssignedAt ? cstDayKey(b.lastAssignedAt.getTime()) !== nowKey : false;
    return stale ? { ...b, dailyCount: 0 } : b;
  });

  // filter out buyers with blank defaultNumber before selection
  const filtered = rolled.filter((b) => b.defaultNumber.trim() !== "");
  if (filtered.length === 0) return null;

  // exact-ZIP override (radius ignored in 2B-core)
  let chosenId: string | null = null;
  if (ctx.zip) {
    const rule = await db.staticZipRule.findFirst({ where: { moneyWordId: leafId, zip: ctx.zip } });
    if (rule) {
      const rb = filtered.find((b) => b.id === rule.buyerId);
      if (rb && rb.active && (rb.dailyCap === 0 || rb.dailyCount < rb.dailyCap)) chosenId = rb.id;
    }
  }

  let poolNext = filtered.map(toSwrr);
  if (!chosenId) {
    const sel = selectBuyer(filtered.map(toSwrr));
    chosenId = sel.chosenId;
    poolNext = sel.next;
  }
  if (!chosenId) return null;

  const chosen = filtered.find((b) => b.id === chosenId)!;
  const swrrOf = new Map(poolNext.map((p) => [p.id, p.swrrCurrent]));

  // persist: swrrCurrent for all, dailyCount+1 + lastAssignedAt on the chosen; reset stale counts too
  await db.$transaction(
    filtered.map((b) =>
      db.staticBuyer.update({
        where: { id: b.id },
        data: {
          swrrCurrent: swrrOf.get(b.id) ?? b.swrrCurrent,
          dailyCount: b.id === chosenId ? b.dailyCount + 1 : b.dailyCount,
          ...(b.id === chosenId ? { lastAssignedAt: new Date(nowMs) } : {}),
        },
      }),
    ),
  );

  const useAfterHours = isAfterHours(chosen, nowMs) && !!chosen.afterHoursNumber;
  const number = (useAfterHours ? chosen.afterHoursNumber : chosen.defaultNumber) || "";
  if (!number) return null;
  return { buyerId: chosen.id, number };
}

export async function pickBackupNumber(buyerId: string): Promise<string> {
  const b = await db.staticBuyer.findUnique({ where: { id: buyerId } });
  return b?.backupNumber || "";
}

export async function captureCallback(input: { moneyWordId?: string; word: string; state?: string; zip?: string; phone?: string; note?: string }): Promise<void> {
  await db.staticCallback.create({
    data: {
      moneyWordId: input.moneyWordId ?? null,
      word: input.word,
      state: input.state ?? "",
      zip: input.zip ?? "",
      phone: input.phone ?? "",
      note: input.note ?? "",
    },
  });
}
