// The exact wording a homeowner agrees to, stored verbatim on the lead.
//
// Kept in one place, as a constant, for a specific reason: if this text is ever
// disputed, we need to show what was on screen at the moment they ticked the
// box — not a reconstruction. Changing it means changing the version below, so
// older leads keep the wording they actually saw.
//
// This is a marketing and lead-referral site. It is not a lender, and the
// disclaimers say so in the places a reader will actually look.

export const CONSENT_VERSION = "2026-09-1";

export const CONSENT_TEXT =
  "By ticking this box I agree that Equity Direct and the partner it matches me with " +
  "may contact me at the phone number and email address I provided — including by " +
  "automated dialing system, prerecorded message, and text — about home equity " +
  "options. I understand consent is not a condition of any purchase or service, that " +
  "message and data rates may apply, and that I can opt out at any time by replying " +
  "STOP or asking to be removed.";

/** Shown under the form, not hidden behind a link. */
export const FORM_DISCLOSURE =
  "Checking your options here is free and does not affect your credit score. " +
  "Equity Direct is not a lender and does not make credit decisions.";

/** Site-wide footer disclosure. */
export const SITE_DISCLOSURE =
  "Equity Direct is a marketing and referral service, not a lender, broker, or " +
  "financial adviser. We do not make credit decisions or offer financial, tax, or " +
  "legal advice. Home equity agreements are not loans; they are contracts that give " +
  "an investor a share of your home's future value, are secured against your property, " +
  "and must be settled in full when they end — usually on sale, refinance, or at the " +
  "end of the term. They are not suitable for everyone. Availability, terms, and " +
  "eligibility vary by state and by provider, and not all applicants qualify. Read any " +
  "agreement in full and consider independent advice before you sign.";

/**
 * The funding-speed claim, in the one form we are willing to make it.
 *
 * "As quickly as 3 days" is a best case for applicants who are already fully
 * approved, and it is stated that way everywhere it appears. An unqualified
 * speed claim on a consumer financial product is exactly the sort of thing that
 * draws regulatory attention, and the qualified version converts nearly as well.
 */
export const SPEED_CLAIM = "Funding in as quickly as 3 days for qualified applicants.";
export const SPEED_FOOTNOTE =
  "Timing is not guaranteed. Three days reflects a best case for applicants who have " +
  "completed approval and whose property, title, and valuation are already clear. Most " +
  "take longer, and some do not qualify at all.";

/**
 * Sourced statistics. Every number on the site that is not ours comes from
 * here, with its source, so a claim can always be traced to something.
 */
export const STATS = {
  ownersEquity: {
    value: "$35.8 trillion",
    label: "held by US homeowners as equity in their real estate",
    source: "Federal Reserve, Financial Accounts of the United States (Z.1), Q2 2026",
    href: "https://www.federalreserve.gov/releases/z1/",
  },
  householdRealEstate: {
    value: "$49.8 trillion",
    label: "total market value of household real estate",
    source: "Federal Reserve, Financial Accounts of the United States (Z.1), Q2 2026",
    href: "https://www.federalreserve.gov/releases/z1/",
  },
  equityShare: {
    value: "71.9%",
    label: "of household real estate value is owners' equity",
    source: "Federal Reserve, Financial Accounts of the United States (Z.1), Q2 2026",
    href: "https://www.federalreserve.gov/releases/z1/",
  },
} as const;
