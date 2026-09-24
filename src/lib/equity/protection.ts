import type { EquityUse } from "./types";

// Rows 59–65 — insurance, annuities, and asset protection.
//
// Every page in this category involves a commissioned product. The copy says so
// plainly. A homeowner who reads these pages should come away understanding both
// the legitimate planning case and the fact that the person recommending it is
// usually paid on the premium — that is not an accusation, it is a disclosure
// they are entitled to.
export const PROTECTION: EquityUse[] = [
  {
    n: 59,
    slug: "life-insurance-premium",
    category: "protection",
    reason: "Pay a life insurance premium",
    h1: "Using Home Equity to Pay a Life Insurance Premium",
    title: "Home Equity for Life Insurance Premiums | Equity Direct",
    description:
      "Fund a life insurance premium from home equity — keeping cover in force, or securing it while you still qualify.",
    intro:
      "Life insurance has an unforgiving relationship with time. Premiums rise with age, health events can make cover unobtainable at any price, and a policy that lapses for non-payment cannot always be replaced. Where cover is genuinely needed, funding the premium is frequently a timing problem rather than an affordability one.",
    why: [
      "Premiums increase with age, and a health change can make new cover unavailable entirely.",
      "A lapsed policy may not be replaceable on the same terms, or at all.",
      "Term conversion options generally expire on a deadline set by the policy.",
    ],
    partner: "Life insurance agents",
    partnerWhy: "Policy commission, typically weighted heavily to the first year's premium.",
    faqs: [
      {
        q: "Does it make sense to fund insurance premiums this way?",
        a: "It can where the cover is genuinely needed — protecting dependents, funding a buy-sell agreement, or providing estate liquidity — and where lapsing would lose something irreplaceable. It makes considerably less sense as a way to buy more cover than the situation requires.",
      },
      {
        q: "How do I know how much cover I actually need?",
        a: "A common starting point is income replacement for the years dependents rely on it, plus debts, plus education costs, less existing assets and cover. Be aware that the person calculating this for you is usually paid on the resulting premium — a fee-only planner has no such interest.",
      },
      {
        q: "What is a conversion deadline?",
        a: "Many term policies allow conversion to permanent cover without new medical underwriting, but only before a stated age or date. If that deadline is approaching and your health has changed, converting can be extremely valuable — and the deadline does not move.",
      },
      {
        q: "What if I can no longer afford an existing policy?",
        a: "Before letting it lapse, ask about reduced paid-up cover, a lower face amount, or using accumulated cash value to pay premiums. A life settlement may also be possible for older insureds. Lapsing without exploring these gives away whatever the policy has built.",
      },
    ],
  },
  {
    n: 60,
    slug: "single-premium-life-insurance",
    category: "protection",
    reason: "Fund single-premium life insurance",
    h1: "Using Home Equity for Single-Premium Life Insurance",
    title: "Home Equity for Single-Premium Life | Equity Direct",
    description:
      "Fund a single-premium life policy from home equity — one payment, permanent cover, and a commission structure worth understanding.",
    intro:
      "Single-premium life converts a lump sum into permanent cover with one payment and no further premiums. The structure suits estate liquidity and legacy planning. It also pays the selling agent a commission on the entire premium at once, which is worth knowing before the conversation rather than after.",
    why: [
      "One payment secures permanent cover with no ongoing premium obligation.",
      "The death benefit is typically substantially larger than the premium paid.",
      "Commission is calculated on the full single premium, so incentives are concentrated.",
    ],
    partner: "Life insurance agents",
    partnerWhy: "A single large premium produces a correspondingly large first-year commission.",
    faqs: [
      {
        q: "What is single-premium life insurance?",
        a: "Permanent life cover purchased with one lump-sum payment rather than ongoing premiums. The policy is fully paid up immediately, builds cash value, and pays a death benefit typically well above the premium. It is most often used for legacy and estate liquidity purposes.",
      },
      {
        q: "What is a modified endowment contract?",
        a: "Single-premium policies are generally classified as MECs, which changes the tax treatment of withdrawals and loans during life — they become taxable on a gains-first basis and may incur a penalty before age 59½. The death benefit is generally unaffected. Make sure this is explained to you, because it materially affects flexibility.",
      },
      {
        q: "Is this a good use of home equity?",
        a: "It depends entirely on whether the need is real. For estate liquidity or a specific legacy intention it can be efficient. As a general investment it rarely competes with simpler alternatives, and the commission structure means you should seek a second opinion from someone not paid on the outcome.",
      },
      {
        q: "Can I access the money if I need it?",
        a: "There is cash value, but surrender charges typically apply for a number of years and MEC tax treatment makes withdrawals less efficient. Treat the premium as committed. Do not fund this with money you may need back.",
      },
    ],
  },
  {
    n: 61,
    slug: "indexed-universal-life",
    category: "protection",
    reason: "Fund an indexed universal life policy",
    h1: "Using Home Equity to Fund an Indexed Universal Life Policy",
    title: "Home Equity for Indexed Universal Life | Equity Direct",
    description:
      "Fund an IUL policy from home equity — with a clear explanation of caps, participation rates, and what illustrations do not show.",
    intro:
      "Indexed universal life is among the most heavily marketed and most frequently misunderstood products in financial services. It offers cover with cash value linked to an index, subject to a floor and a cap. The floor is genuine. The cap, the participation rate, and the cost of insurance are what determine whether the result resembles the illustration.",
    why: [
      "Combines permanent cover with index-linked cash value growth subject to a floor.",
      "Caps, participation rates, and spreads limit the upside and are usually adjustable by the insurer.",
      "Cost of insurance rises with age and is deducted from cash value, which compounds in later years.",
    ],
    partner: "Insurance agents",
    partnerWhy: "Among the higher-commission products in the market.",
    faqs: [
      {
        q: "How does an IUL actually work?",
        a: "Premiums fund a policy whose cash value is credited based on an index's movement, subject to a cap on the upside and a floor — usually zero — on the downside. Cost of insurance and policy charges are deducted from cash value. You do not receive dividends from the index.",
      },
      {
        q: "What should I look at in the illustration?",
        a: "Ask for the guaranteed column, not just the illustrated one, and ask what happens if credited rates are lower than illustrated for a sustained period. Ask whether the cap and participation rate can be changed by the insurer after issue — for most policies they can.",
      },
      {
        q: "Is an IUL a good investment?",
        a: "It is an insurance product with an investment component, and it is generally most defensible when the insurance need is real and permanent. If the primary objective is investment return, compare candidly against simpler alternatives with a fee-only advisor who earns nothing from the decision.",
      },
      {
        q: "What happens if I stop funding it?",
        a: "Cost of insurance continues to be deducted from cash value. An underfunded policy can erode and eventually lapse, potentially with a tax consequence on any outstanding loans. These policies require ongoing attention rather than being set and forgotten.",
      },
    ],
  },
  {
    n: 62,
    slug: "whole-life-policy",
    category: "protection",
    reason: "Fund a whole life policy",
    h1: "Using Home Equity to Fund a Whole Life Policy",
    title: "Home Equity for Whole Life Insurance | Equity Direct",
    description:
      "Fund whole life cover from home equity — guaranteed premiums, guaranteed cash value, and a slow start worth understanding.",
    intro:
      "Whole life is the most conservative permanent insurance: a guaranteed premium, a guaranteed death benefit, and cash value that accumulates on a contractual schedule, often with dividends from a mutual insurer. It is also slow to build, and the early years favour the insurer and the agent rather than the policyholder.",
    why: [
      "Premiums and death benefit are guaranteed and do not change with age or health.",
      "Cash value accumulates on a contractual basis, with dividends possible from mutual insurers.",
      "Early-year cash value is typically well below cumulative premiums paid.",
    ],
    partner: "Insurance agents",
    partnerWhy: "Substantial first-year commission on a long-duration premium.",
    faqs: [
      {
        q: "Whole life or term?",
        a: "Term covers a defined period at a far lower premium and suits most temporary needs — a mortgage, children's dependency. Whole life suits permanent needs: estate liquidity, a special-needs dependent, a buy-sell obligation. Buying whole life for a temporary need is the common and expensive error.",
      },
      {
        q: "How long before the cash value is meaningful?",
        a: "Typically many years. Early premiums largely fund the cost of insurance and the commission, so surrendering in the first decade usually returns considerably less than was paid in. This is a long-horizon commitment by design.",
      },
      {
        q: "Are dividends guaranteed?",
        a: "No. Dividends from a mutual insurer are declared annually and are not guaranteed, though established mutuals have long records of paying them. An illustration showing projected dividends is a projection, not a promise.",
      },
      {
        q: "Should I fund this from home equity?",
        a: "Only where the permanent need is genuine and the policy is appropriately sized. Given the commission structure and the long payback, a second opinion from a fee-only planner before committing equity is time well spent.",
      },
    ],
  },
  {
    n: 63,
    slug: "fund-annuity",
    category: "protection",
    reason: "Fund an annuity",
    h1: "Using Home Equity to Fund an Annuity",
    title: "Home Equity to Fund an Annuity | Equity Direct",
    description:
      "Convert home equity into guaranteed income through an annuity — and understand surrender periods before you commit.",
    intro:
      "An annuity converts a lump sum into income you cannot outlive, which addresses a genuine problem: retirees rarely know how long the money must last. The trade-off is liquidity. Most annuities carry a surrender schedule measured in years, and the money is meaningfully committed for that period.",
    why: [
      "Converts a lump sum into income that continues regardless of how long you live.",
      "Surrender charges typically apply for a number of years after purchase.",
      "Product complexity varies enormously between immediate, fixed, indexed, and variable annuities.",
    ],
    partner: "Insurance and annuity agents",
    partnerWhy: "Product compensation, which varies considerably by annuity type.",
    faqs: [
      {
        q: "What kind of annuity should I consider?",
        a: "A single premium immediate annuity is the simplest — a lump sum for income beginning now, with transparent pricing. Fixed deferred annuities are straightforward. Indexed and variable annuities are considerably more complex and generally carry higher compensation. Simplicity and cost usually move together.",
      },
      {
        q: "What is a surrender period?",
        a: "The number of years during which withdrawing more than a permitted amount incurs a charge, often starting high and declining annually. Know the full schedule before purchasing, and do not commit money you may need during that window.",
      },
      {
        q: "Is funding an annuity with home equity sensible?",
        a: "It is a substantial decision that converts a flexible asset into an illiquid income stream. For a retiree genuinely worried about outliving their money it can address a real risk. It deserves review by an advisor with no stake in the product — ideally a fee-only one.",
      },
      {
        q: "What happens to the money when I die?",
        a: "It depends entirely on the option chosen. A life-only annuity pays the most and stops at death. Period-certain, joint-life, and refund options pay less but protect heirs. Choosing life-only without understanding this is a frequent and irreversible mistake.",
      },
    ],
  },
  {
    n: 64,
    slug: "long-term-care-planning",
    category: "protection",
    reason: "Long-term care planning",
    h1: "Using Home Equity for Long-Term Care Planning",
    title: "Home Equity for Long-Term Care Planning | Equity Direct",
    description:
      "Fund long-term care insurance or a hybrid policy from home equity — the expense most retirement plans quietly omit.",
    intro:
      "Long-term care is the largest uninsured risk in most retirement plans. Medicare does not cover extended custodial care, the cost of a care home runs to thousands a month, and the households that need it most are frequently the ones whose savings it exhausts fastest.",
    why: [
      "Medicare does not pay for extended custodial long-term care.",
      "Premiums rise sharply with age, and health changes can make cover unobtainable.",
      "Hybrid life-and-care policies address the historical objection that premiums are wasted if care is never needed.",
    ],
    partner: "Insurance agents and senior care advisors",
    partnerWhy: "Policy compensation on a product with a genuine and growing need.",
    faqs: [
      {
        q: "Does Medicare cover long-term care?",
        a: "Generally no. Medicare covers limited skilled nursing after a qualifying hospital stay, not extended custodial care — help with bathing, dressing, and daily living, which is what most people actually need. Medicaid covers it only after assets are largely spent down.",
      },
      {
        q: "When should I buy long-term care cover?",
        a: "Most people who buy do so in their fifties or early sixties. Earlier means lower premiums and a better chance of qualifying medically; later means paying premiums for fewer years but at a much higher rate, if you can still qualify at all.",
      },
      {
        q: "What is a hybrid policy?",
        a: "Life insurance or an annuity with a long-term care benefit attached. If care is needed, the benefit pays for it; if not, a death benefit passes to heirs. This addresses the main objection to traditional policies — paying premiums for years and possibly never claiming.",
      },
      {
        q: "Can I self-fund instead?",
        a: "Some households can, and for very substantial estates it is often the sensible answer. The difficulty is that care costs are unpredictable in both duration and intensity, and a long dementia case can exhaust a reserve that looked ample. Model a bad case, not an average one.",
      },
    ],
  },
  {
    n: 65,
    slug: "asset-protection-strategy",
    category: "protection",
    reason: "Fund an asset protection strategy",
    h1: "Using Home Equity to Fund an Asset Protection Strategy",
    title: "Home Equity for Asset Protection | Equity Direct",
    description:
      "Fund legitimate asset protection planning from home equity — structures set up properly, and well before any claim exists.",
    intro:
      "Asset protection is a legitimate area of planning and an industry with a fringe attached to it. Done properly — by an attorney, in advance of any claim, with structures that are respected because they are real — it works. Done as a reaction to a claim already on the horizon, it is a fraudulent transfer and makes matters worse.",
    why: [
      "Professionals in high-liability fields face exposure beyond what insurance covers.",
      "Entity structures, trusts, and umbrella cover all have real setup and maintenance costs.",
      "Timing is decisive: transfers made after a claim arises are generally reversible by a court.",
    ],
    partner: "Asset protection attorneys and advisors",
    partnerWhy: "Structuring and ongoing maintenance work.",
    faqs: [
      {
        q: "What does legitimate asset protection involve?",
        a: "Usually a combination of adequate liability insurance including umbrella cover, appropriate business entities, retirement accounts that enjoy statutory protection, and in some cases trusts. The unglamorous items — insurance and proper entity maintenance — do most of the work.",
      },
      {
        q: "When is it too late?",
        a: "Once a claim exists or is reasonably foreseeable, transferring assets to avoid it is a fraudulent transfer. Courts unwind it, and it can expose you to worse outcomes including contempt. Protection planning only works when done well before it is needed.",
      },
      {
        q: "Are offshore structures worth considering?",
        a: "They are expensive, carry significant reporting obligations with serious penalties for failure, and attract scrutiny. For most people domestic planning achieves the realistic objective at a fraction of the cost and complexity. Be very cautious of anyone leading with an offshore pitch.",
      },
      {
        q: "Is my home already protected?",
        a: "Possibly, in part. Homestead exemptions protect home equity from creditors to varying degrees by state — unlimited in a few, modest in many. Know your state's position before assuming either that your home is safe or that it is exposed.",
      },
    ],
  },
];
