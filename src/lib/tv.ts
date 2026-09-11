import { db } from "@/lib/db";
import { loadU65Config } from "@/lib/u65-store";
import { isStateEnabled, BILLABLE_CENTS } from "@/lib/u65";

// TV campaign tracking. Each TV creative test points at its own inbound number (plus the main
// 1-800-MEDIGAP toll-free). We attribute inbound calls to a campaign by the number that was
// dialed (call.toNumber), then divide by the impressions Vibe.co served to rank efficiency.

export type TvNumber = { key: string; label: string; display: string; digits: string; note: string };

export const TV_NUMBERS: TvNumber[] = [
  { key: "main", label: "1-800-MEDIGAP", display: "1-800-MEDIGAP", digits: "18006334427", note: "Main toll-free (all creative)" },
  { key: "a", label: "Test A", display: "(346) 220-3471", digits: "13462203471", note: "TV tracking — Test A" },
  { key: "b", label: "Test B", display: "(817) 803-1723", digits: "18178031723", note: "TV tracking — Test B" },
  { key: "c", label: "Test C", display: "(570) 532-5463", digits: "15705325463", note: "TV tracking — Test C" },
];

const last10 = (s: string) => (s || "").replace(/\D/g, "").slice(-10);

// Match a dialed ("To") number to its campaign, or null if it isn't a tracked TV number.
export function matchTvNumber(to: string): TvNumber | null {
  const l = last10(to);
  if (!l) return null;
  return TV_NUMBERS.find((n) => last10(n.digits) === l) || null;
}

// Impressions per campaign, entered from Vibe.co (Setting key "tvImpressions" → { [key]: impressions }).
export async function getTvImpressions(): Promise<Record<string, number>> {
  const row = await db.setting.findUnique({ where: { key: "tvImpressions" } }).catch(() => null);
  if (!row) return {};
  try {
    const parsed = JSON.parse(row.value) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const k of Object.keys(parsed)) out[k] = Math.max(0, Number(parsed[k]) || 0);
    return out;
  } catch {
    return {};
  }
}

export async function saveTvImpressions(map: Record<string, number>) {
  await db.setting.upsert({
    where: { key: "tvImpressions" },
    update: { value: JSON.stringify(map) },
    create: { key: "tvImpressions", value: JSON.stringify(map) },
  }).catch(() => {});
}

// Is this caller's number one we have on file for someone we're marketing to? EmailContact.phones
// stores a CSV of each contact's last-10-digit numbers. Given the small set of distinct callers in
// a window, one OR-contains query tells us which are recognized ("exact"); the rest are attributed
// as "connected matches" (probably the same targeted household calling from another phone).
async function recognizedCallers(froms: string[]): Promise<Set<string>> {
  const recognized = new Set<string>();
  const clean = [...new Set(froms.filter(Boolean))].slice(0, 400);
  if (!clean.length) return recognized;
  const rows = await db.emailContact.findMany({
    where: { OR: clean.map((f) => ({ phones: { contains: f } })) },
    select: { phones: true },
  }).catch(() => [] as { phones: string }[]);
  const onFile = new Set<string>();
  for (const r of rows) for (const p of (r.phones || "").split(",")) { const d = last10(p); if (d) onFile.add(d); }
  for (const f of clean) if (onFile.has(f)) recognized.add(f);
  return recognized;
}

// Per-campaign call stats over a time range. Each call to a tracked number is either an EXACT match
// (caller recognized in our audience data) or a CONNECTED MATCH (unrecognized number in-window). total
// = exact + connected. REVENUE is only counted for calls actually delivered to the current U65 "set
// number" buyer (loadU65Config().setNumber) — it re-computes whenever that buyer changes. inTarget =
// calls whose caller state is one of the triggered-on states in the U65 config.
export type TvStat = TvNumber & {
  exact: number;
  matches: number;   // connected matches (unrecognized caller, in-window)
  total: number;     // exact + matches = all calls to this number in the window
  exactRevCents: number;  // exact calls delivered to the set buyer × $75
  matchRevCents: number;  // connected-match calls delivered to the set buyer × $75
  totalRevCents: number;  // all calls delivered to the set buyer × $75
  inTarget: number;  // calls from a triggered-on state
  connected: number; // calls that actually answered/connected
  avgDurationSec: number;
  impressions: number;
  callsPer1k: number | null; // total per 1,000 impressions (null until impressions are entered)
};

export type TvTotals = { exact: number; matches: number; total: number; exactRevCents: number; matchRevCents: number; totalRevCents: number; inTarget: number; connected: number; impressions: number };

