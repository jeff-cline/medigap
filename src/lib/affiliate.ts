import { db } from "@/lib/db";
import { quinstreetPing, quinstreetPost, isQsVertical, type QsLead, type QsVertical } from "@/lib/quinstreet";

// The verticals QuinStreet (and future affiliates) can monetize. Anything new in their docs
// gets added here. `key` is what we store on AffiliateVertical.vertical + match on calls/leads.
export const VERTICALS: { key: string; label: string }[] = [
  { key: "home_insurance", label: "Home Insurance" },
  { key: "medicare", label: "Medicare Insurance" },
  { key: "life_insurance", label: "Life Insurance" },
  { key: "pet_insurance", label: "Pet Insurance" },
  { key: "auto_insurance", label: "Auto Insurance" },
];

export const verticalLabel = (key: string) =>
  VERTICALS.find((v) => v.key === key)?.label || key.replace(/_/g, " ");

export type RouteOption = {
  channel: "agent" | "affiliate" | "house";
  label: string;
  amountCents: number;
  partner?: string;
};

/**
 * THE OPTIMIZATION ENGINE — route every call/lead to whoever nets us the most.
 *
 * Priority is purely by money:
 *   1. A premium agent/partner WITH FUNDS who bids the most (existing live auction).
 *   2. Else the best AFFILIATE bid (QuinStreet ping) for this vertical — the backstop.
 *   3. Else the house default price.
 *
 * The caller resolves the live numbers (agent auction result, affiliate ping bid) and passes
 * them in; this function just picks the maximum and labels the winner. Once QuinStreet's ping
 * API is wired, `affiliateBidCents` comes from a real-time ping instead of the stored bid.
 */
export function bestMonetization(input: {
  agentBidCents?: number; // winning premium agent bid (0/undefined if nobody qualifies)
  agentLabel?: string;
  affiliateBidCents?: number; // best affiliate bid for the vertical (0/undefined if off)
  affiliatePartner?: string;
  houseCents: number; // house default floor
}): RouteOption {
  const opts: RouteOption[] = [];
  if (input.agentBidCents && input.agentBidCents > 0)
    opts.push({ channel: "agent", label: input.agentLabel || "Premium agent", amountCents: input.agentBidCents });
  if (input.affiliateBidCents && input.affiliateBidCents > 0)
    opts.push({ channel: "affiliate", label: input.affiliatePartner || "Affiliate", amountCents: input.affiliateBidCents, partner: input.affiliatePartner });
  opts.push({ channel: "house", label: "House default", amountCents: input.houseCents });
  // Highest payer wins; agent ties beat affiliate (we keep the relationship in-house when equal).
  opts.sort((a, b) => b.amountCents - a.amountCents);
  return opts[0];
}

/**
 * Best live affiliate bid for a vertical, honoring master + per-vertical on/off toggles.
 * Returns 0 when the partner or the vertical is switched off — so a toggled-off vertical
 * is simply invisible to the router. Until the ping API is wired, this returns the stored
 * `bidCents` (the placeholder you can edit in the dashboard to test routing).
 */
export async function affiliateBidFor(vertical: string): Promise<{ bidCents: number; partner: string | null; verticalId: string | null }> {
  const row = await db.affiliateVertical.findFirst({
    where: { vertical, active: true, affiliate: { active: true } },
    orderBy: { bidCents: "desc" },
    include: { affiliate: true },
  });
  if (!row) return { bidCents: 0, partner: null, verticalId: null };
  return { bidCents: row.bidCents, partner: row.affiliate.name, verticalId: row.id };
}

/** Record that a call/lead was monetized through an affiliate vertical (for the dashboard totals). */
export async function recordAffiliateRevenue(verticalId: string, amountCents: number) {
  await db.affiliateVertical.update({
    where: { id: verticalId },
    data: { calls: { increment: 1 }, revenueCents: { increment: amountCents }, lastBidAt: new Date() },
  });
}

