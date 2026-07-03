import { cache } from "react";
import { db } from "@/lib/db";

// Google AdSense — client script publisher id + Management API (reporting) for the Core dashboard.
const DEFAULT_PUB = "ca-pub-7355906314074414"; // provided; overridable in the ADSENSE integration
const API = "https://adsense.googleapis.com/v2";

export type AdsenseCfg = { pubId: string; clientId: string; clientSecret: string; refreshToken: string; accessToken: string; enabledHosts: string[] };

// The three sites turned ON by default; everything else on the Core is OFF until toggled.
export const ADSENSE_DEFAULT_ON = ["experientialmarketing.ai", "el.ag", "medigap.plus"];
// Flagship/white-label hosts that aren't necessarily Site rows — always shown in the toggle list.
const CORE_HOSTS_STATIC = ["medigap.plus", "1-800-medigap.com", "doublewide.ai", "el.ag", "medig.app", "experientialmarketing.ai"];
const norm = (h: string) => h.replace(/^www\./, "").split(":")[0].toLowerCase();

export const adsenseCfg = cache(async (): Promise<AdsenseCfg> => {
  const row = await db.integration.findUnique({ where: { key: "adsense" } }).catch(() => null);
  let c: Record<string, unknown> = {};
  try { c = row ? JSON.parse(row.config) : {}; } catch {}
  const s = (k: string) => (typeof c[k] === "string" ? (c[k] as string) : "");
  const enabledHosts = Array.isArray(c.enabledHosts) ? (c.enabledHosts as string[]) : ADSENSE_DEFAULT_ON;
  return { pubId: s("pubId") || DEFAULT_PUB, clientId: s("clientId"), clientSecret: s("clientSecret"), refreshToken: s("refreshToken"), accessToken: s("accessToken"), enabledHosts };
});

/** Is AdSense turned ON for this host? (checked by the root layout before injecting the script) */
export const adsenseEnabledForHost = cache(async (host: string): Promise<boolean> => {
  const { enabledHosts } = await adsenseCfg();
  return enabledHosts.map(norm).includes(norm(host));
});

/** Every host on the Core (static flagships + Site rows), with its current on/off state — for the toggle list. */
export async function adsenseSiteList(): Promise<{ host: string; name: string; on: boolean }[]> {
  const [{ enabledHosts }, sites] = await Promise.all([adsenseCfg(), db.site.findMany({ select: { hostname: true, name: true } }).catch(() => [])]);
  const on = new Set(enabledHosts.map(norm));
  const map = new Map<string, string>();
  for (const h of CORE_HOSTS_STATIC) map.set(norm(h), h);
  for (const s of sites) map.set(norm(s.hostname), s.name || s.hostname);
  return [...map.entries()].map(([host, name]) => ({ host, name: name === host ? host : name, on: on.has(host) })).sort((a, b) => Number(b.on) - Number(a.on) || a.host.localeCompare(b.host));
}

// The <script> publisher id (public). Falls back to the provided default.
export const adsensePubId = cache(async (): Promise<string> => (await adsenseCfg()).pubId || DEFAULT_PUB);

// The reporting account resource: accounts/pub-XXXXXXXX (drop the "ca-").
const accountName = (pubId: string) => `accounts/${pubId.replace(/^ca-/, "")}`;

let _tok: { token: string; exp: number } | null = null;

/** OAuth2 access token for the AdSense Management API — from the stored refresh token
 *  (adsense OAuth connection) or a pasted access token. */
