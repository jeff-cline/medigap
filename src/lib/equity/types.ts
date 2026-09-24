// equity.direct — the 100 keyword pages.
//
// Each page IS its own keyword. A homeowner arrives on the one that matches the
// reason they are actually thinking about, and the page they landed on is the
// single most valuable thing we learn about them — it is the reason, stated
// before anyone asks. That is why the slug travels all the way into the CRM.
//
// Content rules for everything in this directory:
//   • No number is invented. Cost ranges are typical market ranges and are
//     labelled as such; anything about equity totals cites the Federal Reserve.
//   • Nothing promises approval, an amount, or a timeline. This product is
//     under active regulatory attention and the copy has to be defensible.
//   • Every page answers real questions plainly, because that is what an answer
//     engine quotes and what a homeowner actually needs.

export type CategoryKey =
  | "business"
  | "real-estate"
  | "home"
  | "debt"
  | "protection"
  | "investing"
  | "education"
  | "medical"
  | "family";

export type Faq = { q: string; a: string };

export type EquityUse = {
  /** Row number from the source list — kept so the set stays auditable. */
  n: number;
  slug: string;
  category: CategoryKey;
  /** The homeowner's reason, in their words. */
  reason: string;
  h1: string;
  /** <title>. Kept under ~60 chars where possible. */
  title: string;
  /** Meta description. ~150-160 chars. */
  description: string;
  /** Opening paragraph. Unique per page — never templated. */
  intro: string;
  /** Why homeowners reach for equity for this specific thing. */
  why: string[];
  /** The professional who typically influences this decision. */
  partner: string;
  /** Why that professional cares — drives partner recruiting. */
  partnerWhy: string;
  /** Typical market cost range, where one genuinely exists. */
  typicalRange?: string;
  faqs: Faq[];
};

export type Category = {
  key: CategoryKey;
  label: string;
  /** Shown on the homepage tile. */
  blurb: string;
  /** Category hub page copy. */
  intro: string;
  title: string;
  description: string;
};

export const CATEGORIES: Category[] = [
  {
    key: "business",
    label: "Start or grow a business",
    blurb: "Capital to launch, buy, expand, or stabilise a company.",
    title: "Home Equity for Business Funding",
    description:
      "Use the equity in your home to start, buy, or grow a business — without adding a monthly payment. See what you could access in minutes.",
    intro:
      "Most people who start or buy a business are not short of a plan. They are short of the first cheque. For a homeowner, the largest asset on the balance sheet is usually the house — and reaching it has traditionally meant taking on a monthly payment right at the moment cash flow is least predictable.",
  },
  {
    key: "real-estate",
    label: "Buy or build real estate",
    blurb: "Down payments, land, development, and investment property.",
    title: "Home Equity for Real Estate Investing",
    description:
      "Access home equity for a rental down payment, land, a flip, or a second home — without a monthly payment while the project is still in progress.",
    intro:
      "Real estate is bought with timing. The deal is available now, and the equity that would fund it is sitting in a property you already own. The difficulty has never been the value — it is that the usual ways of reaching it add a payment before the new property produces a dollar.",
  },
  {
    key: "home",
    label: "Improve your home",
    blurb: "Remodels, roofs, solar, additions, and major repairs.",
    title: "Home Equity for Home Improvement",
    description:
      "Fund a remodel, roof, addition, pool, or major repair using the equity already in your home — with no monthly payment added to the project.",
    intro:
      "There is a particular frustration in owning a home worth far more than you paid for it and still not being able to fix the roof. Improvement is the most common reason homeowners reach for equity, and it is the one where the money goes straight back into the asset it came from.",
  },
  {
    key: "debt",
    label: "Settle debt and obligations",
    blurb: "High-interest debt, tax matters, divorce, and estate settlements.",
    title: "Home Equity to Settle Debt and Obligations",
    description:
      "Use home equity to resolve high-interest debt, tax arrears, a divorce settlement, or an estate obligation — without adding another monthly bill.",
    intro:
      "Debt and legal obligations share a cruel arithmetic: the longer they sit, the more they cost. Interest compounds, penalties accrue, and settlements that were affordable become less so. Equity is often the only asset large enough to end the problem in one move rather than manage it for years.",
  },
  {
    key: "protection",
    label: "Insurance and protection",
    blurb: "Life cover, long-term care, annuities, and asset protection.",
    title: "Home Equity for Insurance and Protection Planning",
    description:
      "Fund life insurance, long-term care planning, or an annuity using home equity — a strategy that belongs in a conversation with a licensed professional.",
    intro:
      "Protection planning runs into a timing problem: the cover is needed while premiums are still affordable, and affordability is usually decided by liquidity rather than net worth. A homeowner can be asset-rich and still unable to fund the policy that protects those assets.",
  },
  {
    key: "investing",
    label: "Invest and build wealth",
    blurb: "Portfolios, private markets, metals, and alternatives.",
    title: "Home Equity for Investing and Wealth Building",
    description:
      "Access home equity to invest — with a clear-eyed look at the real risks of putting property equity into markets. Speak to a licensed advisor first.",
    intro:
      "Using property equity to invest is the reason on this list that most deserves a sober conversation. It can be sound when the plan is long, diversified, and professionally advised. It can be ruinous when it is a bet. We think the honest version of this page is the one that says both.",
  },
  {
    key: "education",
    label: "Pay for education",
    blurb: "College, graduate and professional school, and certifications.",
    title: "Home Equity to Pay for Education",
    description:
      "Fund college, graduate school, or professional training with home equity — often alongside, not instead of, federal aid. Compare before you commit.",
    intro:
      "Education costs arrive on a calendar that does not negotiate. Tuition is due in August whether or not the aid package covered it, and the gap between what a family is assessed to afford and what it actually has on hand is where most of these decisions get made.",
  },
  {
    key: "medical",
    label: "Cover medical costs",
    blurb: "Procedures, dental, fertility, and long-term care.",
    title: "Home Equity for Medical and Care Costs",
    description:
      "Use home equity for a procedure, dental work, fertility treatment, or long-term care — without a monthly payment during treatment and recovery.",
    intro:
      "Medical costs are the least discretionary reason on this list and often the most urgent. They also arrive at the worst possible moment for household cash flow, frequently alongside reduced income. Equity is what many families have instead of savings deep enough to absorb it.",
  },
  {
    key: "family",
    label: "Family and life events",
    blurb: "Helping children buy, weddings, and major purchases.",
    title: "Home Equity for Family and Life Events",
    description:
      "Help a child buy a home, fund a wedding, or make a major purchase using home equity — without taking on a new monthly payment in retirement.",
    intro:
      "A good many homeowners want to help while they are alive to see it. The money to do that is usually in the house, and the traditional route to it — a new monthly payment, often in retirement — is precisely what makes people hesitate.",
  },
];

export const categoryOf = (key: CategoryKey): Category =>
  CATEGORIES.find((c) => c.key === key)!;