// Default keyword → QuinStreet vertical map (used when a money word isn't explicitly tagged).
// Leading \b only (no trailing) so prefixes match: "homeowners", "vehicles", "supplements", etc.
const WORD_MAP: { rx: RegExp; vertical: QsVertical }[] = [
  { rx: /\b(medicare|medigap|supplement|part\s?[abcd]|advantage|turning\s?65|senior\s?health)/i, vertical: "medicare" },
  { rx: /\b(auto|car|vehicle|automobile|motor)/i, vertical: "auto_insurance" },
  { rx: /\b(home|homeowner|house|property|dwelling|renter|condo)/i, vertical: "home_insurance" },
  { rx: /\b(life\b|final\s?expense|term\s?life|whole\s?life|burial|funeral)/i, vertical: "life_insurance" },
];

/**
 * Resolve which QuinStreet vertical a call maps to. Priority: an explicit tag on the matched
 * MoneyWord (set in the dashboard) → keyword match on the spoken word → null (no affiliate vertical).
 */
export async function resolveAffiliateVertical(moneyWord?: string | null): Promise<QsVertical | null> {
  const word = (moneyWord || "").trim();
  if (!word) return null;
  // explicit tag on the money word wins
  const mw = await db.moneyWord.findFirst({ where: { OR: [{ word }, { word: word.toLowerCase() }] } }).catch(() => null);
  if (mw?.affiliateVertical && isQsVertical(mw.affiliateVertical)) return mw.affiliateVertical;
  // else keyword match
  for (const m of WORD_MAP) if (m.rx.test(word)) return m.vertical;
  return null;
}

export type PingStatus = "pinged" | "posted" | "sold" | "rejected" | "no_bid";

/**
 * Log one ping-tree event — the spine of reconciliation. Call this the moment we ping an
 * affiliate (status "pinged"/"no_bid"), again when we post (status "posted"/"sold"/"rejected"),
 * and later attach their reported payout when their statement/postback arrives.
 */
export async function logPing(input: {
  affiliateId: string;
  verticalId?: string | null;
  vertical: string;
  callId?: string | null;
  leadId?: string | null;
  status: PingStatus;
  offerCents?: number;
  qualifySec?: number;
  matchedClient?: string;
  soldCents?: number;
  externalId?: string;
  trackingNumber?: string;
  moneyWord?: string;
  isTest?: boolean;
  note?: string;
}) {
  return db.affiliatePing.create({
    data: {
      affiliateId: input.affiliateId,
      verticalId: input.verticalId ?? null,
      vertical: input.vertical,
      callId: input.callId ?? null,
      leadId: input.leadId ?? null,
      status: input.status,
      offerCents: input.offerCents ?? 0,
      qualifySec: input.qualifySec ?? 0,
      matchedClient: input.matchedClient ?? "",
      soldCents: input.soldCents ?? 0,
      externalId: input.externalId ?? "",
      trackingNumber: input.trackingNumber ?? "",
      moneyWord: input.moneyWord ?? "",
      isTest: input.isTest ?? false,
      note: input.note ?? "",
      postedAt: input.status === "posted" || input.status === "sold" ? new Date() : null,
    },
  });
}

/**
 * The live ping-tree step for an inbound call. Called from routeCall AFTER the agent auction.
 * - mode "off"     → no-op (returns null).
 * - mode "observe" → ping QuinStreet, log what pinged + the offer, but DO NOT reroute the call.
 * - mode "live"    → ping; if the commission beats the agent bid, POST and return an override so the
 *                    call bridges to QuinStreet's tracking number (logged as posted/sold).
 * Fully defensive: any error logs nothing fatal and returns null so the call path is never broken.
 */