export async function tvReport(range?: { start?: Date; end?: Date }): Promise<{ stats: TvStat[]; totals: TvTotals; setNumber: string; enabledStates: number }> {
  const [impressions, cfg] = await Promise.all([getTvImpressions(), loadU65Config()]);
  const setBuyer = last10(cfg.setNumber); // revenue only counts calls delivered to THIS buyer (dynamic)
  const enabledStates = Object.values(cfg.states).filter(Boolean).length;

  const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (range?.start || range?.end) {
    where.createdAt = {};
    if (range.start) where.createdAt.gte = range.start;
    if (range.end) where.createdAt.lte = range.end;
  }
  const calls = await db.call.findMany({
    where,
    select: { toNumber: true, fromNumber: true, forwardedTo: true, state: true, status: true, durationSec: true },
  }).catch(() => [] as { toNumber: string; fromNumber: string; forwardedTo: string; state: string; status: string; durationSec: number }[]);

  const recognized = await recognizedCallers(calls.map((c) => last10(c.fromNumber)));

  const stats: TvStat[] = TV_NUMBERS.map((n) => {
    const mine = calls.filter((c) => last10(c.toNumber) === last10(n.digits));
    let exact = 0, exactPaid = 0, matchPaid = 0, paid = 0, inTarget = 0, connected = 0, durSum = 0;
    for (const c of mine) {
      const isExact = recognized.has(last10(c.fromNumber));
      const toBuyer = !!setBuyer && last10(c.forwardedTo) === setBuyer;
      if (isExact) exact++;
      if (toBuyer) { paid++; if (isExact) exactPaid++; else matchPaid++; }
      if (isStateEnabled(cfg, c.state)) inTarget++;
      if (c.status === "completed" || c.status === "connected" || c.status === "in-progress") connected++;
      durSum += c.durationSec || 0;
    }
    const total = mine.length;
    const imp = impressions[n.key] || 0;
    return {
      ...n,
      exact,
      matches: total - exact,
      total,
      exactRevCents: exactPaid * BILLABLE_CENTS,
      matchRevCents: matchPaid * BILLABLE_CENTS,
      totalRevCents: paid * BILLABLE_CENTS,
      inTarget,
      connected,
      avgDurationSec: total ? Math.round(durSum / total) : 0,
      impressions: imp,
      callsPer1k: imp > 0 ? (total / imp) * 1000 : null,
    };
  });

  const totals = stats.reduce<TvTotals>(
    (t, s) => ({
      exact: t.exact + s.exact, matches: t.matches + s.matches, total: t.total + s.total,
      exactRevCents: t.exactRevCents + s.exactRevCents, matchRevCents: t.matchRevCents + s.matchRevCents, totalRevCents: t.totalRevCents + s.totalRevCents,
      inTarget: t.inTarget + s.inTarget, connected: t.connected + s.connected, impressions: t.impressions + s.impressions,
    }),
    { exact: 0, matches: 0, total: 0, exactRevCents: 0, matchRevCents: 0, totalRevCents: 0, inTarget: 0, connected: 0, impressions: 0 },
  );
  return { stats, totals, setNumber: cfg.setNumber, enabledStates };
}

// Age split: match each call's caller number against the uploaded TV audience (tv_audience: last-10
// phone → over65) to classify under-65 vs 65+. Unmatched callers = "unknown" (not in the list).
export type TvAgeStat = TvNumber & { under: number; over: number; unknown: number; total: number };
export type TvAgeTotals = { under: number; over: number; unknown: number; total: number };

export async function tvAgeReport(range?: { start?: Date; end?: Date }): Promise<{ stats: TvAgeStat[]; totals: TvAgeTotals; audienceSize: number }> {
  const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (range?.start || range?.end) { where.createdAt = {}; if (range.start) where.createdAt.gte = range.start; if (range.end) where.createdAt.lte = range.end; }
  const calls = await db.call.findMany({ where, select: { toNumber: true, fromNumber: true } }).catch(() => [] as { toNumber: string; fromNumber: string }[]);
  const froms = [...new Set(calls.map((c) => last10(c.fromNumber)).filter(Boolean))];

  const ageMap = new Map<string, boolean>(); // caller last-10 → over65
  if (froms.length) {
    const rows = await db.$queryRawUnsafe<{ phone: string; over65: boolean }[]>(
      "SELECT phone, over65 FROM tv_audience WHERE phone = ANY($1::text[])", froms,
    ).catch(() => [] as { phone: string; over65: boolean }[]);
    for (const r of rows) ageMap.set(r.phone, r.over65);
  }

  const stats: TvAgeStat[] = TV_NUMBERS.map((n) => {
    const mine = calls.filter((c) => last10(c.toNumber) === last10(n.digits));
    let under = 0, over = 0, unknown = 0;
    for (const c of mine) {
      const a = ageMap.get(last10(c.fromNumber));
      if (a === undefined) unknown++; else if (a) over++; else under++;
    }
    return { ...n, under, over, unknown, total: mine.length };
  });
  const totals = stats.reduce<TvAgeTotals>(
    (t, s) => ({ under: t.under + s.under, over: t.over + s.over, unknown: t.unknown + s.unknown, total: t.total + s.total }),
    { under: 0, over: 0, unknown: 0, total: 0 },
  );
  const az = await db.$queryRawUnsafe<{ n: number }[]>("SELECT count(*)::int n FROM tv_audience").catch(() => [{ n: 0 }]);
  return { stats, totals, audienceSize: az[0]?.n || 0 };
}
