import type { EquityUse } from "./types";

// Rows 14–26 — buying, building, and improving property you do not live in.
export const REAL_ESTATE: EquityUse[] = [
  {
    n: 14,
    slug: "buy-rental-property",
    category: "real-estate",
    reason: "Buy a rental property",
    h1: "Using Home Equity to Buy a Rental Property",
    title: "Home Equity to Buy a Rental Property | Equity Direct",
    description:
      "Fund a rental property down payment from the equity in your home — without a second monthly payment before the tenant moves in.",
    intro:
      "Investment property lending is deliberately stricter than owner-occupied lending. Lenders typically want twenty to twenty-five percent down, and they want it from resources that are not themselves borrowed. For most would-be landlords, that deposit is the entire obstacle.",
    why: [
      "Investment mortgages generally require a substantially larger deposit than a primary residence.",
      "The property produces no income until it is bought, tenanted, and rent-paying.",
      "A second monthly payment during the vacancy and turn period is what strains new landlords most.",
    ],
    partner: "Real estate agents and investor coaches",
    partnerWhy: "A funded buyer transacts; an aspiring one attends seminars.",
    faqs: [
      {
        q: "Can I use home equity for a rental property down payment?",
        a: "Yes, and it is one of the most established uses. You access equity from your primary residence and apply it to the deposit on the investment property. Confirm with your investment-property lender how they treat the source of funds, because underwriting rules on this differ between lenders.",
      },
      {
        q: "How much deposit do I need for a rental property?",
        a: "Commonly twenty to twenty-five percent for a conventional investment mortgage, though it varies by lender, credit profile, and the number of financed properties you already hold. Budget for closing costs, reserves, and an initial repair allowance on top.",
      },
      {
        q: "Will the rental income help me qualify?",
        a: "Many lenders count a proportion of projected market rent, often around seventy-five percent to allow for vacancy and management. Some require a signed lease or a rent schedule from the appraisal. Ask your lender exactly how they will treat it before you make an offer.",
      },
      {
        q: "What if the property sits empty?",
        a: "You carry the mortgage, taxes, insurance, and upkeep out of your own pocket. This is why experienced landlords hold reserves of several months' costs, and why funding the deposit while leaving yourself no cushion is a mistake worth avoiding.",
      },
    ],
  },
  {
    n: 15,
    slug: "rental-property-down-payment",
    category: "real-estate",
    reason: "Rental property down payment",
    h1: "Home Equity for a Rental Property Down Payment",
    title: "Home Equity for a Rental Down Payment | Equity Direct",
    description:
      "Turn existing home equity into the deposit on your next rental — the single step that most often separates intending landlords from actual ones.",
    intro:
      "Almost every portfolio starts the same way: someone converts equity in the home they live in into the deposit on the first property they rent out. The deposit is the bottleneck, and it is the reason most people who intend to invest never begin.",
    why: [
      "The deposit is typically the largest single barrier to a first investment property.",
      "Saving a deposit from income takes years during which prices frequently move away from you.",
      "Equity already accumulated can be put to work without waiting.",
    ],
    partner: "Realtors and investor educators",
    partnerWhy: "Transaction commissions and coaching programmes both depend on people buying.",
    faqs: [
      {
        q: "Is it sensible to borrow a down payment?",
        a: "It depends on the coverage. If projected rent comfortably covers the mortgage, taxes, insurance, maintenance, vacancy allowance, and management, leverage is doing what it is supposed to. If it only works with optimistic assumptions and no vacancy, the deal is too thin regardless of where the deposit came from.",
      },
      {
        q: "How much equity do I need to release?",
        a: "The deposit plus closing costs plus a reserve. A frequent error is funding exactly the deposit and arriving at the first repair with nothing left. Size the release to include a genuine cushion.",
      },
      {
        q: "Does this affect my ability to get the investment mortgage?",
        a: "It can affect how the lender views your overall position, so disclose it and ask early. Because a home equity agreement is not structured as monthly debt, it does not add a payment to your debt-to-income calculation the way a second mortgage would — but every lender assesses it in its own way.",
      },
      {
        q: "Should I buy locally or out of state?",
        a: "Local property is easier to manage and easier to assess honestly. Out-of-state investing can offer better yields but depends entirely on the quality of your management, and a bad manager will erase the yield advantage and then some.",
      },
    ],
  },
  {
    n: 16,
    slug: "buy-vacation-rental",
    category: "real-estate",
    reason: "Buy a vacation rental",
    h1: "Using Home Equity to Buy a Vacation Rental",
    title: "Home Equity to Buy a Vacation Rental | Equity Direct",
    description:
      "Fund a short-term rental purchase from home equity — and budget properly for furnishing, which most first-time buyers underestimate.",
    intro:
      "Short-term rentals promise better yields than long lets and demand considerably more to achieve them. The purchase is only the beginning: a property that will be photographed, reviewed, and compared has to be furnished to a standard that costs real money before the first guest arrives.",
    why: [
      "Short-term rental lending typically requires a larger deposit than an owner-occupied purchase.",
      "Furnishing, linens, photography, and listing setup are substantial and due before any income.",
      "Bookings build over time as reviews accumulate, so early months rarely reflect the property's potential.",
    ],
    partner: "Realtors and short-term rental advisors",
    partnerWhy: "Transaction commission plus ongoing management revenue.",
    typicalRange: "$15,000–$60,000 to furnish and launch, beyond the purchase",
    faqs: [
      {
        q: "How much does furnishing a short-term rental cost?",
        a: "Typically a substantial five-figure sum for a whole property once furniture, beds and linens, kitchen equipment, outdoor space, professional photography, and smart locks are included. Buyers who budget only for the purchase are regularly caught out by this.",
      },
      {
        q: "What about local short-term rental regulations?",
        a: "Check before you buy, not after. Many cities and counties restrict or license short-term rentals, cap the number of permits, or ban them in certain zones, and rules change. A regulatory change can remove your business model overnight — verify current rules and any pending legislation.",
      },
      {
        q: "Will it actually earn more than a long-term rental?",
        a: "Often gross, sometimes not net. Cleaning, platform fees, higher utilities, faster wear, management, and vacancy between bookings all subtract. Compare net-to-net over a realistic occupancy rate for your specific market rather than comparing gross to gross.",
      },
      {
        q: "Can I use it myself?",
        a: "Yes, though personal use has tax implications that can affect how expenses are deducted. If you intend to use it meaningfully, get that treatment right with a CPA before the first tax year rather than afterwards.",
      },
    ],
  },
  {
    n: 17,
    slug: "buy-second-home",
    category: "real-estate",
    reason: "Buy a second home",
    h1: "Using Home Equity to Buy a Second Home",
    title: "Home Equity to Buy a Second Home | Equity Direct",
    description:
      "Fund the deposit on a second home from equity in your first — without adding a monthly payment alongside the new mortgage.",
    intro:
      "A second home is bought for reasons that are not principally financial — proximity to family, a place to retire to eventually, somewhere to actually go. The financing, however, is entirely financial, and second-home mortgages generally sit between primary residence and investment property in both rate and deposit.",
    why: [
      "Second-home mortgages usually require a larger deposit than a primary residence.",
      "Carrying two properties means two sets of taxes, insurance, and upkeep.",
      "Buyers with a low rate on their first home are understandably unwilling to refinance it to release equity.",
    ],
    partner: "Realtors",
    partnerWhy: "Transaction commission on a discretionary purchase that may not otherwise happen.",
    faqs: [
      {
        q: "Does this require refinancing my first mortgage?",
        a: "No, and that is frequently the deciding factor. A home equity agreement sits behind your existing first mortgage and leaves its rate and term untouched — which matters enormously to anyone holding a rate from the low-rate years.",
      },
      {
        q: "What deposit does a second home need?",
        a: "Commonly ten percent or more, varying by lender and credit profile, with second-home rates typically a little above primary-residence rates. Lenders also apply occupancy rules about distance and personal use — confirm you meet them.",
      },
      {
        q: "Second home or investment property?",
        a: "The classification affects your rate, your deposit, and your tax treatment, and lenders do verify it. Representing an investment property as a second home to obtain better terms is occupancy fraud. Be accurate about how you will genuinely use it.",
      },
      {
        q: "Can I rent it out occasionally?",
        a: "Sometimes, within limits set by your lender's occupancy requirements and by local rules. Renting it substantially may reclassify it as an investment property. Establish the boundaries with your lender before you list it anywhere.",
      },
    ],
  },
  {
    n: 18,
    slug: "buy-land",
    category: "real-estate",
    reason: "Buy land",
    h1: "Using Home Equity to Buy Land",
    title: "Home Equity to Buy Land | Equity Direct",
    description:
      "Fund a land purchase from home equity — land is the hardest asset to finance conventionally and the most natural fit for equity.",
    intro:
      "Land is the asset traditional lenders like least. There is no structure to value, no income, and nothing to repossess that anyone particularly wants. Land loans, where available, tend to require large deposits, short terms, and rates well above a conventional mortgage.",
    why: [
      "Raw land financing typically demands a far larger deposit than improved property.",
      "Land loan terms are usually shorter and rates higher than a residential mortgage.",
      "Sellers of land frequently prefer cash and will discount meaningfully for it.",
    ],
    partner: "Land brokers",
    partnerWhy: "Commission on transactions that often fail purely on financing.",
    faqs: [
      {
        q: "Why is land so hard to finance?",
        a: "Because it generates no income and is slow to sell if the lender has to recover it. That risk shows up as higher deposits, shorter terms, and higher rates — which is exactly why buyers so often fund land from equity in property they already own.",
      },
      {
        q: "What should I check before buying land?",
        a: "Zoning and permitted use, road and legal access, water rights and availability, utility connection distance and cost, percolation results if a septic system is needed, flood designation, easements, and any deed restrictions. Any one of these can make a parcel unbuildable.",
      },
      {
        q: "Can I build on it later using the same route?",
        a: "Construction is financed separately, and owning the land outright frequently strengthens a construction loan application because the land itself can serve as your equity contribution.",
      },
      {
        q: "Is land a good investment?",
        a: "It carries costs and produces nothing while you hold it — taxes and maintenance continue regardless. It can appreciate substantially where development is genuinely heading, and sit flat for decades where it is not. Treat any projection of the former with caution.",
      },
    ],
  },
  {
    n: 19,
    slug: "fund-real-estate-development",
    category: "real-estate",
    reason: "Fund a real estate development",
    h1: "Using Home Equity to Fund Real Estate Development",
    title: "Home Equity for Real Estate Development | Equity Direct",
    description:
      "Fund pre-development costs and your equity contribution on a development project from home equity — the money that has to come before any lender's.",
    intro:
      "Development consumes cash long before a construction lender will advance anything. Entitlement, surveys, architectural and engineering work, impact fees, and permits all come out of the developer's own pocket, and a project can absorb a great deal of money before it is even approved.",
    why: [
      "Pre-development costs are not usually covered by construction financing.",
      "Construction lenders require a developer equity contribution, frequently a substantial one.",
      "Entitlement periods are long and uncertain, so this is genuinely at-risk capital.",
    ],
    partner: "Developers and commercial brokers",
    partnerWhy: "Project economics and land transaction commissions.",
    faqs: [
      {
        q: "What are pre-development costs?",
        a: "Everything before construction begins: feasibility work, surveys, soil and environmental reports, architectural and engineering design, entitlement and zoning applications, legal fees, impact fees, and permits. On a meaningful project these routinely run into six figures.",
      },
      {
        q: "Will a construction lender count this as my equity?",
        a: "Frequently yes — documented pre-development spend and land value often count toward the equity requirement. Confirm the treatment with your specific lender early, because it materially changes how much further cash you need at closing.",
      },
      {
        q: "What if entitlement is refused?",
        a: "Then the pre-development spend is largely lost, and that is the fundamental risk in development. Experienced developers structure land purchases with entitlement contingencies precisely so the land purchase does not complete if approval fails.",
      },
      {
        q: "Is this suitable for a first-time developer?",
        a: "Development is unforgiving of inexperience, and the capital at risk is real. If this is your first project, partnering with an experienced developer — even on materially worse economics — is usually the cheaper education.",
      },
    ],
  },
  {
    n: 20,
    slug: "flip-a-house",
    category: "real-estate",
    reason: "Flip a house",
    h1: "Using Home Equity to Flip a House",
    title: "Home Equity to Flip a House | Equity Direct",
    description:
      "Fund a flip from home equity and avoid hard-money points and monthly interest eating the margin while the work is underway.",
    intro:
      "Hard money is the default for flips and it is expensive by design — points on the front, double-digit rates, and interest accruing every month the project runs long. Since projects run long more often than not, the financing frequently consumes a large share of the profit.",
    why: [
      "Hard money charges points up front and interest monthly, both of which come directly out of margin.",
      "Renovation timelines overrun routinely, and every month of overrun costs money.",
      "Cash offers win competitive deals and are typically accepted at a lower price.",
    ],
    partner: "Realtors and investor networks",
    partnerWhy: "Commission on both the purchase and the resale.",
    faqs: [
      {
        q: "Is this cheaper than hard money?",
        a: "There is no monthly interest accruing during the project, which is the main cost of hard money on a flip that overruns. The cost structure is entirely different, so compare the total cost over a realistic project length — including the overrun you should assume — rather than comparing headline rates.",
      },
      {
        q: "How do I know a flip will actually be profitable?",
        a: "Work backwards from a conservative after-repair value: subtract renovation cost with a meaningful contingency, holding costs, selling costs, and your required profit. What remains is your maximum purchase price. Most losing flips were bought above that number, not renovated badly.",
      },
      {
        q: "What contingency should I allow on renovation?",
        a: "Experienced flippers commonly add twenty percent or more to the estimate, and add more again on older properties where opening a wall reveals what is actually behind it.",
      },
      {
        q: "What if it does not sell?",
        a: "You carry the holding costs and the commitment against your home remains. Have a defined fallback — renting it out, or a price reduction schedule — decided before you buy rather than improvised when it has been on the market for ninety days.",
      },
    ],
  },
  {
    n: 21,
    slug: "renovate-investment-property",
    category: "real-estate",
    reason: "Renovate an investment property",
    h1: "Using Home Equity to Renovate an Investment Property",
    title: "Home Equity to Renovate a Rental | Equity Direct",
    description:
      "Fund renovation on a rental from home equity — raise rents, cut turnover, and lift the property's value without a payment during the works.",
    intro:
      "A tired rental costs money twice: it commands less rent and attracts tenants who move on quickly. Renovation fixes both, but it has to be paid for during a period when the unit is usually empty and producing nothing at all.",
    why: [
      "Renovation generally happens during a vacancy, so there is no rent while the cost is being incurred.",
      "Lenders are more conservative on investment-property renovation than on an owner-occupied home.",
      "Improvements raise both the achievable rent and the property's valuation.",
    ],
    partner: "Contractors",
    partnerWhy: "Project revenue, and repeat work from landlords with multiple units.",
    faqs: [
      {
        q: "Which renovations actually raise rent?",
        a: "Kitchens and bathrooms move rent most reliably, followed by flooring, paint, and in-unit laundry. Cosmetic work that photographs well drives enquiries; systems work — roof, HVAC, electrical — protects value and reduces emergencies rather than commanding a premium.",
      },
      {
        q: "Should I renovate between tenants or wait?",
        a: "Between tenants, almost always. Working around a sitting tenant is slower, more expensive, and frequently requires a rent concession that costs more than the vacancy would have.",
      },
      {
        q: "How do I work out if a renovation pays?",
        a: "Divide the annual rent increase by the renovation cost to get a simple return, then consider the effect on turnover and on the property's value at sale. A renovation that adds little rent but meaningfully reduces vacancy can still be worth doing.",
      },
      {
        q: "Can I fund renovations across several properties at once?",
        a: "Yes — what you can access depends on the equity in your own home rather than on the number of properties being improved. Many landlords fund a programme of works across a portfolio in one go.",
      },
    ],
  },
  {
    n: 22,
    slug: "build-adu",
    category: "real-estate",
    reason: "Build an ADU",
    h1: "Using Home Equity to Build an ADU",
    title: "Home Equity to Build an ADU | Equity Direct",
    description:
      "Fund an accessory dwelling unit from home equity — add rental income or family space using land you already own.",
    intro:
      "An accessory dwelling unit is one of the few improvements that can genuinely pay for itself. It adds rentable space on land you already own, and a growing number of states have made them substantially easier to permit. The obstacle is that construction must be paid for entirely before any rent arrives.",
    why: [
      "Construction is a single large cost that precedes every dollar of rental income.",
      "Construction lending on an ADU can be awkward, since the finished unit is not a separate parcel.",
      "A completed ADU can add both ongoing income and property value.",
    ],
    partner: "Contractors and architects",
    partnerWhy: "Design fees and construction revenue on a well-defined project.",
    typicalRange: "$100,000–$400,000+ depending on size, type, and market",
    faqs: [
      {
        q: "How much does an ADU cost to build?",
        a: "It varies widely by region, size, and whether it is a garage conversion, an attached addition, or a detached new build. Garage conversions sit at the lower end; detached new construction with its own utility connections sits at the higher end. Get local bids — national averages are close to useless here.",
      },
      {
        q: "Will an ADU add value to my property?",
        a: "Generally yes, though appraisal treatment varies by market and by how comparable properties with ADUs have sold nearby. In markets where ADUs are common, appraisers handle them well; in markets where they are rare, the added value may not appear fully in an appraisal.",
      },
      {
        q: "Do I need permits?",
        a: "Yes, and unpermitted work creates serious problems at sale, at refinance, and with insurance. Several states have streamlined ADU approval considerably, but streamlined is not the same as exempt.",
      },
      {
        q: "How long does it take?",
        a: "Permitting frequently takes longer than construction. Plan for a project measured in months rather than weeks, and budget holding costs accordingly.",
      },
    ],
  },
  {
    n: 23,
    slug: "add-rental-unit",
    category: "real-estate",
    reason: "Add a rental unit",
    h1: "Using Home Equity to Add a Rental Unit",
    title: "Home Equity to Add a Rental Unit | Equity Direct",
    description:
      "Convert a basement, garage, or spare floor into a rental unit using home equity — income from space you already own.",
    intro:
      "Converting existing space is usually cheaper than building new. A basement, an attached garage, or an upper floor with its own entrance can become a rentable unit for considerably less than new construction, because the shell already exists and only needs to be made habitable and compliant.",
    why: [
      "Conversion is typically less expensive than new construction for the same finished area.",
      "Rental income from the unit begins offsetting the household's own housing cost immediately.",
      "Egress, fire separation, and utility work must all be done properly, and that is where the cost sits.",
    ],
    partner: "Contractors",
    partnerWhy: "Conversion work, and frequently follow-on projects on the main house.",
    faqs: [
      {
        q: "Is converting a basement to a rental legal?",
        a: "It depends entirely on your local zoning and building code. Requirements usually cover ceiling height, egress windows, fire separation, and sometimes separate utilities or parking. Some jurisdictions permit it readily and others prohibit it outright — check before you spend anything.",
      },
      {
        q: "What does a conversion cost?",
        a: "Driven mainly by what is missing. Adding a bathroom and kitchen, creating a compliant egress, and providing separate heating are the expensive items. A space that already has a bathroom and good access costs a fraction of one that does not.",
      },
      {
        q: "Will my insurance and taxes change?",
        a: "Almost certainly both. Renting part of your home changes your insurance requirements, and the improvement may raise your assessment. Tell your insurer — an undisclosed rental unit can void a claim.",
      },
      {
        q: "How does this affect selling later?",
        a: "A permitted, compliant unit is usually an asset and appeals to buyers who want the income. An unpermitted one is a liability that surfaces during inspection and frequently costs more to resolve than it would have cost to permit properly.",
      },
    ],
  },
  {
    n: 24,
    slug: "purchase-commercial-property",
    category: "real-estate",
    reason: "Purchase commercial property",
    h1: "Using Home Equity to Purchase Commercial Property",
    title: "Home Equity to Buy Commercial Property | Equity Direct",
    description:
      "Fund the deposit on commercial property from home equity — including buying the building your own business occupies.",
    intro:
      "Commercial lending asks more of a buyer than residential does: larger deposits, shorter terms, and frequently a balloon at the end. For an owner-operator, buying the building the business already occupies converts rent into equity — but the deposit has to be found first.",
    why: [
      "Commercial mortgages typically require a considerably larger deposit than residential.",
      "Owner-occupiers convert a rent payment into ownership of an appreciating asset.",
      "Commercial terms are often shorter, with a refinance or balloon due within a decade.",
    ],
    partner: "Commercial brokers",
    partnerWhy: "Transaction commission on a purchase that frequently stalls on the deposit.",
    faqs: [
      {
        q: "How much deposit does commercial property need?",
        a: "Commonly twenty to thirty percent or more for conventional commercial financing, though SBA programmes for owner-occupied premises can require considerably less. If you will occupy a majority of the building, investigate SBA options before assuming conventional terms.",
      },
      {
        q: "Should my business buy its own building?",
        a: "Often a sound move for a stable business with a long horizon — it converts rent into equity and fixes your occupancy cost. It is a poor move for a business that may need to change size or location, because commercial property is slow and costly to exit.",
      },
      {
        q: "What is a balloon payment and why does it matter?",
        a: "Many commercial loans amortise over a long period but come due in full after five to ten years, requiring a refinance. If credit conditions or the property's value have moved against you by then, that refinance can be difficult. Plan for it from the outset.",
      },
      {
        q: "Can I buy the property personally and lease it to my business?",
        a: "A very common structure, and frequently advantageous for tax and liability reasons. It needs to be documented properly with a genuine lease at a market rate — get your CPA and attorney to set it up rather than improvising it.",
      },
    ],
  },
  {
    n: 25,
    slug: "real-estate-syndication",
    category: "real-estate",
    reason: "Invest in a real estate syndication",
    h1: "Using Home Equity to Invest in a Real Estate Syndication",
    title: "Home Equity for Real Estate Syndication | Equity Direct",
    description:
      "Meet a syndication's minimum investment using home equity — and understand the illiquidity you are accepting before you commit.",
    intro:
      "Syndications let individual investors participate in institutional-scale property — apartment blocks, industrial parks, self-storage — for a minimum that is usually measured in tens of thousands. The capital is genuinely locked up for years, and that is the part that deserves the most thought.",
    why: [
      "Minimum investments are frequently large enough to exclude investors without liquid capital.",
      "Syndications offer scale and professional management an individual could not reach alone.",
      "Capital is committed for the full hold period and cannot generally be withdrawn early.",
    ],
    partner: "Syndication sponsors",
    partnerWhy: "Acquisition fees, asset management fees, and carried interest.",
    faqs: [
      {
        q: "What are the risks of syndication investing?",
        a: "Your capital is illiquid for the whole hold period, typically three to seven years or longer. You have no control over decisions. Distributions may be suspended. The sponsor's competence and integrity effectively determine the outcome, and a bad deal can lose the entire investment.",
      },
      {
        q: "Do I need to be an accredited investor?",
        a: "Most syndications are offered under exemptions that require accreditation, though some permit a limited number of sophisticated non-accredited investors. The sponsor will verify your status as part of subscribing.",
      },
      {
        q: "How do I evaluate a sponsor?",
        a: "Look at full-cycle track record including deals that went badly, how they communicated during difficulty, the fee structure, how much of their own money is in the deal, and whether their projected returns rest on assumptions that have to go right. Ask for references from investors in deals that underperformed.",
      },
      {
        q: "Is it wise to use home equity for this?",
        a: "It concentrates risk — property equity invested in more property, with your home behind an illiquid position you cannot exit if circumstances change. Some investors accept that deliberately. Anyone who has not thought carefully about the illiquidity should not.",
      },
    ],
  },
  {
    n: 26,
    slug: "private-real-estate-investment",
    category: "real-estate",
    reason: "Private real estate investment",
    h1: "Using Home Equity for Private Real Estate Investment",
    title: "Home Equity for Private Real Estate | Equity Direct",
    description:
      "Fund a private real estate investment or joint venture from home equity — with a clear view of the diligence it requires.",
    intro:
      "Private real estate covers everything outside public markets and formal syndications: joint ventures with an operator, private funds, notes, and direct partnerships. The opportunities can be genuinely good. The diligence burden sits entirely with you, because no exchange and no regulator is doing it on your behalf.",
    why: [
      "Private deals frequently require capital on a short timeline.",
      "Returns can exceed public markets, with correspondingly greater risk and no liquidity.",
      "Nobody is performing diligence for you — the entire responsibility is the investor's.",
    ],
    partner: "Sponsors and private investment managers",
    partnerWhy: "Management fees and performance participation.",
    faqs: [
      {
        q: "What should I check before investing privately?",
        a: "The operating agreement in full, the fee structure including anything not labelled a fee, the sponsor's track record through a downturn, how much of their own capital is committed, what happens if the deal needs more money, and precisely what rights you have if things go wrong. Have a securities attorney read the documents.",
      },
      {
        q: "How is this different from a syndication?",
        a: "Syndications are a formalised subset with standard structures and securities-law compliance. Private deals can be far less structured, which sometimes means better terms and frequently means weaker investor protections. Read the documents rather than relying on the label.",
      },
      {
        q: "What returns are realistic?",
        a: "Be sceptical of any projection presented with confidence. Ask what has to be true for the projection to hold, and what the outcome looks like if it is not. Sponsors who will discuss the downside candidly are generally the better ones.",
      },
      {
        q: "Can I get my money out early?",
        a: "Usually not. Private investments are illiquid by nature, and secondary sales where permitted at all typically happen at a discount. Only commit capital you will genuinely not need for the full term.",
      },
    ],
  },
];