export async function affiliateCallStep(input: {
  moneyWord?: string | null;
  callId?: string | null;
  leadId?: string | null;
  agentBidCents: number; // the winning agent's bid (0 if none) — QuinStreet must beat this to win in live mode
  lead: QsLead;
}): Promise<{ override?: { forwardedTo: string; priceCents: number }; pinged: boolean; commissionCents?: number } | null> {
  try {
    const aff = await db.affiliate.findFirst({ where: { slug: "quinstreet", active: true } });
    if (!aff || aff.mode === "off") return null;
    // Resolve the vertical from the spoken word; if none, fall back to the partner's default vertical
    // (e.g. medicare for the medigap line) so general inbound calls still hit the ping tree.
    let vertical = await resolveAffiliateVertical(input.moneyWord);
    const viaDefault = !vertical; // no auto/home/life/medicare word matched → used the default
    if (!vertical && aff.defaultVertical && isQsVertical(aff.defaultVertical)) vertical = aff.defaultVertical;
    if (!vertical) return null;
    const row = await db.affiliateVertical.findFirst({ where: { affiliateId: aff.id, vertical, active: true } });
    if (!row || !row.pingUrl) return null;

    const ping = await quinstreetPing({ vertical, lead: input.lead, pingUrl: row.pingUrl || undefined, quadTag: row.quadTag || undefined });
    const live = aff.mode === "live";
    const wins = live && ping.ok && ping.bidCents > input.agentBidCents;

    // try to post when QuinStreet wins (must be within 90s of ping; we do it immediately)
    let post: Awaited<ReturnType<typeof quinstreetPost>> | null = null;
    if (wins && ping.pingId) {
      post = await quinstreetPost({ vertical, lead: input.lead, pingId: ping.pingId, postUrl: row.postUrl || undefined, quadTag: row.quadTag || undefined });
    }

    const noBid = ping.status.toUpperCase() === "SUCCESS" || /unable to monetize|no.?bid/i.test(ping.message);
    const status: PingStatus = wins ? (post?.ok ? "sold" : "posted")
      : ping.ok ? "pinged"
      : noBid ? "no_bid" : "rejected";

    await logPing({
      affiliateId: aff.id, verticalId: row.id, vertical,
      callId: input.callId, leadId: input.leadId, status,
      offerCents: ping.bidCents, qualifySec: ping.qualifySec ?? 0, matchedClient: ping.matchedClient ?? "",
      soldCents: post?.ok ? ping.bidCents : 0,
      externalId: ping.pingId || "", trackingNumber: row.trackingNumber, moneyWord: input.moneyWord || "",
      note: `${aff.mode} · ${ping.message}${ping.qualifySec ? ` · qualify ${ping.qualifySec}s` : ""}${ping.matchedClient ? ` · ${ping.matchedClient}` : ""}${viaDefault ? " · default-vertical" : ""}`,
    });
    if (status === "sold") await recordAffiliateRevenue(row.id, ping.bidCents);

    if (wins && post?.ok && row.trackingNumber) {
      return { override: { forwardedTo: row.trackingNumber, priceCents: ping.bidCents }, pinged: true, commissionCents: ping.bidCents };
    }
    return { pinged: true, commissionCents: ping.ok ? ping.bidCents : 0 };
  } catch {
    return null; // never break the call
  }
}

/** Roll up reconciliation across all (or one affiliate's) REAL pings (test rows excluded). */
export async function reconciliationSummary(affiliateId?: string) {
  const where = { isTest: false, ...(affiliateId ? { affiliateId } : {}) };
  const [pinged, posted, sold, rejected, soldAgg, reportedAgg, openAgg] = await Promise.all([
    db.affiliatePing.count({ where: { ...where, status: "pinged" } }),
    db.affiliatePing.count({ where: { ...where, status: "posted" } }),
    db.affiliatePing.count({ where: { ...where, status: "sold" } }),
    db.affiliatePing.count({ where: { ...where, status: "rejected" } }),
    db.affiliatePing.aggregate({ where: { ...where, status: "sold" }, _sum: { soldCents: true } }),
    db.affiliatePing.aggregate({ where, _sum: { reportedCents: true } }),
    db.affiliatePing.aggregate({ where: { ...where, reconciled: false, status: "sold" }, _sum: { soldCents: true } }),
  ]);
  const weRecorded = soldAgg._sum.soldCents ?? 0; // our sold $
  const theyReport = reportedAgg._sum.reportedCents ?? 0; // their statement $
  const openUnreconciled = openAgg._sum.soldCents ?? 0;
  return {
    pinged, posted, sold, rejected,
    weRecorded, theyReport,
    variance: weRecorded - theyReport, // >0 = they owe us more than they've reported
    openUnreconciled,
  };
}
