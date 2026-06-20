// Per-partner portal feature toggles, controlled from the God account.
// The God account turns these tabs/functions on or off for each marketing partner
// at leisure. The base CRM (account + assigned leads) is ALWAYS included.

export type FeatureKey =
  | "account"
  | "leads"
  | "upgrade"
  | "bids"
  | "seats"
  | "affiliate"
  | "branding"
  | "statement";

export const PARTNER_FEATURES: { key: FeatureKey; label: string; desc: string }[] = [
  { key: "account", label: "Account & Availability", desc: "Transfer number, add funds, take-calls switch." },
  { key: "leads", label: "My Leads CRM", desc: "Assigned contacts — the base CRM." },
  { key: "upgrade", label: "Grow Your Site (upsells)", desc: "One-click marketing builds via Stripe." },
  { key: "bids", label: "Live-Call Bidding", desc: "Bid by money word / ZIP / state / national." },
  { key: "seats", label: "Territory Seats", desc: "Buy ZIP / State / Nationwide coverage." },
  { key: "affiliate", label: "Affiliate Earnings", desc: "Rev-share on overflow leads we sell." },
  { key: "branding", label: "Branding Editor", desc: "Logo, colors, hero, custom footer links." },
  { key: "statement", label: "Payout Statement", desc: "Monthly statement, paid on the 21st." },
];

// Base CRM is always on regardless of what the God account toggled.
export const ALWAYS_ON: FeatureKey[] = ["account", "leads"];

// When a partner has no explicit feature list yet (features === ""), everything is on
// by default — so existing partners are never silently locked out. Once the God account
// saves an explicit list, that list governs (plus the always-on base CRM).
const ALL_KEYS = PARTNER_FEATURES.map((f) => f.key);

export function parseFeatures(featuresJson: string | null | undefined): FeatureKey[] | null {
  if (!featuresJson || !featuresJson.trim()) return null; // null => "defaults (all on)"
  try {
    const arr = JSON.parse(featuresJson);
    if (Array.isArray(arr)) return arr.filter((k): k is FeatureKey => ALL_KEYS.includes(k));
  } catch {}
  return null;
}

export function hasFeature(featuresJson: string | null | undefined, key: FeatureKey): boolean {
  if (ALWAYS_ON.includes(key)) return true;
  const list = parseFeatures(featuresJson);
  if (list === null) return true; // no explicit config yet => all on
  return list.includes(key);
}

// The set of keys currently enabled (for rendering the God toggle grid as checked/unchecked).
export function enabledSet(featuresJson: string | null | undefined): FeatureKey[] {
  const list = parseFeatures(featuresJson);
  return list === null ? [...ALL_KEYS] : Array.from(new Set([...ALWAYS_ON, ...list]));
}
