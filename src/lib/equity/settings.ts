import { db } from "@/lib/db";

// Settings you can change from the back office without a deploy.
//
// Stored in the Core's Setting table (key/value) rather than in env, because
// the point is that the redirect destination and the phone number change when
// the business changes, not when we ship code.

export type EquitySettings = {
  /** Where a homeowner is sent after the form is submitted. Blank = stay put. */
  redirectUrl: string;
  /** How long they see the confirmation before the redirect fires, in seconds. */
  redirectDelay: number;
  /** Shown across the site instead of an email address. */
  phone: string;
  /** Who gets a notification when a lead arrives. Comma-separated. */
  alertEmails: string;
};

export const DEFAULTS: EquitySettings = {
  redirectUrl: "",
  redirectDelay: 4,
  phone: "(972) 800-6670",
  alertEmails: "",
};

const KEYS: Record<keyof EquitySettings, string> = {
  redirectUrl: "equity.redirectUrl",
  redirectDelay: "equity.redirectDelay",
  phone: "equity.phone",
  alertEmails: "equity.alertEmails",
};

export async function getEquitySettings(): Promise<EquitySettings> {
  const rows = await db.setting
    .findMany({ where: { key: { in: Object.values(KEYS) } } })
    .catch(() => [] as { key: string; value: string }[]);
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const delay = Number(map.get(KEYS.redirectDelay));
  return {
    redirectUrl: map.get(KEYS.redirectUrl) ?? DEFAULTS.redirectUrl,
    // Clamped: zero feels like a hijack, and a long wait means they leave first.
    redirectDelay: Number.isFinite(delay) ? Math.min(30, Math.max(0, delay)) : DEFAULTS.redirectDelay,
    phone: map.get(KEYS.phone) || DEFAULTS.phone,
    alertEmails: map.get(KEYS.alertEmails) ?? DEFAULTS.alertEmails,
  };
}

export async function saveEquitySettings(s: Partial<EquitySettings>) {
  const entries: [string, string][] = [];
  if (s.redirectUrl !== undefined) entries.push([KEYS.redirectUrl, safeUrl(s.redirectUrl)]);
  if (s.redirectDelay !== undefined) {
    entries.push([KEYS.redirectDelay, String(Math.min(30, Math.max(0, Number(s.redirectDelay) || 0)))]);
  }
  if (s.phone !== undefined) entries.push([KEYS.phone, String(s.phone).slice(0, 40)]);
  if (s.alertEmails !== undefined) entries.push([KEYS.alertEmails, String(s.alertEmails).slice(0, 500)]);

  for (const [key, value] of entries) {
    await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
}

/**
 * Only http(s) destinations. A redirect target is followed automatically by
 * someone's browser straight after they hand over their details, so a
 * javascript: or data: URL here would be an open redirect with an audience.
 */
function safeUrl(raw: string): string {
  const v = String(raw ?? "").trim();
  if (!v) return "";
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : "";
  } catch {
    return "";
  }
}

/** Digits only, for tel: links. */
export const telHref = (phone: string) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;
