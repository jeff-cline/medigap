import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loadU65Config } from "@/lib/u65-store";
import { weekToDateStartUtcMs } from "@/lib/u65";
import { fetchRingbaCallLogs, matchRingba } from "@/lib/ringba";

export async function POST() {
  const cfg = await loadU65Config();
  const now = Date.now();
  const startMs = weekToDateStartUtcMs(now);

  const rows = await fetchRingbaCallLogs({
    accountId: cfg.ringbaAccountId, campaignId: cfg.ringbaCampaignId || undefined, startMs, endMs: now,
  });
  const connected = !!process.env.RINGBA_API_TOKEN && rows.length >= 0 && !!cfg.ringbaAccountId;

  const u65 = await db.u65Call.findMany({ where: { createdAt: { gte: new Date(startMs) } } });
  const matches = matchRingba(
    u65.map((c) => ({ id: c.id, fromNumber: c.fromNumber, createdAtMs: c.createdAt.getTime() })),
    rows,
  );
  for (const m of matches) {
    await db.u65Call.update({
      where: { id: m.u65Id },
      data: { ringbaCallId: m.ringbaCallId, ringbaSec: m.ringbaSec, ringbaPaid: m.ringbaPaid, reconciled: true, reconciledAt: new Date() },
    }).catch(() => {});
  }
  return NextResponse.json({ ok: true, connected, fetched: rows.length, matched: matches.length });
}
