// BrokerCalls / Ringba read-only reconciliation.
// Token comes ONLY from process.env.RINGBA_API_TOKEN — never hard-coded or stored in the DB.

export type RingbaCallRow = {
  callId: string;
  inboundPhone: string;
  connectedSec: number;
  payoutCents: number;
  callAtMs: number;
};

export type U65Match = {
  u65Id: string;
  ringbaCallId: string;
  ringbaSec: number;
  ringbaPaid: boolean;
};

const last10 = (p: string) => (p || "").replace(/\D/g, "").slice(-10);

export function matchRingba(
  u65: { id: string; fromNumber: string; createdAtMs: number }[],
  rows: RingbaCallRow[],
  windowMs = 15 * 60_000,
): U65Match[] {
  const out: U65Match[] = [];
  for (const c of u65) {
    const key = last10(c.fromNumber);
    if (!key) continue;
    const best = rows
      .filter((r) => last10(r.inboundPhone) === key && Math.abs(r.callAtMs - c.createdAtMs) <= windowMs)
      .sort((a, b) => Math.abs(a.callAtMs - c.createdAtMs) - Math.abs(b.callAtMs - c.createdAtMs))[0];
    if (!best) continue;
    out.push({
      u65Id: c.id,
      ringbaCallId: best.callId,
      ringbaSec: best.connectedSec,
      ringbaPaid: best.connectedSec > 120 || best.payoutCents > 0,
    });
  }
  return out;
}

export async function fetchRingbaCallLogs(opts: {
  accountId: string;
  campaignId?: string;
  startMs: number;
  endMs: number;
}): Promise<RingbaCallRow[]> {
  const token = process.env.RINGBA_API_TOKEN;
  if (!token || !opts.accountId) return []; // graceful degrade — Ringba not connected yet
  const body: Record<string, unknown> = {
    reportStart: new Date(opts.startMs).toISOString(),
    reportEnd: new Date(opts.endMs).toISOString(),
    offset: 0,
    size: 1000,
    filters: opts.campaignId
      ? [{ anyConditionToMatch: [{ column: "campaignId", value: opts.campaignId, comparisonType: "EQUALS" }] }]
      : [],
    valueColumns: [
      { column: "inboundCallId" }, { column: "callDt" }, { column: "inboundPhoneNumber" },
      { column: "connectedCallLengthInSeconds" }, { column: "hasConnected" }, { column: "payoutAmount" },
    ],
  };
  const res = await fetch(`https://api.ringba.com/v2/${opts.accountId}/calllogs`, {
    method: "POST",
    headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!res || !res.ok) return [];
  const json = await res.json().catch(() => null);
  const records: Record<string, unknown>[] = json?.report?.records || json?.records || [];
  return records.map((r) => ({
    callId: String(r.inboundCallId ?? r.callId ?? ""),
    inboundPhone: String(r.inboundPhoneNumber ?? ""),
    connectedSec: Math.round(Number(r.connectedCallLengthInSeconds ?? 0)),
    payoutCents: Math.round(Number(r.payoutAmount ?? 0) * 100),
    callAtMs: Date.parse(String(r.callDt ?? "")) || 0,
  }));
}
