import type { EquityUse } from "./types";

// Rows 46–58 — debt, tax, legal, and settlement obligations.
//
// This category needs the most careful copy on the site. Several of these
// pages are read by people under real financial pressure, and the honest
// answer to "should I put my house behind this?" is frequently "not yet, and
// here is who to speak to first". Pages that say so earn more trust than ones
// that do not, and they are also the defensible ones.
export const DEBT: EquityUse[] = [
  {
    n: 46,
    slug: "pay-off-credit-card-debt",
    category: "debt",
    reason: "Pay off credit card debt",
    h1: "Using Home Equity to Pay Off Credit Card Debt",
    title: "Home Equity to Pay Off Credit Cards | Equity Direct",
    description:
      "Clear high-interest credit card balances using home equity — and understand what you are trading before you do it.",
    intro:
      "Credit card interest at current rates compounds faster than most households can pay down principal, which is how balances become permanent. Converting that into a commitment against your home can end the cycle — but it also converts unsecured debt into something attached to where you live, and that deserves to be said plainly.",
    why: [
      "Revolving balances at high APRs can consume a large share of each payment as interest alone.",
      "Minimum payments are structured to extend repayment over many years.",
      "Clearing the balances restores monthly cash flow immediately.",
    ],
    partner: "Financial advisors and credit counselors",
    partnerWhy: "A client whose cash flow is repaired can start planning rather than surviving.",
    faqs: [
      {
        q: "Is it a good idea to pay off credit cards with home equity?",
        a: "It can be, and it carries a real trade-off. You would be converting unsecured debt into an obligation tied to your home. That is sensible if the spending that created the balances has genuinely stopped. If it has not, you will rebuild the balances and have committed your equity as well.",
      },
      {
        q: "What should I do before deciding?",
        a: "Speak to a nonprofit credit counselor — NFCC-affiliated agencies offer free or low-cost sessions. A debt management plan can often reduce rates substantially without touching your home, and it is worth knowing whether you qualify before committing equity.",
      },
      {
        q: "Will this hurt my credit score?",
        a: "Paying off revolving balances typically improves your utilisation ratio, which usually helps. The important thing is to leave the accounts open with low or zero balances rather than closing them, since closing reduces available credit and can work against you.",
      },
      {
        q: "What if I run the cards back up?",
        a: "Then you have both the balances and the commitment against your home, which is a materially worse position than you started in. This is the single most common way this decision goes wrong. Be honest with yourself about the cause before addressing the symptom.",
      },
    ],
  },
  {
    n: 47,
    slug: "consolidate-personal-loans",
    category: "debt",
    reason: "Consolidate personal loans",
    h1: "Using Home Equity to Consolidate Personal Loans",
    title: "Home Equity to Consolidate Loans | Equity Direct",
    description:
      "Consolidate multiple personal loans into a single position using home equity — one obligation instead of several payments.",
    intro:
      "Several loans taken at different times for different reasons rarely add up to a coherent position. Different rates, different terms, different due dates, and a combined monthly obligation that is difficult to see clearly until it is written down in one place.",
    why: [
      "Multiple payments on different dates make cash flow hard to manage and easy to miss.",
      "Loans taken under pressure usually carry the worst rates in the stack.",
      "Consolidating removes the monthly payments rather than merely reorganising them.",
    ],
    partner: "Financial advisors",
    partnerWhy: "Simplifying a client's obligations is usually the first step of any plan.",
    faqs: [
      {
        q: "Should I consolidate with a personal loan instead?",
        a: "Compare properly. A consolidation loan at a genuinely lower rate, with no origination fee and a term you will actually finish, may be the better answer. Watch for long terms that lower the payment while increasing the total paid — that is the usual trick.",
      },
      {
        q: "Does consolidating actually save money?",
        a: "Only if the cost of the new arrangement is lower than the weighted cost of what it replaces, over a comparable period. A lower monthly payment achieved by stretching the term is not a saving. Work out total cost, not monthly cost.",
      },
      {
        q: "Which debts should I leave alone?",
        a: "Anything already at a low fixed rate — a subsidised student loan or a car loan at a promotional rate — generally should not be consolidated into anything. Consolidate the expensive obligations and leave the cheap ones to run their course.",
      },
      {
        q: "What happens to my credit?",
        a: "Paying off instalment loans early has a modest and usually temporary effect. The larger factor is the improvement in your monthly obligations and the reduced risk of missing a payment, which matters far more over time.",
      },
    ],
  },
  {
    n: 48,
    slug: "pay-tax-debt",
    category: "debt",
    reason: "Pay tax debt",
    h1: "Using Home Equity to Pay Tax Debt",
    title: "Home Equity to Pay Tax Debt | Equity Direct",
    description:
      "Resolve IRS or state tax debt using home equity — before penalties, interest, and a federal lien make the problem considerably worse.",
    intro:
      "Tax debt behaves differently from other debt. Penalties and interest accrue together, the IRS has collection powers no other creditor has, and a federal tax lien attaches to everything you own — including the home whose equity you might otherwise use to resolve it. Order of operations matters enormously here.",
    why: [
      "Failure-to-pay penalties and interest compound the balance monthly.",
      "A filed federal tax lien attaches to your property and complicates any transaction against it.",
      "The IRS can levy bank accounts and garnish wages without a court judgment.",
    ],
    partner: "CPAs and tax attorneys",
    partnerWhy: "Resolution work, and a client relationship that continues afterwards.",
    faqs: [
      {
        q: "Should I pay tax debt with home equity?",
        a: "Often yes, because the penalty and interest structure makes tax debt expensive and the collection powers behind it are severe. Before you do, have a tax professional check whether you qualify for an instalment agreement, penalty abatement, or an offer in compromise — the balance may be reducible first.",
      },
      {
        q: "What is a federal tax lien and does it stop me?",
        a: "A Notice of Federal Tax Lien attaches to your property and is public. It can complicate or prevent transactions against your home, which is exactly why acting before one is filed matters. If a lien already exists, discharge or subordination may be possible — that is a conversation for a tax professional.",
      },
      {
        q: "Can I negotiate the amount down?",
        a: "Sometimes. An offer in compromise settles for less than owed where there is genuine doubt about collectability, and first-time penalty abatement is more widely available than people realise. Be wary of firms advertising guaranteed settlements — the qualifying criteria are narrow and published.",
      },
      {
        q: "What about state tax debt?",
        a: "States have their own powers and their own programmes, and some are more aggressive than the IRS. If you owe both, get advice on sequencing — resolving one can affect your position with the other.",
      },
    ],
  },
  {
    n: 49,
    slug: "irs-settlement",
    category: "debt",
    reason: "Fund an IRS settlement",
    h1: "Using Home Equity to Fund an IRS Settlement",
    title: "Home Equity to Fund an IRS Settlement | Equity Direct",
    description:
      "Fund a lump-sum offer in compromise or instalment payoff using home equity — the cash that makes a settlement possible.",
    intro:
      "An accepted offer in compromise usually requires money the taxpayer does not have, which is the central irony of the programme. A lump-sum offer must be paid within a short window of acceptance, and the ability to produce that sum is frequently what determines whether a settlement completes at all.",
    why: [
      "Lump-sum offers must be paid within a defined period after acceptance.",
      "A settled balance stops penalties and interest from accruing further.",
      "The IRS assesses reasonable collection potential, which includes home equity — take advice on sequencing.",
    ],
    partner: "Tax resolution firms and tax attorneys",
    partnerWhy: "Resolution fees, contingent on the settlement actually funding.",
    faqs: [
      {
        q: "How does an offer in compromise work?",
        a: "You propose to settle for less than the full balance on the basis that the IRS is unlikely to collect more. They assess your reasonable collection potential from income and assets. If accepted, you pay under either a lump-sum or periodic-payment structure and must stay compliant for five years.",
      },
      {
        q: "Does my home equity count against my offer?",
        a: "Yes — the IRS includes equity in assets when calculating reasonable collection potential, which is why the sequence of steps matters and why this needs a professional. Releasing equity before an offer is assessed can change the calculation in ways that work against you.",
      },
      {
        q: "Are tax resolution companies worth using?",
        a: "A qualified CPA, enrolled agent, or tax attorney is worth a great deal. Firms advertising heavily with promises to settle for pennies are a different proposition — check credentials, ask precisely who will handle the case, and be sceptical of any guarantee made before your finances have been reviewed.",
      },
      {
        q: "What if my offer is rejected?",
        a: "You can appeal, and appeals succeed reasonably often. Alternatively an instalment agreement or currently-not-collectible status may apply. Rejection is not the end of the process, and a professional will know which route fits your circumstances.",
      },
    ],
  },
  {
    n: 50,
    slug: "avoid-bankruptcy",
    category: "debt",
    reason: "Avoid bankruptcy",
    h1: "Using Home Equity to Avoid Bankruptcy",
    title: "Home Equity to Avoid Bankruptcy | Equity Direct",
    description:
      "Resolve debts to avoid a bankruptcy filing — a decision that genuinely needs a bankruptcy attorney's input first.",
    intro:
      "This is the one page on this site where our honest advice is to speak to someone else before you speak to us. Bankruptcy protects home equity in many states through the homestead exemption, and spending that protected equity to avoid a filing can leave you worse off than filing would have. An attorney can tell you which situation you are in.",
    why: [
      "Homestead exemptions protect a portion of home equity in bankruptcy, varying widely by state.",
      "Spending protected equity to avoid filing can leave you with neither the equity nor the relief.",
      "Bankruptcy has real long-term consequences, so avoiding it has genuine value where it is achievable.",
    ],
    partner: "Bankruptcy and debt attorneys",
    partnerWhy: "Consultation and representation, whichever direction the client takes.",
    faqs: [
      {
        q: "Should I use home equity to avoid bankruptcy?",
        a: "Speak to a bankruptcy attorney before deciding. In states with generous homestead exemptions, your equity may be protected in a filing — in which case spending it to avoid one could be the worse outcome. Most bankruptcy attorneys offer a free initial consultation, and the advice is worth having even if you never file.",
      },
      {
        q: "What is a homestead exemption?",
        a: "The amount of home equity protected from creditors in bankruptcy. It varies dramatically — some states protect a modest fixed sum, others protect unlimited equity subject to federal caps and residency rules. Your state's exemption is central to whether this decision makes sense.",
      },
      {
        q: "Is there a middle path?",
        a: "Frequently. Debt settlement, a Chapter 13 reorganisation that keeps your home, or a debt management plan through a nonprofit counselor may all resolve the situation without exhausting equity. An attorney will lay out the realistic options in a single meeting.",
      },
      {
        q: "How long does bankruptcy affect me?",
        a: "A Chapter 7 remains on a credit report for ten years, a Chapter 13 for seven. The practical effect on borrowing diminishes considerably sooner than that for most people, which is worth weighing against the cost of avoiding it.",
      },
    ],
  },
  {
    n: 51,
    slug: "settle-judgments",
    category: "debt",
    reason: "Settle judgments",
    h1: "Using Home Equity to Settle Judgments",
    title: "Home Equity to Settle a Judgment | Equity Direct",
    description:
      "Settle a civil judgment using home equity — before it becomes a lien against the property it would be paid from.",
    intro:
      "A judgment creditor has powers an ordinary creditor does not: wage garnishment, bank levies, and in most states the ability to record a lien against real property. Once that lien attaches, it complicates everything you might do with the house — including releasing equity to resolve the judgment itself.",
    why: [
      "Judgments accrue statutory interest, often at rates set by law rather than by agreement.",
      "A recorded judgment lien attaches to real property and surfaces at any sale or refinance.",
      "Creditors frequently discount substantially for an immediate lump-sum settlement.",
    ],
    partner: "Attorneys",
    partnerWhy: "Negotiation and settlement documentation.",
    faqs: [
      {
        q: "Can a judgment become a lien on my home?",
        a: "In most states, yes — the creditor records the judgment in the county where you own property and it attaches as a lien. It then has to be satisfied before you can sell or refinance cleanly, which is why resolving a judgment before recording is far easier than afterwards.",
      },
      {
        q: "Can I negotiate a judgment down?",
        a: "Often substantially. Collecting on a judgment is slow and uncertain, so many creditors accept a meaningful discount for immediate payment. Negotiate through an attorney, and get any agreement in writing before any money moves.",
      },
      {
        q: "What should I get in return for paying?",
        a: "A satisfaction of judgment filed with the court, and a release of any recorded lien. Paying without securing the filed satisfaction leaves the record against you — this is exactly what an attorney is for.",
      },
      {
        q: "What if the judgment is old?",
        a: "Judgments expire after a period set by state law, though many can be renewed. Some are also vulnerable to challenge if the original service was defective — a surprisingly common problem in debt-buyer cases. Have an attorney check before assuming it is valid.",
      },
    ],
  },
  {
    n: 52,
    slug: "divorce-settlement",
    category: "debt",
    reason: "Fund a divorce settlement",
    h1: "Using Home Equity to Fund a Divorce Settlement",
    title: "Home Equity for a Divorce Settlement | Equity Direct",
    description:
      "Fund an equalisation payment in a divorce using home equity — without refinancing into today's rates.",
    intro:
      "Divorce settlements frequently require one party to pay the other a sum representing their share of the marital assets, and the largest of those assets is usually the house. The traditional route — refinancing to pull cash out — means surrendering whatever mortgage rate the couple holds, which can make an already painful settlement considerably worse.",
    why: [
      "Equalisation payments are typically due on a timetable set by the settlement agreement.",
      "Refinancing to fund a settlement means giving up an existing mortgage rate entirely.",
      "Both parties usually want the matter concluded rather than extended.",
    ],
    partner: "Divorce attorneys and mediators",
    partnerWhy: "A settlement that can actually be funded is a settlement that completes.",
    faqs: [
      {
        q: "How is the house usually handled in a divorce?",
        a: "Commonly one of three ways: sell and divide the proceeds, one party buys out the other's share, or the sale is deferred to a later trigger such as children finishing school. The buyout is the most common where one party wants to stay, and funding it is the usual obstacle.",
      },
      {
        q: "Do I have to refinance to buy out my spouse?",
        a: "Refinancing is the traditional route, and it means taking today's rate on the whole balance. A home equity agreement can fund a buyout while leaving the existing first mortgage untouched — though your spouse's removal from the mortgage itself is a separate question to resolve with your attorney and lender.",
      },
      {
        q: "When should this be arranged?",
        a: "Ideally the funding route is understood before the settlement terms are finalised, so that what is agreed is actually achievable. Settlements agreed first and funded second are where deadlines get missed.",
      },
      {
        q: "Does it matter whose name is on the title?",
        a: "Very much, and it needs to align with the settlement and with any funding. Your attorney should coordinate the title transfer, the mortgage position, and the funding as one sequence rather than three separate events.",
      },
    ],
  },
  {
    n: 53,
    slug: "buy-spouse-out-of-home",
    category: "debt",
    reason: "Buy a spouse out of the home",
    h1: "Using Home Equity to Buy a Spouse Out of the Home",
    title: "Home Equity to Buy Out a Spouse | Equity Direct",
    description:
      "Keep the family home by funding your spouse's share from equity — without refinancing into a higher rate.",
    intro:
      "Keeping the house after a divorce usually means paying the other party their share of its value. For families with children, staying put has a worth that is hard to quantify and easy to lose when the only route to it is refinancing an entire mortgage at a rate several points above the existing one.",
    why: [
      "The buyout amount is typically half the equity, however the settlement defines it.",
      "Refinancing to fund it replaces a favourable existing rate with a current one.",
      "Staying in the family home has real stability value for children.",
    ],
    partner: "Divorce attorneys and mediators",
    partnerWhy: "Facilitates the settlement structure the client actually wants.",
    faqs: [
      {
        q: "How is a spousal buyout calculated?",
        a: "Usually current market value less the outstanding mortgage, with the remaining equity divided as the settlement specifies. Get an independent appraisal — a value taken from an online estimate is a frequent source of later dispute.",
      },
      {
        q: "Can I keep the existing mortgage?",
        a: "Sometimes. If your spouse must be removed from the mortgage, most lenders require a refinance or an assumption — and assumption availability varies by loan type, with some government-backed loans being more accommodating. Ask your servicer specifically about assumption before assuming a refinance is required.",
      },
      {
        q: "What if I cannot qualify on my own income?",
        a: "This is the common difficulty. Because a home equity agreement does not add a monthly payment, it does not affect debt-to-income the way new mortgage debt does — though whether you can retain the existing mortgage alone is a separate question for your lender.",
      },
      {
        q: "Should I keep the house at all?",
        a: "Consider it carefully rather than emotionally. If the payment, taxes, insurance, and upkeep stretch a single income, keeping the house can turn one difficult year into several. A financial advisor who specialises in divorce can model it honestly.",
      },
    ],
  },
  {
    n: 54,
    slug: "estate-equalization",
    category: "debt",
    reason: "Estate equalization",
    h1: "Using Home Equity for Estate Equalization",
    title: "Home Equity for Estate Equalization | Equity Direct",
    description:
      "Equalise an inheritance among heirs using home equity — so one child can keep the property without the others losing out.",
    intro:
      "When the principal asset is a house and there is more than one heir, the estate faces an arithmetic problem. One child wants to keep the family home; the others are entitled to their share of its value. Without cash to balance it, the usual outcome is a forced sale nobody wanted.",
    why: [
      "A property cannot be divided among heirs without either selling it or paying the others out.",
      "Forced sales frequently realise less than a considered sale and cause lasting family damage.",
      "Equalisation lets one heir keep the property while the others receive their value.",
    ],
    partner: "Estate attorneys",
    partnerWhy: "Planning and administration work where a funded solution avoids litigation.",
    faqs: [
      {
        q: "What is estate equalization?",
        a: "Balancing what each heir receives when the assets cannot be divided evenly in kind. If one child inherits a house and another inherits nothing of comparable value, equalisation provides cash so both receive a fair share without the property being sold.",
      },
      {
        q: "Can the heir who keeps the house fund the equalisation?",
        a: "Frequently, yes — by accessing equity in the inherited property or in their own home and paying the other heirs directly. This is often the only route that keeps a family property in the family.",
      },
      {
        q: "Should this be planned in advance?",
        a: "Strongly yes. Equalisation arranged during estate planning — sometimes using life insurance for the purpose — avoids the far more difficult conversation that happens during administration, when everyone is grieving and nobody is at their most reasonable.",
      },
      {
        q: "What if the heirs cannot agree?",
        a: "Any co-owner can generally force a sale through a partition action, which is slow, expensive, and usually realises less than a normal sale. Mediation is almost always the better route, and knowing that funding exists to equalise often unlocks it.",
      },
    ],
  },
  {
    n: 55,
    slug: "pay-estate-taxes",
    category: "debt",
    reason: "Pay estate taxes",
    h1: "Using Home Equity to Pay Estate Taxes",
    title: "Home Equity to Pay Estate Taxes | Equity Direct",
    description:
      "Fund an estate tax liability without a forced sale of the property — including state-level estate and inheritance taxes.",
    intro:
      "Estate tax is due on a timetable that takes no account of how illiquid the estate is. Where most of the value sits in property, executors are regularly forced to sell quickly to meet a deadline — and a sale conducted against a clock rarely achieves what a considered one would.",
    why: [
      "Federal estate tax is generally due within nine months of death, and extensions to pay are limited.",
      "Several states impose their own estate or inheritance tax at far lower thresholds than the federal one.",
      "Property is illiquid, and forced sales to meet a deadline realise less.",
    ],
    partner: "Estate attorneys and CPAs",
    partnerWhy: "Administration and planning fees, and a solution that preserves the estate's assets.",
    faqs: [
      {
        q: "Who actually owes estate tax?",
        a: "The federal exemption is high enough that most estates owe nothing, but several states levy estate or inheritance taxes at substantially lower thresholds — and in a few states the tax falls on the beneficiary rather than the estate. Check your state, because the federal position is frequently not the relevant one.",
      },
      {
        q: "When is it due?",
        a: "Federal estate tax is generally due nine months after death. Extensions to file are more readily granted than extensions to pay, and interest accrues on unpaid amounts. Certain estates with closely-held business interests can elect to pay in instalments — ask your CPA whether that applies.",
      },
      {
        q: "Can the estate's property be used to fund it?",
        a: "Yes, and accessing equity in estate property is a recognised alternative to selling it. This needs to be coordinated with the estate attorney, since authority to encumber estate property depends on the will, the state, and the stage of administration.",
      },
      {
        q: "How can this be avoided in future planning?",
        a: "Lifetime gifting, irrevocable trusts, and life insurance held outside the estate are all common tools. The time to address it is well before it is needed — planning done under a nine-month deadline is planning that has already failed.",
      },
    ],
  },
  {
    n: 56,
    slug: "pay-property-tax-arrears",
    category: "debt",
    reason: "Pay property tax arrears",
    h1: "Using Home Equity to Pay Property Tax Arrears",
    title: "Home Equity for Property Tax Arrears | Equity Direct",
    description:
      "Clear delinquent property taxes before a tax lien sale — the fastest way a homeowner can lose a house outright.",
    intro:
      "Property tax delinquency is the most dangerous debt a homeowner can carry, and the least understood. In many jurisdictions the taxing authority can sell a lien on the property — or the property itself — for a fraction of its value, and the timeline is measured in months rather than years.",
    why: [
      "Delinquent property taxes can lead to a tax lien sale or tax deed sale of the property.",
      "Penalties and interest on tax arrears are frequently set at punitive statutory rates.",
      "Mortgage servicers may advance the tax and add it to the loan, sometimes triggering default.",
    ],
    partner: "Tax advisors and housing counselors",
    partnerWhy: "Resolution work on a matter with a hard statutory deadline.",
    faqs: [
      {
        q: "What happens if I do not pay property taxes?",
        a: "Procedures vary by state, but typically the taxing authority places a lien and may sell it to an investor, who can eventually foreclose. Some states sell the deed directly. The redemption period and the rules differ enormously — find out precisely what applies in your county, urgently.",
      },
      {
        q: "How much interest do tax arrears accrue?",
        a: "Statutory rates are frequently high, and in some jurisdictions the investor who buys the lien is entitled to a substantial rate of return. The balance grows quickly, which is why delay is particularly costly here.",
      },
      {
        q: "Are there payment plans or exemptions?",
        a: "Many counties offer instalment arrangements, and most states have exemptions or deferrals for seniors, veterans, or those with disabilities that are widely under-claimed. Call the assessor's office directly — this is worth doing before anything else.",
      },
      {
        q: "Can I still access equity if taxes are delinquent?",
        a: "Outstanding taxes are a lien with priority and generally must be settled as part of any transaction against the property. In practice the arrears are frequently paid directly from the proceeds, which resolves the priority issue in the same step.",
      },
    ],
  },
  {
    n: 57,
    slug: "prevent-foreclosure",
    category: "debt",
    reason: "Prevent foreclosure",
    h1: "Using Home Equity to Prevent Foreclosure",
    title: "Home Equity to Stop Foreclosure | Equity Direct",
    description:
      "Options for a homeowner facing foreclosure who has equity — including free help you should use before anything else.",
    intro:
      "If you are facing foreclosure and you have equity in the property, you have more options than many homeowners in that position and less time than you think. The most important thing on this page is the next paragraph, and it is not about our product.",
    why: [
      "HUD-approved housing counseling is free, and counselors negotiate with servicers routinely.",
      "Servicers have loss-mitigation obligations, and forbearance or modification may be available.",
      "A homeowner with equity has options — including a controlled sale — that one without does not.",
    ],
    partner: "HUD-approved housing counselors",
    partnerWhy:
      "Free to the homeowner, funded independently, and genuinely the right first call.",
    faqs: [
      {
        q: "What should I do first if I am facing foreclosure?",
        a: "Contact a HUD-approved housing counseling agency. It is free, they negotiate with servicers every day, and they have no product to sell you. You can find one through HUD's directory or by calling the HOPE Hotline. Do this before speaking to anyone who is charging you.",
      },
      {
        q: "Should I be wary of foreclosure rescue offers?",
        a: "Very. Foreclosure filings are public records, and homeowners in default are targeted aggressively. Never sign over your deed, never pay large up-front fees for a modification, and be extremely cautious of anyone promising a guaranteed outcome. Legitimate counseling does not cost money.",
      },
      {
        q: "Does having equity change my options?",
        a: "Considerably. With meaningful equity you may be able to reinstate the loan, refinance, access equity to clear arrears, or sell in a controlled way and keep the proceeds — rather than losing the equity in a foreclosure sale. The one option to avoid is doing nothing until the sale date.",
      },
      {
        q: "How much time do I have?",
        a: "It depends on your state and on whether foreclosure is judicial or non-judicial — timelines range from a few months to well over a year. Find out your specific timeline immediately, because every option narrows as the sale date approaches.",
      },
    ],
  },
  {
    n: 58,
    slug: "emergency-cash-reserve",
    category: "debt",
    reason: "Build an emergency cash reserve",
    h1: "Using Home Equity to Build an Emergency Cash Reserve",
    title: "Home Equity for an Emergency Reserve | Equity Direct",
    description:
      "Establish a cash reserve from home equity — liquidity in place before it is needed, rather than arranged in a crisis.",
    intro:
      "Credit is easiest to arrange when you do not need it and hardest precisely when you do. Households that wait until a job loss or a medical event to look for liquidity discover that the event itself has closed most of the doors. Establishing a reserve in advance is the opposite approach.",
    why: [
      "Access to credit typically contracts at exactly the moment a household needs it.",
      "An illiquid household can be asset-rich and still unable to meet a shock.",
      "A reserve prevents high-cost borrowing decisions made under pressure.",
    ],
    partner: "Financial advisors",
    partnerWhy: "Liquidity planning is foundational to any advice that follows.",
    faqs: [
      {
        q: "How large should an emergency reserve be?",
        a: "The common guidance is three to six months of essential expenses, more for variable or commission-based income, for single-income households, or for anyone close to retirement. Base it on essential outgoings rather than total spending.",
      },
      {
        q: "Is it sensible to create a reserve from equity?",
        a: "It is a reasonable approach for a household with substantial equity and thin savings, particularly where income is variable. The discipline required is that the reserve stays a reserve — funds accessed for security and then spent on something else leave you with neither.",
      },
      {
        q: "Where should the reserve be held?",
        a: "Somewhere liquid and safe — a high-yield savings account or money market fund. The purpose is availability, not return. Reserves invested in markets have a habit of being down precisely when the emergency arrives.",
      },
      {
        q: "Is a HELOC a better emergency reserve?",
        a: "A HELOC is a reasonable standby facility, with two caveats worth knowing: lenders can reduce or freeze an unused line, which has happened at scale in past downturns, and drawing on it creates a monthly payment at the worst possible time. Cash in hand does neither.",
      },
    ],
  },
];
