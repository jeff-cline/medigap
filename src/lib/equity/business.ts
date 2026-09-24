import type { EquityUse } from "./types";

// Rows 1–13 — starting, buying, and growing a company.
export const BUSINESS: EquityUse[] = [
  {
    n: 1,
    slug: "start-a-business",
    category: "business",
    reason: "Start a business",
    h1: "Using Home Equity to Start a Business",
    title: "Home Equity to Start a Business | Equity Direct",
    description:
      "Fund a new business with the equity in your home — no monthly payment while you are pre-revenue. Check what you could access in about two minutes.",
    intro:
      "The hardest money a business ever raises is the first money. Banks want two years of returns a new company does not have, and investors want a share of something that does not exist yet. Meanwhile the founder is often sitting on a house worth several hundred thousand dollars more than they owe on it.",
    why: [
      "A startup's first eighteen months rarely produce predictable cash flow, which is exactly when a new monthly payment does the most damage.",
      "SBA and conventional business lending typically ask for operating history, and a new company has none.",
      "Founders who use a credit card or a merchant advance instead usually pay far more for the same capital.",
    ],
    partner: "Business consultants and startup coaches",
    partnerWhy:
      "A funded client can actually engage them. An unfunded one postpones indefinitely.",
    faqs: [
      {
        q: "Can I use home equity to start a business?",
        a: "Yes. Homeowners routinely fund new businesses from property equity, and a home equity agreement lets you do it without adding a monthly payment during the pre-revenue period. You receive a lump sum and settle later — typically when you sell, refinance, or reach the end of the agreement term.",
      },
      {
        q: "Is this a business loan?",
        a: "No. A home equity agreement is not a loan. There is no interest rate and no monthly bill. In exchange for the lump sum you agree to share a portion of your home's future value when the agreement settles. That is a genuinely different structure from debt, with its own trade-offs you should understand fully.",
      },
      {
        q: "Do I need business revenue or a business plan to qualify?",
        a: "Qualification is based primarily on the property and your equity position, not on business revenue. That is the core reason founders use this route — a company with no trading history cannot satisfy a commercial lender's underwriting, but a house does not care how old the business is.",
      },
      {
        q: "What happens if the business does not work out?",
        a: "The agreement is tied to your home, not to the business, so a failed venture does not create a business debt. It does mean the equity you committed is still committed. That risk is real and worth weighing carefully before you start, ideally with an advisor who has no stake in the outcome.",
      },
    ],
  },
  {
    n: 2,
    slug: "buy-an-existing-business",
    category: "business",
    reason: "Buy an existing business",
    h1: "Using Home Equity to Buy an Existing Business",
    title: "Home Equity to Buy a Business | Equity Direct",
    description:
      "Fund the down payment or full purchase of an established business using home equity — without a monthly payment competing with the acquisition debt.",
    intro:
      "Buying a business that already has customers is a very different proposition from starting one, and lenders know it. What they still want is a meaningful injection from the buyer — usually ten to thirty percent — and that money has to come from somewhere that is not the business.",
    why: [
      "Acquisition lenders almost always require buyer equity, and the size of that cheque is what disqualifies most otherwise-capable buyers.",
      "Using property equity for the injection keeps the acquisition loan as the only monthly obligation against the business.",
      "Good businesses sell quickly, and a buyer who has to arrange funding from scratch usually loses to one who can move.",
    ],
    partner: "Business brokers",
    partnerWhy: "A funded buyer closes. An unfunded one re-trades or walks.",
    faqs: [
      {
        q: "Can home equity be used for a business acquisition down payment?",
        a: "Yes, and it is one of the most common uses. Acquisition lenders typically require the buyer to contribute a share of the purchase price from their own resources, and property equity is a recognised source for that contribution. Confirm the specific requirement with your acquisition lender before you commit.",
      },
      {
        q: "Will the acquisition lender accept equity from my home as my injection?",
        a: "Often, but not always, and the answer depends on the lender and the loan programme. Some require the injection to be unborrowed. Because a home equity agreement is not structured as debt, it is treated differently from a second mortgage — but you must disclose it and get the lender's position in writing first.",
      },
      {
        q: "How quickly can this move?",
        a: "Funding can move quickly for qualified applicants — in some cases within days of full approval — but the honest answer is that it depends on your property, your title, and how fast third parties such as the appraiser and title company work. Never sign a purchase agreement on the assumption of a specific funding date.",
      },
      {
        q: "Does buying a business through this route affect my mortgage?",
        a: "Your existing mortgage stays as it is. A home equity agreement generally sits behind it and is recorded against the property. It does not replace or refinance your first mortgage, and your existing rate is unaffected — which matters a great deal to anyone holding a low pandemic-era rate.",
      },
    ],
  },
  {
    n: 3,
    slug: "buy-a-franchise",
    category: "business",
    reason: "Buy a franchise",
    h1: "Using Home Equity to Buy a Franchise",
    title: "Home Equity to Buy a Franchise | Equity Direct",
    description:
      "Cover franchise fees, buildout, and working capital from home equity — and meet the liquidity requirement franchisors ask candidates to prove.",
    intro:
      "Franchisors do not simply sell a licence; they screen for candidates who can survive the ramp. Nearly every franchise disclosure document sets out a minimum net worth and a minimum liquid capital figure, and plenty of capable operators are turned away for failing the second test while comfortably passing the first.",
    why: [
      "Franchise agreements commonly require documented liquidity before a territory is awarded.",
      "The total investment is rarely the franchise fee alone — buildout, equipment, and several months of working capital usually dwarf it.",
      "A new franchise unit has no trading history, so conventional business lending is limited until it does.",
    ],
    partner: "Franchise brokers and development consultants",
    partnerWhy:
      "Their placement economics depend on candidates clearing the financial screen.",
    typicalRange: "$50,000–$500,000+ total investment, varying widely by brand",
    faqs: [
      {
        q: "Can I use home equity to meet a franchisor's liquidity requirement?",
        a: "Often yes, though each franchisor sets its own rules on what counts as liquid capital and how it may be sourced. Ask the franchise development team directly, in writing, before you proceed — the answer varies by brand and sometimes by territory.",
      },
      {
        q: "How much does a franchise actually cost?",
        a: "The franchise fee is usually the smallest component. Item 7 of the Franchise Disclosure Document sets out the estimated total initial investment, which includes buildout, equipment, signage, initial inventory, and working capital. Read Item 7 carefully — it is the number that matters, not the headline fee.",
      },
      {
        q: "Is this better than a 401(k) rollover for business startups?",
        a: "They are different tools with different risks, and neither is universally better. A ROBS arrangement puts retirement savings into the business and carries specific compliance obligations; a home equity agreement puts property equity at stake instead. Both deserve a conversation with a CPA who is not selling you either one.",
      },
      {
        q: "Can I fund more than one unit?",
        a: "Multi-unit development agreements typically require proportionally greater capital, and what you can access depends on your equity position rather than on the number of units. Many multi-unit operators fund the first unit this way and the later ones from operations.",
      },
    ],
  },
  {
    n: 4,
    slug: "expand-existing-business",
    category: "business",
    reason: "Expand an existing business",
    h1: "Using Home Equity to Expand Your Business",
    title: "Home Equity to Expand Your Business | Equity Direct",
    description:
      "Fund expansion — staff, space, systems, or a new market — from home equity, without a new monthly payment ahead of the revenue it creates.",
    intro:
      "Expansion has an awkward shape: the cost lands months before the revenue does. You hire, you fit out, you buy stock, and only then does any of it start to pay. A business with good numbers can still fail to finance that gap, because lenders underwrite what has already happened rather than what is about to.",
    why: [
      "The cost of expansion is front-loaded and the return is not, which strains even a healthy operating account.",
      "A new monthly payment during the ramp period is the most common reason a sound expansion runs out of runway.",
      "Owners frequently fund expansion from personal resources rather than surrender equity in a company they have already built.",
    ],
    partner: "Business consultants and CPAs",
    partnerWhy:
      "Growth engagements and ongoing advisory work depend on the client actually executing.",
    faqs: [
      {
        q: "Why not use a business line of credit to expand?",
        a: "A line of credit is often the right tool, particularly if you already have one at a reasonable rate. The difficulty is that lines are sized on historical performance and usually carry personal guarantees, variable rates, and covenants. Compare both properly rather than assuming either is cheaper.",
      },
      {
        q: "Will this affect my business credit?",
        a: "A home equity agreement is a personal arrangement secured against your property, not a business debt, so it does not appear on your business credit file and does not consume business borrowing capacity. That last point is what makes it attractive to owners who want to keep their commercial lines free.",
      },
      {
        q: "Can I use the funds for payroll during the ramp?",
        a: "Yes. Funds are generally unrestricted once received, which is precisely why owners use them to bridge a hiring period. Do discuss the tax treatment of how you introduce the money into the business with your CPA — the mechanics matter.",
      },
      {
        q: "What if I want to sell the business later?",
        a: "The agreement is against your home, so selling the business does not trigger it. The agreement settles on the property's own timeline — when you sell the house, refinance, or reach the end of the term — which means a business exit and this arrangement are independent events.",
      },
    ],
  },
  {
    n: 5,
    slug: "buy-business-equipment",
    category: "business",
    reason: "Buy business equipment",
    h1: "Using Home Equity to Buy Business Equipment",
    title: "Home Equity for Business Equipment | Equity Direct",
    description:
      "Buy equipment outright with home equity instead of leasing — and own the asset rather than renting it for years.",
    intro:
      "Equipment finance is one of the easiest things in the world to arrange and one of the most expensive ways to own a machine. The effective rate on a lease, once residuals and fees are counted, frequently surprises owners who never saw it expressed as an annual percentage.",
    why: [
      "Buying outright removes the lease payment from monthly overhead entirely.",
      "Cash buyers negotiate better, and equipment dealers discount meaningfully for immediate settlement.",
      "Owned equipment is an asset on the balance sheet rather than a recurring liability.",
    ],
    partner: "Equipment dealers and distributors",
    partnerWhy: "A cash buyer closes faster and at a better margin than a finance deal.",
    faqs: [
      {
        q: "Is buying equipment outright better than leasing?",
        a: "It depends on how long you will use the asset and how fast it depreciates. Equipment you will run for a decade usually favours ownership; equipment that is obsolete in three years often favours leasing. Run both numbers over the realistic holding period before deciding.",
      },
      {
        q: "Can I still claim depreciation if I buy this way?",
        a: "Generally yes — the equipment is a business asset you own, and the usual depreciation rules including Section 179 may apply. How the funds enter the business affects the treatment, so confirm the specifics with your CPA before filing.",
      },
      {
        q: "What kinds of equipment do people fund this way?",
        a: "Commonly machine tools, medical and dental equipment, commercial kitchen fit-outs, construction plant, printing and fabrication equipment, and specialist vehicles — generally anything where the purchase price is large enough that leasing it would materially affect monthly overhead.",
      },
      {
        q: "Do I have to spend it all on equipment?",
        a: "No. Funds are unrestricted, so many owners buy the equipment and hold the balance as working capital to cover the period before the new capacity starts earning.",
      },
    ],
  },
  {
    n: 6,
    slug: "purchase-inventory",
    category: "business",
    reason: "Purchase inventory",
    h1: "Using Home Equity to Purchase Inventory",
    title: "Home Equity to Buy Inventory | Equity Direct",
    description:
      "Fund a large inventory buy from home equity — hit supplier volume tiers and stock ahead of your season without a monthly payment.",
    intro:
      "Inventory is the purest cash-flow trap in retail and distribution. The money leaves months before the season, volume pricing rewards exactly the buyers who can least afford to commit, and the businesses that grow fastest are frequently the ones most starved of cash.",
    why: [
      "Supplier volume tiers can move gross margin by several points, but only for buyers who can commit up front.",
      "Seasonal businesses must buy well ahead of the revenue that pays for it.",
      "Merchant cash advances and inventory finance are quick, but the effective cost is often severe.",
    ],
    partner: "Suppliers and distributors",
    partnerWhy: "Larger, earlier orders at better terms for both sides.",
    faqs: [
      {
        q: "Why not use inventory financing or a merchant cash advance?",
        a: "Both are fast and both are usually expensive. A merchant advance in particular is priced as a factor rate rather than an interest rate, which frequently disguises an effective annualised cost well into the double or triple digits. Convert any offer to an APR before you compare it to anything.",
      },
      {
        q: "Does buying inventory in bulk actually pay?",
        a: "Only if it sells. Volume pricing improves margin on units you move and destroys it on units you do not. The calculation that matters is the discount weighted against your realistic sell-through rate and carrying cost, not the discount alone.",
      },
      {
        q: "Can I use this for seasonal buying every year?",
        a: "The funding is a one-time lump sum rather than a revolving facility, so it suits an initial build or a step change in volume better than a recurring seasonal cycle. Many owners use it once to get ahead, then fund subsequent seasons from the improved position.",
      },
      {
        q: "What if my supplier requires a deposit rather than full payment?",
        a: "Funds are unrestricted, so a deposit structure is entirely workable and usually means you can commit to a larger order than the cash would otherwise support.",
      },
    ],
  },
  {
    n: 7,
    slug: "open-second-location",
    category: "business",
    reason: "Open a second location",
    h1: "Using Home Equity to Open a Second Location",
    title: "Home Equity to Open a Second Location | Equity Direct",
    description:
      "Fund the lease deposit, buildout, and opening costs of a second location from home equity — before the new site earns anything.",
    intro:
      "The second location is where a good small business either becomes a company or breaks. The first site funded itself out of the owner's own effort; the second has to be paid for in advance, in cash, while the first one continues to demand attention.",
    why: [
      "Commercial landlords typically want a security deposit and often a personal guarantee before handing over keys.",
      "Buildout, permits, and equipment are due long before the doors open.",
      "The first location's cash flow usually cannot absorb a second site's startup costs and a new loan payment at once.",
    ],
    partner: "Commercial brokers and contractors",
    partnerWhy: "Lease commissions and buildout contracts both depend on the deal closing.",
    faqs: [
      {
        q: "How much does opening a second location usually cost?",
        a: "It varies enormously by trade and market, but the components are consistent: security deposit and first months' rent, buildout and permits, equipment, initial inventory, hiring and training ahead of opening, and working capital for the ramp. Owners most often underestimate the last one.",
      },
      {
        q: "Should I wait until the first location can fund it?",
        a: "Frequently yes, and that is the conservative answer. The case for moving sooner is usually a specific site that will not still be available later. If the only argument is impatience, waiting is almost always cheaper.",
      },
      {
        q: "Will a landlord require a personal guarantee?",
        a: "For most small businesses, yes — and it is worth negotiating a limit or a burn-off after a period of good payment history. That negotiation typically goes better when your financial position is strong at signing.",
      },
      {
        q: "Can this cover the ramp period as well as the buildout?",
        a: "Yes, and it usually should. Funding the fit-out but not the first several months of operating costs is the single most common way a second location gets into trouble.",
      },
    ],
  },
  {
    n: 8,
    slug: "acquire-competitor",
    category: "business",
    reason: "Acquire a competitor",
    h1: "Using Home Equity to Acquire a Competitor",
    title: "Home Equity to Acquire a Competitor | Equity Direct",
    description:
      "Fund the equity portion of a competitor acquisition from home equity — move on a deal that usually will not wait.",
    intro:
      "Competitor acquisitions rarely announce themselves in advance. An owner decides to retire, a partnership dissolves, or a rival overextends, and the window opens for a matter of weeks. The buyer who can demonstrate funds is a different kind of negotiating party from the one who says they will arrange something.",
    why: [
      "Acquiring a direct competitor usually removes a price pressure and adds their customers at once — the economics are frequently better than organic growth.",
      "Seller-financed and lender-financed deals still require a buyer contribution.",
      "These opportunities are time-limited, and slow funding loses them to faster buyers.",
    ],
    partner: "M&A advisors and business brokers",
    partnerWhy: "Success fees depend entirely on the transaction actually completing.",
    faqs: [
      {
        q: "Can home equity fund an acquisition?",
        a: "It commonly funds the buyer's equity contribution, with seller financing or an acquisition loan covering the balance. Funding an entire acquisition from property equity alone is possible but depends on the size of the deal relative to your equity position.",
      },
      {
        q: "How do I value a competitor?",
        a: "Small businesses are usually valued on a multiple of seller's discretionary earnings or EBITDA, with the multiple driven by size, customer concentration, and how much the business depends on the departing owner. Engage an advisor — the difference between a fair multiple and a bad one is typically far larger than the fee.",
      },
      {
        q: "What due diligence matters most?",
        a: "Customer concentration, the reason for sale, whether revenue survives the owner's departure, undisclosed liabilities, and the condition of any leases or key contracts. The last two are where deals most often unravel late.",
      },
      {
        q: "Does the acquisition need to be profitable to qualify?",
        a: "Qualification looks at your property and equity, not the target's financials. That said, the target's numbers should determine whether you proceed at all, quite independently of whether funding is available.",
      },
    ],
  },
  {
    n: 9,
    slug: "business-working-capital",
    category: "business",
    reason: "Fund business working capital",
    h1: "Using Home Equity for Business Working Capital",
    title: "Home Equity for Working Capital | Equity Direct",
    description:
      "Bridge a receivables gap or seasonal trough with home equity — without a monthly payment during the months that caused the problem.",
    intro:
      "Profitable businesses run out of money all the time. Customers pay in sixty days, payroll runs every fortnight, and the gap between those two facts has closed more companies than poor sales ever did. Working capital is the least glamorous funding need and the most common.",
    why: [
      "Net-30 and net-60 terms mean the business is effectively financing its own customers.",
      "Seasonal businesses carry fixed costs through months with little revenue.",
      "Short-term business funding is fast but frequently priced at a level that makes the underlying problem worse.",
    ],
    partner: "CPAs and business advisors",
    partnerWhy:
      "A client who survives a cash crunch remains a client; one who does not, does not.",
    faqs: [
      {
        q: "Is using home equity for working capital sensible?",
        a: "It depends entirely on whether the gap is structural or temporary. Bridging a known receivables cycle or a seasonal trough is a defensible use. Covering ongoing losses is not — that postpones a decision rather than solving anything, and it puts your home behind the postponement.",
      },
      {
        q: "How is this different from a merchant cash advance?",
        a: "A merchant advance takes a fixed slice of daily card receipts at a factor rate that often works out to an extremely high effective APR, and it takes it immediately. A home equity agreement takes nothing monthly and settles against the property later. The cost structures are not remotely comparable.",
      },
      {
        q: "Should I fix the underlying cash-flow problem first?",
        a: "Ideally, yes, and honestly. Tighter terms, deposits on large orders, faster invoicing, and better collections frequently release more cash than any financing does — and they cost nothing. Funding buys time to implement those changes; it should not replace them.",
      },
      {
        q: "How much working capital should I actually take?",
        a: "A common rule of thumb is three to six months of fixed operating costs, but the right figure comes from your own cash-flow forecast. Taking more than the plan supports means committing equity you did not need to commit.",
      },
    ],
  },
  {
    n: 10,
    slug: "buy-out-business-partner",
    category: "business",
    reason: "Buy out a business partner",
    h1: "Using Home Equity to Buy Out a Business Partner",
    title: "Home Equity to Buy Out a Partner | Equity Direct",
    description:
      "Fund a partner buyout from home equity and take full ownership — without loading the company with acquisition debt.",
    intro:
      "Partner buyouts are seldom purely financial. One person wants out, or the partnership has stopped working, and the business continues to operate while two people who no longer agree remain jointly responsible for it. Resolving it quickly usually matters more than resolving it cheaply.",
    why: [
      "Buyout terms are often set by a buy-sell agreement with a defined payment window.",
      "Funding the buyout personally keeps acquisition debt off the company's balance sheet.",
      "A lingering dispute damages the business while it remains unresolved, and that damage compounds.",
    ],
    partner: "Attorneys and CPAs",
    partnerWhy: "Valuation, structuring, and documentation fees all sit on this transaction.",
    faqs: [
      {
        q: "How is a partner's share valued?",
        a: "Ideally by whatever method your buy-sell agreement specifies — that is precisely what it is for. Without one, the parties typically engage an independent valuation, and the gap between the two sides' expectations is where most of the cost and delay lives.",
      },
      {
        q: "Should the business borrow, or should I fund it personally?",
        a: "Company borrowing may be tax-efficient but loads the business with debt service at a moment when it has just lost a principal. Funding it personally keeps the company clean. The right answer depends on the entity structure and deserves a CPA's input rather than a rule of thumb.",
      },
      {
        q: "What if my partner will not agree on a price?",
        a: "Check the buy-sell agreement first — many include a binding valuation mechanism or a shotgun clause. If none applies, mediation is almost always cheaper and faster than litigation, and it leaves a business that still functions afterwards.",
      },
      {
        q: "Can this fund a buyout structured in instalments?",
        a: "Yes. Some owners take the lump sum and settle in full to remove the ongoing relationship entirely; others fund a substantial first payment to secure better overall terms. Both are common.",
      },
    ],
  },
  {
    n: 11,
    slug: "pay-off-business-debt",
    category: "business",
    reason: "Pay off expensive business debt",
    h1: "Using Home Equity to Pay Off Expensive Business Debt",
    title: "Home Equity to Pay Off Business Debt | Equity Direct",
    description:
      "Clear merchant advances and high-cost business debt with home equity — and stop daily remittances draining the operating account.",
    intro:
      "Merchant cash advances and daily-remittance products are sold as a lifeline and frequently become the emergency. Once two or three are stacked, a meaningful share of every day's takings disappears before the business sees it, and the company is working principally to service the funding.",
    why: [
      "Stacked advances can consume a substantial portion of daily receipts before any operating cost is met.",
      "Factor-rate pricing often conceals an effective annualised cost far above what an owner believes they agreed to.",
      "Clearing the stack restores the daily cash flow the business needs to trade its way out.",
    ],
    partner: "Debt consultants and CPAs",
    partnerWhy: "Restructuring and ongoing advisory engagements follow the resolution.",
    faqs: [
      {
        q: "Is it wise to move business debt onto my home?",
        a: "This is the most serious trade-off on this page and deserves a blunt answer. You would be converting debt that threatens the business into a commitment against your home. If the business is fundamentally sound and the debt is genuinely the problem, it can be the right move. If the business is not viable, it moves the loss onto your house. Get independent advice from someone with no stake in the transaction.",
      },
      {
        q: "How do I work out what my advances actually cost?",
        a: "Take the total repayment amount, subtract the amount you received, and annualise that cost over the actual repayment period rather than the stated term. Owners are frequently shocked by the result — a factor rate of 1.4 over four months is not a 40% cost.",
      },
      {
        q: "Should I try to settle with the advance companies first?",
        a: "Often worth attempting. Many will discount for a lump-sum payoff, particularly where collection is uncertain. Knowing that funding is available strengthens that negotiation considerably — but do not reveal the full extent of what you have.",
      },
      {
        q: "Will this affect my personal credit?",
        a: "A home equity agreement is not reported as a consumer debt in the way a loan is. Clearing business obligations that carry a personal guarantee may well improve your personal position. Confirm the specifics for your situation rather than assuming.",
      },
    ],
  },
  {
    n: 12,
    slug: "fund-marketing-campaign",
    category: "business",
    reason: "Fund a marketing campaign",
    h1: "Using Home Equity to Fund a Marketing Campaign",
    title: "Home Equity to Fund Marketing | Equity Direct",
    description:
      "Fund a marketing push from home equity — reach the spend level where acquisition economics actually work.",
    intro:
      "Paid acquisition has a threshold problem. Below a certain spend there is not enough data to optimise, so the early money buys learning rather than customers — and many businesses stop precisely there, concluding the channel does not work when in fact they never reached the point where it could.",
    why: [
      "Customer acquisition cost generally improves with data volume, which requires sustained rather than intermittent spend.",
      "Agencies and platforms both need a testing period before performance stabilises.",
      "Revenue from a campaign lags the spend, so the gap has to be funded from somewhere.",
    ],
    partner: "Marketing agencies",
    partnerWhy: "Both ad spend and agency fees depend on the client having a real budget.",
    faqs: [
      {
        q: "Is funding advertising with home equity sensible?",
        a: "Only where the unit economics are already proven. If you know your acquisition cost and lifetime value and the ratio works, scaling spend is an investment decision. If you do not know those numbers, you would be funding an experiment with your house — establish them on a small budget first.",
      },
      {
        q: "How much do I need to test a channel properly?",
        a: "Enough to gather statistically meaningful data, which depends on your conversion rate and sales cycle rather than on any universal figure. A good agency will tell you the minimum viable test budget for your category before taking your money; one that will not is worth avoiding.",
      },
      {
        q: "What should I measure?",
        a: "Customer acquisition cost against lifetime value, payback period, and incremental rather than attributed revenue. Platform-reported conversions consistently overstate contribution, because they claim credit for customers who would have bought anyway.",
      },
      {
        q: "What if the campaign does not work?",
        a: "Then you have spent the money and still have the commitment against your home. That is precisely why the unit-economics question above is not a formality. Cap the downside by agreeing kill criteria before you start, not after.",
      },
    ],
  },
  {
    n: 13,
    slug: "build-ecommerce-business",
    category: "business",
    reason: "Build an e-commerce company",
    h1: "Using Home Equity to Build an E-Commerce Business",
    title: "Home Equity for an E-Commerce Business | Equity Direct",
    description:
      "Fund inventory, platform build, and launch marketing for an online business from home equity — the three costs that all arrive at once.",
    intro:
      "E-commerce looks capital-light from the outside and rarely is. Inventory must be bought before anything sells, the storefront and photography cost real money, and customer acquisition has to be funded from day one because there is no passing trade. All three land simultaneously.",
    why: [
      "Inventory, platform, and acquisition costs arrive together, before the first order.",
      "Manufacturers impose minimum order quantities that rarely match a cautious launch.",
      "Marketplace fees and returns compress margin, so volume matters earlier than founders expect.",
    ],
    partner: "Agencies and e-commerce consultants",
    partnerWhy: "Build fees plus recurring optimisation retainers.",
    faqs: [
      {
        q: "How much does starting an e-commerce business cost?",
        a: "It varies with the model. Print-on-demand and dropshipping can start with very little; a branded product business with owned inventory typically requires a meaningful first production run, packaging, photography, a storefront, and launch marketing. The first production run is usually the largest single item.",
      },
      {
        q: "Should I fund inventory or marketing first?",
        a: "Neither works alone — inventory with no traffic is stock, and traffic with no inventory is a refund queue. Most successful launches fund a conservative first run alongside enough marketing to validate demand, then reinvest.",
      },
      {
        q: "Is Amazon FBA a good use of this?",
        a: "It can be, and the capital requirement is genuinely front-loaded: inventory, shipping to fulfilment centres, and launch advertising all precede revenue. Be realistic about fees, returns, and the very real possibility of account or listing issues outside your control.",
      },
      {
        q: "What margin should I be aiming for?",
        a: "Enough that acquisition cost, platform fees, shipping, and returns all fit inside it with room left. Many first-time sellers price from cost of goods and discover too late that the real costs of selling consumed the difference.",
      },
    ],
  },
];
