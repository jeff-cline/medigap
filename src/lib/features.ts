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

// ---------------------------------------------------------------------------
// CORE DASHBOARD ACCESS — which left-nav sections a restricted account (e.g. a
// Developer) may see. Stored in the SAME User.features JSON, but each entry is
// namespaced "nav:<href>" so it never collides with the partner FeatureKeys
// above (parseFeatures filters those to ALL_KEYS and ignores nav: entries).
// ---------------------------------------------------------------------------
export const NAV_PREFIX = "nav:";

// Grantable Core sections, mirroring the dashboard left navigation. The God
// account toggles these per user in User Management. Developer is first.
export const CORE_ACCESS: { href: string; label: string }[] = [
  { href: "/dashboard/developer", label: "Developer" },
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/unified", label: "Unified" },
  { href: "/dashboard/jv", label: "JV / PE / VC" },
  { href: "/dashboard/leads", label: "Leads CRM" },
  { href: "/dashboard/calls", label: "Calls" },
  { href: "/dashboard/social", label: "Social & Creators" },
  { href: "/dashboard/playbook", label: "Playbook Funnel" },
  { href: "/dashboard/voice-agent", label: "Train Agent" },
  { href: "/dashboard/ai-spend", label: "AI Spend" },
  { href: "/dashboard/tv", label: "TV Commercials" },
  { href: "/dashboard/medigapp", label: "Medig.app" },
  { href: "/dashboard/sites", label: "Marketing Sites" },
  { href: "/dashboard/seo-plan", label: "SEO Silo Plan" },
  { href: "/dashboard/qr", label: "QR Tracking" },
  { href: "/dashboard/partners", label: "Affiliate Partners" },
  { href: "/dashboard/affiliates", label: "Affiliate Network" },
  { href: "/dashboard/u65", label: "U65" },
  { href: "/dashboard/followup", label: "Follow-Up" },
  { href: "/dashboard/payouts", label: "Partner Payouts" },
  { href: "/dashboard/marketing", label: "Marketing / Ads" },
  { href: "/dashboard/integrations", label: "Integrations" },
  { href: "/dashboard/mammo", label: "Mammo Express" },
  { href: "/dashboard/equity", label: "equity.direct" },
  { href: "/dashboard/form-spam", label: "Form Spam" },
  { href: "/core-api", label: "CORE API & SDK" },
  { href: "/dashboard/users", label: "User Management" },
  { href: "/dashboard/settings", label: "Settings" },
];

function rawFeatureList(featuresJson?: string | null): string[] {
  if (!featuresJson || !featuresJson.trim()) return [];
  try {
    const a = JSON.parse(featuresJson);
    return Array.isArray(a) ? a.map((k) => String(k)) : [];
  } catch {
    return [];
  }
}

// Set of nav hrefs a restricted account may see.
export function grantedNavHrefs(featuresJson?: string | null): Set<string> {
  return new Set(rawFeatureList(featuresJson).filter((k) => k.startsWith(NAV_PREFIX)).map((k) => k.slice(NAV_PREFIX.length)));
}

// Save nav grants while preserving any partner features, and vice versa —
// both live in the one User.features string.
export function withNavGrants(featuresJson: string | null | undefined, hrefs: string[]): string {
  const nonNav = rawFeatureList(featuresJson).filter((k) => !k.startsWith(NAV_PREFIX));
  return JSON.stringify([...nonNav, ...hrefs.map((h) => NAV_PREFIX + h)]);
}
export function withPartnerFeatures(featuresJson: string | null | undefined, keys: string[]): string {
  const navOnly = rawFeatureList(featuresJson).filter((k) => k.startsWith(NAV_PREFIX));
  return JSON.stringify([...keys, ...navOnly]);
}

// A brand-new Developer account sees only the Developer section until the God
// account grants more.
export const DEFAULT_DEVELOPER_FEATURES = JSON.stringify([NAV_PREFIX + "/dashboard/developer"]);
