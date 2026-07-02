import { db } from "@/lib/db";

// Rakuten Advertising (LinkSynergy) affiliate API client for medig.app.
// Auth = OAuth2 client_credentials: Basic base64(clientId:clientSecret) + scope=<Account SID>.
// The Core generates + caches the token (1h TTL) so keys never need manual token handling.
const TOKEN_URL = "https://api.linksynergy.com/token";
const API = "https://api.linksynergy.com";

export type RakCfg = { clientId: string; clientSecret: string; sid: string; autoApprove: string };

export async function rakCfg(): Promise<RakCfg> {
  const row = await db.integration.findUnique({ where: { key: "rakuten" } });
  let c: Record<string, string> = {};
  try { c = row ? JSON.parse(row.config) : {}; } catch {}
  return { clientId: c.clientId || "", clientSecret: c.clientSecret || "", sid: c.sid || "", autoApprove: c.autoApprove || "" };
}

let _tok: { token: string; exp: number } | null = null;

/** Get a bearer token (cached until ~1 min before expiry). Throws with a clear message if not configured. */
export async function rakToken(cfg?: RakCfg): Promise<string> {
  const c = cfg || (await rakCfg());
  if (!c.clientId || !c.clientSecret) throw new Error("Rakuten Client ID / Secret not set on Integrations.");
  if (_tok && Date.now() < _tok.exp) return _tok.token;
  const basic = Buffer.from(`${c.clientId}:${c.clientSecret}`).toString("base64");
  const body = new URLSearchParams({ grant_type: "client_credentials", scope: c.sid || "0" });
  const r = await fetch(TOKEN_URL, { method: "POST", headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" }, body });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.access_token) throw new Error(`Rakuten token failed (${r.status}): ${d.error_description || d.error || "unknown"}`);
  _tok = { token: d.access_token, exp: Date.now() + (Number(d.expires_in || 3600) - 60) * 1000 };
  return _tok.token;
}

async function authed(path: string, init: RequestInit = {}) {
  const token = await rakToken();
  return fetch(`${API}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) } });
}

export type RakOfferRaw = { advertiserId: string; advertiser: string; title: string; description: string; imageUrl: string; deepLink: string; category: string; payoutNote: string };

/** Pull coupon/offer content for a keyword/category (JSON). Defensive — returns [] on any issue. */
export async function searchOffers(keyword: string, category = ""): Promise<RakOfferRaw[]> {
  try {
    const qs = new URLSearchParams();
    if (keyword) qs.set("keyword", keyword);
    if (category) qs.set("category", category);
    qs.set("resultsperpage", "50");
    const r = await authed(`/coupon/1.0?${qs.toString()}`);
    const d = await r.json().catch(() => null);
    const links = d?.coupons?.link || d?.link || [];
    const arr = Array.isArray(links) ? links : [links].filter(Boolean);
    return arr.map((x: Record<string, unknown>) => ({
      advertiserId: String(x.advertiserid ?? x.mid ?? ""),
      advertiser: String(x.advertisername ?? x.merchantname ?? ""),
      title: String(x.offerdescription ?? x.couponrestriction ?? x.categories ?? "Offer"),
      description: String(x.offerdescription ?? ""),
      imageUrl: "",
      deepLink: String(x.clickurl ?? ""),
      category: String((x.categories as { category?: string[] })?.category?.[0] ?? x.categories ?? ""),
      payoutNote: "",
    }));
  } catch { return []; }
}

/** Advanced Reports — transactions/events for a date window (for monetization attribution via u1). */
export async function fetchTransactions(startISO: string, endISO: string): Promise<Array<{ orderId: string; advertiserId: string; saleCents: number; commissionCents: number; u1: string; eventAt: string; status: string }>> {
  try {
    const qs = new URLSearchParams({ startdate: startISO.slice(0, 10), enddate: endISO.slice(0, 10) });
    const r = await authed(`/events/1.0/transactions?${qs.toString()}`);
    const d = await r.json().catch(() => null);
    const rows = d?.transactions || d?.transaction || [];
    const arr = Array.isArray(rows) ? rows : [rows].filter(Boolean);
    return arr.map((t: Record<string, unknown>) => ({
      orderId: String(t.etransactionId ?? t.orderId ?? ""),
      advertiserId: String(t.advertiserId ?? t.mid ?? ""),
      saleCents: Math.round(Number((t.saleAmount as { amount?: number })?.amount ?? t.saleAmount ?? 0) * 100),
      commissionCents: Math.round(Number((t.commissions as { amount?: number })?.amount ?? t.commission ?? 0) * 100),
      u1: String(t.u1 ?? t.memberId ?? ""),
      eventAt: String(t.transactionDate ?? t.eventDate ?? ""),
      status: String(t.transactionType ?? "pending"),
    }));
  } catch { return []; }
}

/** Append our tracking sub-id (u1) to a Rakuten deep link so events attribute back to the page/click. */
export function trackedLink(deepLink: string, subId: string): string {
  if (!deepLink) return "";
  const sep = deepLink.includes("?") ? "&" : "?";
  return `${deepLink}${sep}u1=${encodeURIComponent(subId)}`;
}
