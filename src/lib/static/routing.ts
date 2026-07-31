import { db } from "@/lib/db";
import { selectBuyer, cstDayKey, type SwrrBuyer } from "./swrr";
import { isAfterHours } from "./voice";
import { Prisma } from "@prisma/client";

export type RouteResult = { buyerId: string; number: string; payoutCents: number } | null;

function toSwrr(b: { id: string; priorityWeight: number; swrrCurrent: number; active: boolean; dailyCap: number; dailyCount: number }): SwrrBuyer {
  return { id: b.id, priorityWeight: b.priorityWeight, swrrCurrent: b.swrrCurrent, active: b.active, dailyCap: b.dailyCap, dailyCount: b.dailyCount };
}

const IS_PG = (process.env.DATABASE_URL || "").startsWith("postgres");

export async function pickBuyerFor(leafId: string, ctx: { zip?: string }, nowMs: number): Promise<RouteResult> {
  const nowKey = cstDayKey(nowMs);
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const buyers = await tx.staticBuyer.findMany({ where: { moneyWordId: leafId } });
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
            const rule = await tx.staticZipRule.findFirst({ where: { moneyWordId: leafId, zip: ctx.zip } });
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
          for (const b of filtered) {
            await tx.staticBuyer.update({
              where: { id: b.id },
              data: {
                swrrCurrent: swrrOf.get(b.id) ?? b.swrrCurrent,
                dailyCount: b.id === chosenId ? b.dailyCount + 1 : b.dailyCount,
                ...(b.id === chosenId ? { lastAssignedAt: new Date(nowMs) } : {}),
              },
            });
          }

          const useAfterHours = isAfterHours(chosen, nowMs) && !!chosen.afterHoursNumber;
          const number = (useAfterHours ? chosen.afterHoursNumber : chosen.defaultNumber) || "";
          if (!number) return null;
          return { buyerId: chosen.id, number, payoutCents: chosen.payoutCents };
        },
        // Serializable + P2034 retry is the Postgres-prod concurrency safeguard against double-assign /
        // cap breach / SWRR skew; SQLite can't exercise that path but the atomic read+write is verified
        // on SQLite via the "no lost updates under concurrent calls" invariant test.
        IS_PG ? { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10000 } : undefined,
      );
    } catch (e) {
      // Postgres serialization / write-conflict / deadlock → retry a few times, then give up (null → no-buyer fallback).
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034" && attempt < 4) continue;
      throw e;
    }
  }
  return null;
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
