// QR helpers. The QR IMAGE is rendered by a free generator (no dependency); TRACKING is ours —
// the QR encodes /q/<code> which logs the scan and redirects to the target.
export const QR_BASE = "https://1-800-medigap.com";

export function trackingUrl(code: string): string {
  return `${QR_BASE}/q/${code}`;
}

// QR image for arbitrary data (we pass our own tracking URL).
export function qrImage(data: string, size = 240): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(data)}`;
}

// Deterministic code for an auto per-page QR. `path` is the page path (e.g. "medicare" or
// "medicare/medicare-vs-medicaid"); slashes are encoded as "_" so it's URL-safe in /q/<code>.
export function pageCode(path: string): string {
  return "p-" + path.replace(/^\//, "").replace(/\//g, "_").replace(/[^a-z0-9_-]/gi, "-").toLowerCase().slice(0, 80);
}
// Reverse: a page code → its target URL.
export function pageTargetFromCode(code: string): string | null {
  if (!code.startsWith("p-")) return null;
  return `${QR_BASE}/${code.slice(2).replace(/_/g, "/")}`;
}

export function randomCode(): string {
  // short, URL-safe, time-free (Math.random allowed in app runtime)
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 5);
}
