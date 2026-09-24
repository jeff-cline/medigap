// Client beacon shared by the React consent bar + the site-wide NetTracker. Manages a first-party
// pc_vid cookie (so hosts without the middleware rocket_vid cookie still group by visitor) and
// dedups the pageview so multiple components on one page don't double-count.
export function pcVid(): string {
  try {
    const m = document.cookie.split("; ").find((c) => c.startsWith("pc_vid="));
    if (m) return m.slice(7);
    const v = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    document.cookie = `pc_vid=${v}; path=/; max-age=63072000; samesite=lax`;
    return v;
  } catch { return ""; }
}

export function pcBeacon(kind: string): void {
  try {
    if (kind === "pageview") { const w = window as unknown as { __pcPV?: number }; if (w.__pcPV) return; w.__pcPV = 1; }
    const body = JSON.stringify({ site: location.hostname.replace(/^www\./, ""), path: location.pathname, kind, vid: pcVid() });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/net/track", new Blob([body], { type: "application/json" }));
    else fetch("/api/net/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch { /* never block the page */ }
}
