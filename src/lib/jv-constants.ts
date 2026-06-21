// Client-safe JV constants (NO database imports) so client components can use them
// without pulling Prisma into the browser bundle.

export const JV_TAG = "jv-pe-vc-op";

export const FOUNDER = {
  name: "Jeff Cline",
  title: "Founder",
  email: "jeff.cline@me.com",
  cell: "9728006670", // replies + alerts forward here
  calendly: "https://calendly.com/jdcline",
};

export const TOLLFREE_DISPLAY = "1-800-MEDIGAP";
export const TOLLFREE_E164 = "+18006334427";

export type InterestOpt = { key: string; label: string; cta: string; blurb: string };

// The "Express your interest" options — the exact set the founder wants offered.
export const JV_INTERESTS: InterestOpt[] = [
  { key: "zip_sponsorship", label: "ZIP code sponsorship", cta: "Sponsor a ZIP", blurb: "Own the leads from a single ZIP under 1-800-MEDIGAP." },
  { key: "city_sponsorship", label: "City sponsorship", cta: "Sponsor a City", blurb: "Lock a metro market and its inbound calls." },
  { key: "state_sponsorship", label: "State sponsorship", cta: "Sponsor a State", blurb: "Exclusive statewide rights under the vanity brand." },
  { key: "nationwide_takeover", label: "Nationwide takeover", cta: "Nationwide Takeover", blurb: "Take over the brand nationally." },
  { key: "advertising", label: "Advertising", cta: "Advertise With Us", blurb: "Buy CPC / call inventory across the network." },
  { key: "investor", label: "Investor", cta: "Investor Inquiry", blurb: "Come in at the top of a billion-dollar market." },
  { key: "hot_transfer_moneywords", label: "Hot transfer / money words", cta: "Hot-Transfer Partner", blurb: "Receive live hot-transfer calls on high-intent money words." },
];

// Legacy interest keys (used by some dedicated landing pages) → readable labels.
const LEGACY_LABELS: Record<string, string> = {
  sponsor_zip: "ZIP code sponsorship",
  sponsor_city: "City sponsorship",
  sponsor_state: "State sponsorship",
  sponsor_national: "Nationwide sponsorship",
  lock_zip: "Agent — lock in ZIP",
  brand_takeover: "Brand takeover",
  exclusive: "Exclusive strategic partner",
  book_call: "Book a call",
};

export const interestLabel = (key: string) =>
  JV_INTERESTS.find((i) => i.key === key)?.label || LEGACY_LABELS[key] || key || "—";

// Account types a prospect could set up across the platform (listed on the hub).
export const ACCOUNT_OPTIONS: { label: string; href: string; availability: string }[] = [
  { label: "Investor", href: "/investors", availability: "By invitation — limited allocation at the top." },
  { label: "Marketing Partner (white-label site)", href: "/onboard", availability: "Open — launch your own branded lead-gen site." },
  { label: "Agent (pay-per-call + ZIP seats)", href: "/agents", availability: "Open — buy a ZIP/state/national seat and bid on calls." },
  { label: "Advertiser (CPC inventory)", href: "/advertise", availability: "Open — prepaid CPC across the network." },
  { label: "Money-Word Partner", href: "/money-words", availability: "Open — own a high-intent keyword and its hot-transfer calls." },
  { label: "Carrier / Risk Partner", href: "/risk-partners", availability: "Selective — carrier sweeps & autonomous risk." },
  { label: "Upsell Vendor", href: "/upsell-vendors", availability: "Open — live upsell to qualified seniors." },
];

export const PRIORITIES = ["high", "medium", "low"] as const;
export const priorityRank = (p: string) => (p === "high" ? 3 : p === "medium" ? 2 : p === "low" ? 1 : 0);