export async function adsenseToken(): Promise<string> {
  const cfg = await adsenseCfg();
  if (_tok && Date.now() < _tok.exp) return _tok.token;
  // Prefer a refresh token from the OAuth "Connect" flow (stored on the connection), else config.
  const conn = await db.oAuthConnection.findUnique({ where: { provider: "adsense" } }).catch(() => null);
  const refresh = conn?.refreshToken || cfg.refreshToken;
  if (refresh && cfg.clientId && cfg.clientSecret) {
    const body = new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, refresh_token: refresh, grant_type: "refresh_token" });
    const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    const d = await r.json().catch(() => ({}));
    if (d.access_token) { _tok = { token: d.access_token, exp: Date.now() + (Number(d.expires_in || 3600) - 60) * 1000 }; return _tok.token; }
    throw new Error(`AdSense token refresh failed: ${d.error_description || d.error || r.status}`);
  }
  if (cfg.accessToken) return cfg.accessToken;
  throw new Error("AdSense not connected — Connect Google on Integrations (or paste a refresh/access token).");
}

async function authed(path: string) {
  const token = await adsenseToken();
  return fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

export async function adsenseAccounts(): Promise<{ name: string; displayName: string }[]> {
  const r = await authed(`/accounts`);
  const d = await r.json().catch(() => ({}));
  return (d.accounts || []).map((a: { name: string; displayName?: string }) => ({ name: a.name, displayName: a.displayName || a.name }));
}

export type AdsRow = { date?: string; domain?: string; earnings: number; clicks: number; impressions: number; pageViews: number; rpm: number };
export type AdsReport = { ok: boolean; totals: { earnings: number; clicks: number; impressions: number; pageViews: number; rpm: number }; rows: AdsRow[]; error?: string; currency: string };

/** Generate an earnings report. range e.g. "LAST_7_DAYS" | "LAST_30_DAYS" | "MONTH_TO_DATE".
 *  dim: "DATE" (time series) or "DOMAIN_NAME" (per-site value). */
export async function adsenseReport(range = "LAST_30_DAYS", dim: "DATE" | "DOMAIN_NAME" = "DATE"): Promise<AdsReport> {
  try {
    const cfg = await adsenseCfg();
    const metrics = ["ESTIMATED_EARNINGS", "CLICKS", "AD_REQUESTS", "PAGE_VIEWS", "PAGE_VIEWS_RPM"];
    const qs = new URLSearchParams();
    qs.set("dateRange", range);
    qs.append("dimensions", dim);
    for (const m of metrics) qs.append("metrics", m);
    qs.set("orderBy", dim === "DATE" ? "+DATE" : "-ESTIMATED_EARNINGS");
    const r = await authed(`/${accountName(cfg.pubId)}/reports:generate?${qs.toString()}`);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, totals: { earnings: 0, clicks: 0, impressions: 0, pageViews: 0, rpm: 0 }, rows: [], currency: "USD", error: d.error?.message || `HTTP ${r.status}` };
    const cells = (d.headers || []).map((h: { name: string }) => h.name);
    const idx = (n: string) => cells.indexOf(n);
    const num = (v: unknown) => Number(v || 0);
    const rows: AdsRow[] = (d.rows || []).map((row: { cells: { value: string }[] }) => {
      const v = row.cells.map((c) => c.value);
      return {
        [dim === "DATE" ? "date" : "domain"]: v[0],
        earnings: num(v[idx("ESTIMATED_EARNINGS")]), clicks: num(v[idx("CLICKS")]),
        impressions: num(v[idx("AD_REQUESTS")]), pageViews: num(v[idx("PAGE_VIEWS")]), rpm: num(v[idx("PAGE_VIEWS_RPM")]),
      } as AdsRow;
    });
    const t = (d.totals?.cells || []).map((c: { value: string }) => c.value);
    const totals = { earnings: num(t[idx("ESTIMATED_EARNINGS")]), clicks: num(t[idx("CLICKS")]), impressions: num(t[idx("AD_REQUESTS")]), pageViews: num(t[idx("PAGE_VIEWS")]), rpm: num(t[idx("PAGE_VIEWS_RPM")]) };
    return { ok: true, totals, rows, currency: d.totalMatchedRows ? "USD" : "USD" };
  } catch (e) {
    return { ok: false, totals: { earnings: 0, clicks: 0, impressions: 0, pageViews: 0, rpm: 0 }, rows: [], currency: "USD", error: String(e).slice(0, 200) };
  }
}
