// Network click capture + leads (Layer 1 of the CDP). Append-only JSONL so it can't
// break the redirect path and needs no DB migration. Groups clicks into "visitors" by a
// first-party id when present, else IP. Identity append (PredictiveData/RetargetIQ/Datamoon)
// enriches these records in a later layer.
import fs from "fs";
import path from "path";

const DIR = process.env.NETWORK_DATA_DIR || "/var/www/medigap-data";
const FILE = path.join(DIR, "network-clicks.jsonl");
try { fs.mkdirSync(DIR, { recursive: true }); } catch {}

export type NetClick = { at: string; vid: string; keyword: string; dest: string; ip: string; ua: string; referer: string };

export function logNetworkClick(c: Omit<NetClick, "at">): void {
  try { fs.appendFileSync(FILE, JSON.stringify({ at: new Date().toISOString(), ...c }) + "\n"); } catch {}
}

export function readClicks(limit = 5000): NetClick[] {
  let lines: string[] = [];
  try { lines = fs.readFileSync(FILE, "utf8").trim().split("\n").filter(Boolean); } catch { return []; }
  return lines.slice(-limit).map((l) => { try { return JSON.parse(l) as NetClick; } catch { return null; } }).filter(Boolean) as NetClick[];
}

// visitor key: first-party vid if we have one, else IP (soft identity)
export const visitorKey = (c: NetClick) => c.vid || c.ip || "unknown";

// First-party pageviews across network sites (quuik.com, siimpler.com, el.ag) — the VID beacon.
const EVENTS = path.join(DIR, "network-events.jsonl");
export type NetEvent = { at: string; vid: string; site: string; path: string; kind: string; ip: string; ua: string; referer: string };
export function logNetworkEvent(e: Omit<NetEvent, "at">): void {
  try { fs.appendFileSync(EVENTS, JSON.stringify({ at: new Date().toISOString(), ...e }) + "\n"); } catch {}
}
export function readEvents(limit = 8000): NetEvent[] {
  try { return fs.readFileSync(EVENTS, "utf8").trim().split("\n").filter(Boolean).slice(-limit).map((l) => { try { return JSON.parse(l) as NetEvent; } catch { return null; } }).filter(Boolean) as NetEvent[]; } catch { return []; }
}

function device(ua: string): string {
  const u = (ua || "").toLowerCase();
  const os = /iphone|ipad|ios/.test(u) ? "iOS" : /android/.test(u) ? "Android" : /mac os/.test(u) ? "Mac" : /windows/.test(u) ? "Windows" : /linux/.test(u) ? "Linux" : "—";
  const br = /edg\//.test(u) ? "Edge" : /chrome|crios/.test(u) ? "Chrome" : /firefox|fxios/.test(u) ? "Firefox" : /safari/.test(u) ? "Safari" : "—";
  const mobile = /mobile|iphone|android/.test(u);
  return `${br} · ${os}${mobile ? " · mobile" : ""}`;
}

export type Lead = {
  key: string; vid: string; ip: string; device: string;
  clicks: number; keywords: string[]; firstSeen: string; lastSeen: string;
  identified: boolean; journey: NetClick[];
};

export function buildLeads(clicks?: NetClick[]): Lead[] {
  const all = clicks || readClicks();
  const byKey = new Map<string, NetClick[]>();
  for (const c of all) { const k = visitorKey(c); if (!byKey.has(k)) byKey.set(k, []); byKey.get(k)!.push(c); }
  const leads: Lead[] = [];
  for (const [key, cs] of byKey) {
    const sorted = cs.slice().sort((a, b) => a.at < b.at ? -1 : 1);
    const last = sorted[sorted.length - 1];
    leads.push({
      key, vid: last.vid || "", ip: last.ip || "", device: device(last.ua),
      clicks: sorted.length,
      keywords: Array.from(new Set(sorted.map((c) => c.keyword))),
      firstSeen: sorted[0].at, lastSeen: last.at,
      identified: false, // flips true once identity append lands (Layer 2)
      journey: sorted.reverse(),
    });
  }
  return leads.sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : -1));
}

export function leadByKey(key: string): Lead | null {
  return buildLeads().find((l) => l.key === key) || null;
}

export function clicksForKeyword(keyword: string): NetClick[] {
  return readClicks().filter((c) => c.keyword === keyword).reverse();
}

export function networkStats() {
  const clicks = readClicks();
  const leads = buildLeads(clicks);
  return { totalClicks: clicks.length, visitors: leads.length, identified: leads.filter((l) => l.identified).length };
}
