import type { EquityUse } from "./types";

// Rows 27–45 — improving the home the equity came from.
// Cost ranges here are typical US market ranges and are presented as such.
// They move with region, specification, and the state of the trades.
export const HOME: EquityUse[] = [
  {
    n: 27,
    slug: "major-home-remodel",
    category: "home",
    reason: "Major home remodel",
    h1: "Using Home Equity for a Major Home Remodel",
    title: "Home Equity for a Major Remodel | Equity Direct",
    description:
      "Fund a whole-home remodel with the equity already in your home — no monthly payment while you are living through the work.",
    intro:
      "A whole-home remodel is the largest voluntary expense most families ever undertake, and it arrives with a second cost nobody budgets for: living through it. Adding a monthly payment to a period that may already involve a rental or a kitchen in the garage is what makes people postpone indefinitely.",
    why: [
      "Contractors work to a draw schedule, so money is needed at stages rather than all at once.",
      "Remodels overrun on both cost and time far more often than they come in under.",
      "The work reinvests directly into the asset the funding came from.",
    ],
    partner: "Remodeling contractors",
    partnerWhy: "Large, well-defined projects with a homeowner who can actually proceed.",
    typicalRange: "$30,000–$300,000+ depending on scope and market",
    faqs: [
      {
        q: "How much should I budget for a major remodel?",
        a: "Take your contractor's bid and add a contingency of at least fifteen to twenty percent — more on a house older than about fifty years, where opening walls routinely reveals wiring, plumbing, or framing that must be brought up to code before anything else can proceed.",
      },
      {
        q: "Will a remodel add as much value as it costs?",
        a: "Usually not dollar for dollar. Industry cost-versus-value studies consistently find most remodels recoup a portion rather than all of their cost at resale, with kitchens, bathrooms, and exterior work generally recouping more than highly personalised projects. Remodel because you want to live in the result.",
      },
      {
        q: "Should I move instead of remodelling?",
        a: "Compare honestly: the remodel cost against the transaction costs of selling and buying, the difference in property tax basis, and — often decisive — the mortgage rate you would give up. Many households find remodelling wins purely on the rate they already hold.",
      },
      {
        q: "How do contractor draws work with a lump sum?",
        a: "You receive the funds and pay the contractor to the agreed schedule yourself, which puts you rather than a lender in control of releasing money against completed work. Never pay substantially ahead of progress, whatever the reason offered.",
      },
    ],
  },
  {
    n: 28,
    slug: "kitchen-renovation",
    category: "home",
    reason: "Kitchen renovation",
    h1: "Using Home Equity for a Kitchen Renovation",
    title: "Home Equity for a Kitchen Renovation | Equity Direct",
    description:
      "Fund a kitchen renovation from home equity — the remodel that most reliably holds its value and most reliably runs over budget.",
    intro:
      "The kitchen is the room buyers judge a house by and the room that punishes a half-measure. Replacing cabinets without addressing the layout, or fitting good appliances into poor cabinetry, tends to produce a result that satisfies nobody and still costs most of the money.",
    why: [
      "Kitchens are consistently among the better-recouping remodels at resale.",
      "Cabinetry and appliances have long lead times and require deposits well ahead of installation.",
      "Moving plumbing, gas, or electrical to fix a bad layout is where unexpected cost appears.",
    ],
    partner: "Kitchen and cabinetry contractors",
    partnerWhy: "High-value projects with substantial material and labour components.",
    typicalRange: "$25,000–$100,000+ depending on specification",
    faqs: [
      {
        q: "How much does a kitchen renovation cost?",
        a: "Broadly, a cosmetic refresh sits in the low tens of thousands, a full replacement keeping the existing layout in the middle, and a full renovation that moves walls or services well above that. Cabinetry is usually the single largest line, followed by labour.",
      },
      {
        q: "What drives the price most?",
        a: "Cabinetry choice, whether the layout moves, and countertop material — in that order. Keeping plumbing and gas where they are saves a great deal. Custom cabinetry can cost several times semi-custom for a difference many people would not notice.",
      },
      {
        q: "How long will I be without a kitchen?",
        a: "Commonly six to twelve weeks for a full renovation, longer where cabinetry lead times are extended or permits are required. Plan a temporary kitchen arrangement — it makes an enormous difference to how the project feels.",
      },
      {
        q: "Does a new kitchen add value?",
        a: "It supports value and materially affects how quickly a house sells, but it rarely returns its full cost. A kitchen dramatically better than the neighbourhood standard returns least of all.",
      },
    ],
  },
  {
    n: 29,
    slug: "bathroom-remodel",
    category: "home",
    reason: "Bathroom remodel",
    h1: "Using Home Equity for a Bathroom Remodel",
    title: "Home Equity for a Bathroom Remodel | Equity Direct",
    description:
      "Fund a bathroom remodel from home equity — and handle the water damage that is so often found once the tile comes off.",
    intro:
      "Bathrooms are small rooms with a high concentration of expensive work: plumbing, waterproofing, tile, ventilation, and electrical all in a few square metres. They are also where hidden damage turns up most often, because a slow leak behind tile can go unnoticed for years.",
    why: [
      "Cost per square foot is among the highest in the house because of the trades involved.",
      "Concealed water damage is common and must be remediated before anything is rebuilt.",
      "Waterproofing done poorly fails invisibly and expensively a few years later.",
    ],
    partner: "Remodeling contractors",
    partnerWhy: "Defined-scope projects that frequently lead to further work in the house.",
    typicalRange: "$15,000–$75,000+ depending on size and specification",
    faqs: [
      {
        q: "How much does a bathroom remodel cost?",
        a: "A guest or hall bathroom typically sits in the mid-tens of thousands for a full renovation; a primary suite with a large shower, double vanity, and premium finishes runs considerably higher. Moving fixtures adds meaningfully to both cost and time.",
      },
      {
        q: "What is usually found behind the tile?",
        a: "Water damage to the substrate, rotten framing around the shower or tub, failed waterproofing, and sometimes mould. Budget a contingency specifically for this — it is common enough that it should be expected rather than treated as bad luck.",
      },
      {
        q: "Is a primary bathroom remodel worth doing before selling?",
        a: "A dated but clean bathroom rarely stops a sale; a visibly failing one does. If you are selling shortly, addressing function and cleanliness usually returns more than a full renovation would.",
      },
      {
        q: "Do I need a permit?",
        a: "Usually yes for anything involving plumbing or electrical changes. Unpermitted bathroom work is a frequent problem at sale, particularly where a bathroom has been added rather than replaced.",
      },
    ],
  },
  {
    n: 30,
    slug: "home-addition",
    category: "home",
    reason: "Add a room or addition",
    h1: "Using Home Equity to Add a Room or Addition",
    title: "Home Equity for a Home Addition | Equity Direct",
    description:
      "Fund an addition from home equity — add the space your family needs without giving up the mortgage rate you already have.",
    intro:
      "Additions are chosen by families who like where they live and have simply run out of room. The calculation is almost always addition versus moving, and for anyone holding a low mortgage rate the arithmetic has shifted decisively toward staying put and building.",
    why: [
      "Additions involve foundation, framing, roofing, and full systems work — effectively a small house.",
      "Permitting and design take months before construction starts.",
      "Staying avoids transaction costs and preserves an existing mortgage rate.",
    ],
    partner: "General contractors and architects",
    partnerWhy: "Large projects with both design and construction components.",
    typicalRange: "$50,000–$250,000+ depending on size and complexity",
    faqs: [
      {
        q: "How much does an addition cost?",
        a: "Usually quoted per square foot, and the range is wide because a bedroom over an existing garage is a very different job from a ground-up extension needing new foundations. Additions that include a kitchen or bathroom cost substantially more per square foot than plain living space.",
      },
      {
        q: "Addition or move?",
        a: "Compare the addition cost against the full cost of moving — agent fees, closing costs, moving expenses, a higher property tax basis, and the mortgage rate difference. With a materially lower rate on your current mortgage, staying frequently wins even when the addition looks expensive.",
      },
      {
        q: "How long does an addition take?",
        a: "Design and permitting commonly take several months before ground is broken, and construction several months more. A year from first conversation to completion is unremarkable.",
      },
      {
        q: "Will it appraise for what it cost?",
        a: "Not always. Appraisers work from comparable sales, so an addition that makes your house much larger than anything nearby may not be fully reflected. Build for how you will live in it, not as an investment.",
      },
    ],
  },
  {
    n: 31,
    slug: "swimming-pool",
    category: "home",
    reason: "Install a swimming pool",
    h1: "Using Home Equity to Install a Swimming Pool",
    title: "Home Equity to Install a Pool | Equity Direct",
    description:
      "Fund a pool from home equity — including the decking, fencing, and landscaping that the pool quote usually leaves out.",
    intro:
      "Pool quotes have a reputation for being the beginning rather than the total. The shell is one line; decking, fencing required by code, landscaping to repair the access damage, and the electrical work for pumps and heating frequently add a substantial fraction again.",
    why: [
      "The complete project routinely costs considerably more than the pool contractor's headline figure.",
      "Safety fencing is a legal requirement in most jurisdictions and is rarely included.",
      "Pool finance from specialist lenders is often priced well above a secured alternative.",
    ],
    partner: "Pool contractors",
    partnerWhy: "Large discretionary projects that stall almost entirely on funding.",
    typicalRange: "$40,000–$150,000+ installed, before landscaping",
    faqs: [
      {
        q: "What does a pool really cost?",
        a: "Budget for the pool itself plus decking or hardscape, code-required fencing, electrical for pumps and any heater, landscaping to repair equipment access, and the ongoing cost of chemicals, utilities, and maintenance. The running cost surprises people as much as the build.",
      },
      {
        q: "Does a pool add value to a home?",
        a: "It depends heavily on climate and neighbourhood. In hot markets where pools are expected, a good pool supports value; in cooler markets some buyers view one as a liability. Very few pools return their cost, so install one because you will swim in it.",
      },
      {
        q: "Will my insurance go up?",
        a: "Almost certainly, and you should tell your insurer. Pools are classed as an attractive nuisance, and many insurers require specific fencing and raise liability limits. An undisclosed pool can jeopardise a claim.",
      },
      {
        q: "How long does installation take?",
        a: "Commonly two to four months for an in-ground pool from permit to swimming, longer in busy seasons or where inspections are slow. Gunite pools take longer than fibreglass.",
      },
    ],
  },
  {
    n: 32,
    slug: "new-roof",
    category: "home",
    reason: "Replace the roof",
    h1: "Using Home Equity to Replace Your Roof",
    title: "Home Equity for a New Roof | Equity Direct",
    description:
      "Fund a roof replacement from home equity — the repair that gets more expensive the longer it waits.",
    intro:
      "A roof is the least discretionary item on this list. It protects everything under it, insurers increasingly refuse to cover houses with roofs past a certain age, and every month a failing roof is left the damage beneath it spreads into decking, insulation, and eventually the interior.",
    why: [
      "Insurers increasingly decline or non-renew policies on roofs beyond a certain age.",
      "Delay converts a roofing job into a roofing job plus structural and interior repairs.",
      "Roof replacement is sudden, large, and rarely something a household has saved for.",
    ],
    partner: "Roofing companies",
    partnerWhy: "Immediate, non-discretionary work where the only obstacle is funding.",
    typicalRange: "$10,000–$50,000+ depending on size, pitch, and material",
    faqs: [
      {
        q: "How much does a new roof cost?",
        a: "Architectural asphalt shingle on a straightforward roof is the common baseline; metal, tile, or slate cost substantially more. Price is driven by area, pitch, number of layers to remove, and how much decking needs replacing once the old roof is off.",
      },
      {
        q: "Will insurance pay for it?",
        a: "Insurance covers sudden damage such as storm or hail, not wear. If your roof is simply old, it is your cost. If there has been a storm event, have it inspected promptly — most policies have strict notification deadlines.",
      },
      {
        q: "How do I know if I need a full replacement?",
        a: "Widespread granule loss, curling or missing shingles, multiple leaks, sagging, or daylight visible in the attic all point to replacement. A single leak on an otherwise sound roof is usually a repair. Get more than one opinion, ideally including one from someone not selling roofs.",
      },
      {
        q: "Should I wait until it actually leaks?",
        a: "No. Once water reaches the decking you are paying for structural repair and often interior damage as well, and you may struggle to keep insurance in place in the meantime.",
      },
    ],
  },
  {
    n: 33,
    slug: "solar-system",
    category: "home",
    reason: "Install solar",
    h1: "Using Home Equity to Install Solar",
    title: "Home Equity to Install Solar Panels | Equity Direct",
    description:
      "Buy a solar system outright with home equity instead of leasing — own the asset and keep the incentives.",
    intro:
      "Solar leases and power purchase agreements make installation easy and ownership impossible. The company keeps the tax credit, you get a payment that often escalates annually, and the arrangement has to be transferred or bought out when you sell — which routinely complicates a sale.",
    why: [
      "Owning the system keeps available tax credits and incentives with the homeowner rather than the installer.",
      "Leases and PPAs frequently include annual escalators and complicate a future sale.",
      "An owned system generally supports property value in a way a leased one does not.",
    ],
    partner: "Solar installers",
    partnerWhy: "Cash purchases close faster and at better margin than financed installs.",
    faqs: [
      {
        q: "Should I buy solar outright or lease it?",
        a: "Buying keeps the incentives, avoids escalating payments, and leaves a clean title when you sell. Leasing requires no capital. Over a system's life, ownership is usually the better economics for anyone who can fund it — which is precisely why installers push leases so hard.",
      },
      {
        q: "What incentives are available?",
        a: "Federal, state, and utility incentives vary and have changed repeatedly in recent years, including changes to the federal residential credit. Verify what currently applies to your installation date and your state before you rely on any figure an installer quotes.",
      },
      {
        q: "How long is the payback?",
        a: "Driven by your electricity rate, your usage, local sun, system cost, and what your utility pays for exported power. Net metering rules have become materially less generous in several states, which lengthens payback considerably — ask specifically about your utility's current rules.",
      },
      {
        q: "Should I replace my roof first?",
        a: "Yes, if the roof is anywhere near the end of its life. Removing and reinstalling an array to replace a roof underneath it is a substantial avoidable cost.",
      },
    ],
  },
  {
    n: 34,
    slug: "battery-storage",
    category: "home",
    reason: "Add battery storage",
    h1: "Using Home Equity to Add Battery Storage",
    title: "Home Equity for Home Battery Storage | Equity Direct",
    description:
      "Fund home battery storage from equity — keep power through outages and store solar for the hours you actually use it.",
    intro:
      "Batteries have become the sensible companion to solar as utilities move away from generous net metering. If exported power earns little, storing it for evening use is worth considerably more than selling it — and the battery doubles as genuine outage protection.",
    why: [
      "Declining net metering makes stored power more valuable than exported power.",
      "Batteries provide real backup during outages, which grid instability has made a live concern.",
      "Storage is a substantial cost on top of a solar installation and rarely fits in the same budget.",
    ],
    partner: "Solar and energy storage companies",
    partnerWhy: "High-value add-on to an existing or new solar installation.",
    faqs: [
      {
        q: "How much does home battery storage cost?",
        a: "A single home battery unit installed typically runs well into five figures, with most households needing more than one for meaningful whole-home backup. Cost depends on capacity, whether a new inverter is required, and the complexity of integrating with any existing solar.",
      },
      {
        q: "Will a battery power my whole house?",
        a: "Usually not everything at once. Most installations back up selected critical circuits — refrigeration, some lighting, networking, medical equipment. Whole-home backup including air conditioning requires substantially more capacity.",
      },
      {
        q: "Do batteries qualify for incentives?",
        a: "Storage has been eligible for certain federal and state incentives, sometimes with conditions about pairing with solar. These rules have changed repeatedly — confirm current eligibility for your install date rather than relying on older guidance.",
      },
      {
        q: "How long do they last?",
        a: "Manufacturers typically warrant ten years with a stated capacity retention at the end. Real life depends on cycling and climate. Factor replacement into any long-run payback calculation.",
      },
    ],
  },
  {
    n: 35,
    slug: "hvac-replacement",
    category: "home",
    reason: "Replace HVAC",
    h1: "Using Home Equity to Replace Your HVAC System",
    title: "Home Equity for HVAC Replacement | Equity Direct",
    description:
      "Replace a failed heating or cooling system using home equity — usually an emergency, usually at the worst time of year.",
    intro:
      "HVAC systems fail in the middle of a heatwave or a cold snap, which is precisely when contractors are busiest and least inclined to negotiate. It is an emergency purchase made under time pressure with limited ability to compare — a combination that reliably produces a poor decision.",
    why: [
      "Failures happen in extreme weather, when the household has least ability to wait.",
      "Emergency replacement leaves no time to obtain and compare proper bids.",
      "Contractor financing offered at the point of sale is frequently expensive.",
    ],
    partner: "HVAC contractors",
    partnerWhy: "Immediate replacement work where funding is the only question.",
    typicalRange: "$8,000–$30,000+ depending on system and ductwork",
    faqs: [
      {
        q: "How much does HVAC replacement cost?",
        a: "A straightforward like-for-like replacement sits in the high four to low five figures; a full system with new ductwork, a heat pump conversion, or a multi-zone installation runs considerably higher. Efficiency rating and whether ductwork needs replacing drive most of the variation.",
      },
      {
        q: "Repair or replace?",
        a: "A common guide is to replace if the system is past about fifteen years and the repair costs a third or more of replacement, particularly if it uses a refrigerant being phased out. A newer system with a discrete failure is usually worth repairing.",
      },
      {
        q: "Is a heat pump worth considering?",
        a: "In many climates, yes — modern cold-climate heat pumps perform far better than their predecessors and may attract incentives. In very cold regions, back-up heat is still typically required. Get a contractor to model it for your actual house rather than quoting generalities.",
      },
      {
        q: "Should I take the contractor's financing?",
        a: "Read the terms closely. Promotional periods frequently convert to a high rate, and deferred-interest structures can charge the whole accrued amount retroactively if the balance is not cleared in time. Compare against alternatives before signing in a hot house.",
      },
    ],
  },
  {
    n: 36,
    slug: "new-windows",
    category: "home",
    reason: "Replace windows",
    h1: "Using Home Equity to Replace Your Windows",
    title: "Home Equity for New Windows | Equity Direct",
    description:
      "Fund whole-house window replacement from home equity — comfort and efficiency, and the end of high-pressure window sales pitches.",
    intro:
      "Window replacement is one of the few home projects with an entire sales culture built around it: the in-home visit, the price that drops dramatically if you sign tonight, the financing arranged on the spot. Knowing what you can fund independently changes that conversation completely.",
    why: [
      "Whole-house replacement is a large single cost, since windows are priced per opening.",
      "In-home sales operations rely on financing to disguise price.",
      "Old single-glazed windows affect comfort and energy cost measurably.",
    ],
    partner: "Window companies",
    partnerWhy: "Large whole-house orders rather than a few openings at a time.",
    typicalRange: "$10,000–$50,000+ for a whole house",
    faqs: [
      {
        q: "How much do replacement windows cost?",
        a: "Priced per window installed, with vinyl at the lower end and wood or fiberglass higher. A whole house therefore runs from the low tens of thousands upward. Custom sizes, unusual shapes, and full-frame rather than insert replacement all add.",
      },
      {
        q: "Will new windows pay for themselves in energy savings?",
        a: "Rarely on energy alone within a reasonable period — the savings are real but modest against the cost. The genuine benefits are comfort, reduced draughts and noise, and ease of operation. Be wary of any pitch built on energy payback.",
      },
      {
        q: "How do I avoid overpaying?",
        a: "Get three written quotes for the same specification, refuse to decide during the sales visit, and disregard any discount that expires that evening. That tactic exists specifically to prevent comparison.",
      },
      {
        q: "Should I replace all of them at once?",
        a: "Doing the whole house together usually earns better pricing and gives a consistent result. If budget forces a phased approach, start with the worst-performing elevation — typically whichever faces the prevailing weather.",
      },
    ],
  },
  {
    n: 37,
    slug: "landscaping",
    category: "home",
    reason: "Landscaping",
    h1: "Using Home Equity for Landscaping",
    title: "Home Equity for Landscaping | Equity Direct",
    description:
      "Fund landscaping, hardscape, drainage, and irrigation from home equity — including the drainage work that protects the house itself.",
    intro:
      "Landscaping spans the purely decorative and the structurally necessary. Planting is discretionary; grading and drainage that keep water away from a foundation are not. The two are usually quoted together, which can disguise how much of the budget is actually protecting the building.",
    why: [
      "Hardscape, retaining walls, and drainage are construction work priced accordingly.",
      "Drainage and grading problems damage foundations if left unaddressed.",
      "Irrigation and mature planting are substantial costs beyond the design itself.",
    ],
    partner: "Landscape contractors",
    partnerWhy: "Large design-and-build projects rather than maintenance work.",
    typicalRange: "$10,000–$100,000+ depending on scope",
    faqs: [
      {
        q: "What does landscaping cost?",
        a: "Planting and turf are the least expensive elements. Hardscape — patios, walls, walkways — is construction and priced as such. Drainage, irrigation, and lighting add meaningfully. A comprehensive design-and-build for a typical suburban lot commonly reaches well into five figures.",
      },
      {
        q: "Does landscaping add value?",
        a: "Good landscaping improves how quickly a house sells and how it is perceived more than it moves the appraisal. Drainage work that prevents foundation damage protects value in a far more direct sense.",
      },
      {
        q: "Should drainage come first?",
        a: "Always. Installing patios and planting over a drainage problem means removing them again later. Grading, drainage, and any retaining structures are the first phase of a properly sequenced project.",
      },
      {
        q: "Can I phase the work?",
        a: "Yes, and it is often sensible — but have the whole design drawn first so that each phase fits the finished plan. Phasing without a master plan produces a garden that looks assembled rather than designed.",
      },
    ],
  },
  {
    n: 38,
    slug: "outdoor-kitchen",
    category: "home",
    reason: "Build an outdoor kitchen",
    h1: "Using Home Equity to Build an Outdoor Kitchen",
    title: "Home Equity for an Outdoor Kitchen | Equity Direct",
    description:
      "Fund an outdoor kitchen and living area from home equity — with the utility runs that make it genuinely usable.",
    intro:
      "An outdoor kitchen is a construction project wearing a lifestyle label. Gas, water, drainage, and power all have to be run to a point in the garden, weatherproof cabinetry costs several times its indoor equivalent, and shade or cover is usually what determines whether the space is used.",
    why: [
      "Running gas, water, drainage, and electrical to the location is a substantial part of the cost.",
      "Outdoor-rated cabinetry and appliances cost considerably more than indoor equivalents.",
      "Covering or shading the space is what makes it usable for more of the year.",
    ],
    partner: "Outdoor living and hardscape contractors",
    partnerWhy: "High-margin projects that frequently expand once underway.",
    typicalRange: "$20,000–$100,000+ depending on scope",
    faqs: [
      {
        q: "What does an outdoor kitchen cost?",
        a: "A basic built-in grill with counter space sits in the low tens of thousands. A full installation with refrigeration, sink and plumbing, pizza oven, cover, and seating runs well beyond that. Utility runs from the house are a large and frequently underestimated component.",
      },
      {
        q: "Do I need permits?",
        a: "Usually, for gas, plumbing, and electrical work, and often for any roofed structure. Setback rules may restrict placement. Confirm before finalising a design rather than after.",
      },
      {
        q: "Will it add value?",
        a: "In warm climates where outdoor living is expected, a well-built installation supports value. In cooler regions the return is largely in enjoyment. As with pools, build it because you will use it.",
      },
      {
        q: "What makes the difference between used and unused?",
        a: "Proximity to the house and protection from sun and rain. An outdoor kitchen at the bottom of the garden with no cover gets used a handful of times a year, whatever it cost.",
      },
    ],
  },
  {
    n: 39,
    slug: "foundation-repair",
    category: "home",
    reason: "Foundation repair",
    h1: "Using Home Equity for Foundation Repair",
    title: "Home Equity for Foundation Repair | Equity Direct",
    description:
      "Fund foundation repair from home equity — the problem that blocks a sale and worsens every season it is left.",
    intro:
      "Foundation problems are the most consequential repair a house can need. They worsen with every wet and dry cycle, they cause secondary damage throughout the structure, and they will be found at inspection — at which point a buyer either walks or demands far more than the repair would have cost.",
    why: [
      "Foundation movement is progressive and causes cascading damage elsewhere in the house.",
      "Insurance generally excludes settlement, so the cost falls on the owner.",
      "Discovery during a sale typically costs the seller more than proactive repair would have.",
    ],
    partner: "Foundation repair contractors",
    partnerWhy: "Urgent, non-discretionary work with a clear scope.",
    typicalRange: "$10,000–$100,000+ depending on method and extent",
    faqs: [
      {
        q: "How much does foundation repair cost?",
        a: "Minor crack injection is inexpensive. Piering or underpinning a settled foundation runs from the low tens of thousands upward depending on how many piers are needed and how deep they must go. Correcting drainage that caused the movement is a further cost and is essential.",
      },
      {
        q: "Does insurance cover it?",
        a: "Standard homeowner policies generally exclude settlement, soil movement, and earth shifting. Damage from a covered event such as a burst pipe may be included. Read your policy, and be realistic about what it will and will not do.",
      },
      {
        q: "How do I know it is serious?",
        a: "Diagonal cracks from window and door corners, doors that will not latch, sloping floors, and separation at exterior brick are common indicators. Get an assessment from a structural engineer who does not perform repairs — their opinion is independent of who wins the work.",
      },
      {
        q: "Can I sell without repairing?",
        a: "You can, but expect it to show at inspection, to shrink your buyer pool considerably, and to be negotiated at more than the repair cost. Many lenders will not finance a house with active structural problems.",
      },
    ],
  },
  {
    n: 40,
    slug: "storm-damage-repairs",
    category: "home",
    reason: "Storm damage repairs",
    h1: "Using Home Equity for Storm Damage Repairs",
    title: "Home Equity for Storm Repairs | Equity Direct",
    description:
      "Bridge the gap between storm damage and an insurance settlement — repair now, without waiting for the claim to conclude.",
    intro:
      "After a storm the urgent work cannot wait for the claim. Water must be stopped, the building dried, and temporary protection put up, all long before an adjuster has agreed anything. Households routinely find themselves needing to spend before they have been paid.",
    why: [
      "Emergency mitigation must happen immediately to prevent secondary damage.",
      "Claims take time, and settlements frequently arrive in stages.",
      "Deductibles, particularly percentage-based wind and hurricane deductibles, can be substantial.",
    ],
    partner: "Restoration and general contractors",
    partnerWhy: "Immediate work where the homeowner's cash position is the constraint.",
    faqs: [
      {
        q: "Should I wait for the insurance settlement before repairing?",
        a: "Not for emergency mitigation — most policies actually require you to prevent further damage, and failing to do so can reduce your claim. Document everything thoroughly with photographs and keep all receipts, then proceed with permanent repairs once scope is agreed.",
      },
      {
        q: "What if the settlement is less than the repair cost?",
        a: "You can dispute it, and many settlements are increased on review. A public adjuster or your contractor's estimate can support that. Depreciation held back until work is completed is also common — make sure you claim the recoverable portion after the repair.",
      },
      {
        q: "What is a percentage deductible?",
        a: "Many coastal and storm-exposed policies apply a wind or hurricane deductible as a percentage of the insured value rather than a flat sum, which on a substantial home can be tens of thousands. Check your declarations page before you need to.",
      },
      {
        q: "How do I avoid storm-chasing contractors?",
        a: "Be cautious of anyone who arrives unsolicited, pressures you to sign an assignment of benefits, or requires a large payment up front. Use licensed local contractors, verify insurance, and never sign anything an adjuster has not seen.",
      },
    ],
  },
  {
    n: 41,
    slug: "age-in-place-modifications",
    category: "home",
    reason: "Age-in-place modifications",
    h1: "Using Home Equity for Age-in-Place Modifications",
    title: "Home Equity for Aging in Place | Equity Direct",
    description:
      "Fund the modifications that let you stay in your own home — at a fraction of the cost of assisted living.",
    intro:
      "The economics of aging in place are stark. A one-time investment in a walk-in shower, grab bars, better lighting, and a ground-floor bedroom is measured in thousands. Assisted living is measured in thousands per month, indefinitely. For most families the modification is the obviously cheaper path.",
    why: [
      "A one-time modification cost compares favourably against recurring residential care fees.",
      "Falls are the leading cause of injury for older adults, and most happen at home.",
      "Staying in a familiar home has value that does not show up in any cost comparison.",
    ],
    partner: "Contractors and senior living advisors",
    partnerWhy: "Defined projects, often arranged with adult children involved.",
    faqs: [
      {
        q: "What modifications matter most?",
        a: "A step-free entry, a walk-in or roll-in shower with grab bars, a ground-floor bedroom and full bathroom, lever handles, wider doorways, improved lighting, and removing trip hazards. The bathroom is where most falls happen and is usually the first priority.",
      },
      {
        q: "How does the cost compare with assisted living?",
        a: "Comprehensive modification of a typical home is generally a one-time cost in the tens of thousands. Assisted living is a recurring monthly cost that continues for as long as it is needed. Over even a couple of years the comparison is rarely close.",
      },
      {
        q: "Will Medicare pay for home modifications?",
        a: "Medicare generally does not cover home modifications. Some Medicaid waiver programmes, VA benefits for eligible veterans, and state or area-agency programmes may contribute. Check what you qualify for before assuming the whole cost is yours.",
      },
      {
        q: "When should modifications be made?",
        a: "Before they are needed. Work done calmly in advance is cheaper and better than work arranged urgently after a fall or a hospital discharge, when time pressure removes every option.",
      },
    ],
  },
  {
    n: 42,
    slug: "accessibility-renovation",
    category: "home",
    reason: "Accessibility renovation",
    h1: "Using Home Equity for an Accessibility Renovation",
    title: "Home Equity for Accessibility Renovation | Equity Direct",
    description:
      "Fund wheelchair access, a roll-in shower, a lift, or a fully adapted bathroom using home equity — often needed on a hospital's timeline.",
    intro:
      "Accessibility work frequently arrives without warning, after an injury or a diagnosis, on a timeline set by a hospital discharge date. The house has to change in weeks, not months, and insurance covers very little of what is required to make a home genuinely usable.",
    why: [
      "The need often appears suddenly and on a fixed medical timeline.",
      "Ramps, door widening, lifts, and adapted bathrooms are substantial construction work.",
      "Health insurance rarely covers structural modification to a home.",
    ],
    partner: "Contractors specialising in accessibility",
    partnerWhy: "Specialist work where speed and expertise both matter.",
    faqs: [
      {
        q: "What does an accessibility renovation involve?",
        a: "Commonly a ramped or level entry, widened doorways, a roll-in shower with appropriate fittings, lowered counters and sinks, accessible controls, and sometimes a stair lift or through-floor lift. Turning space matters as much as width and is often overlooked.",
      },
      {
        q: "Will insurance or Medicare cover it?",
        a: "Health insurance and Medicare generally do not cover structural home modification. Medicaid waivers, VA grants for eligible veterans such as SAH and SHA, and some state programmes may help. Apply early — these processes take time you may not have.",
      },
      {
        q: "How quickly can this be done?",
        a: "A ramp and grab bars can be done in days. A bathroom conversion takes weeks. A lift requires structural work and lead time. If a discharge date is approaching, sequence the essential items first and complete the rest afterwards.",
      },
      {
        q: "Should I adapt or move?",
        a: "Adapting a familiar home is usually preferable where the structure allows it. A house with a bathroom only on an upper floor and no room for a lift may simply be unsuitable — an occupational therapist's assessment will tell you honestly which situation you are in.",
      },
    ],
  },
  {
    n: 43,
    slug: "whole-home-generator",
    category: "home",
    reason: "Install a whole-home generator",
    h1: "Using Home Equity to Install a Whole-Home Generator",
    title: "Home Equity for a Home Generator | Equity Direct",
    description:
      "Fund a standby generator from home equity — power that matters most where outages are longest and medical equipment is involved.",
    intro:
      "Standby generators moved from luxury to necessity for a lot of households as grid reliability became a live concern. Where someone depends on medical equipment, or where outages last days rather than hours, a generator is closer to infrastructure than to a convenience.",
    why: [
      "Installation involves a gas connection, a concrete pad, and a transfer switch — not just the unit.",
      "Extended outages cause real losses in spoiled food, frozen pipes, and disrupted work.",
      "Medical equipment dependence makes backup power a safety matter rather than a comfort.",
    ],
    partner: "Generator dealers and electrical contractors",
    partnerWhy: "Equipment sale plus installation, often with a service contract.",
    faqs: [
      {
        q: "What does a whole-home generator cost installed?",
        a: "The unit is typically about half the total. Installation adds the concrete pad, the automatic transfer switch, electrical work, a gas line connection, and permits. Budget for the complete installed price rather than the advertised unit price.",
      },
      {
        q: "Standby generator or battery?",
        a: "A gas standby generator runs indefinitely while fuel lasts and handles whole-home loads including air conditioning. A battery is silent, needs no fuel, and pairs with solar, but has finite capacity. For multi-day outages a generator usually wins; for short frequent ones a battery often does.",
      },
      {
        q: "What size do I need?",
        a: "It depends on whether you want essential circuits or the whole house including air conditioning and well pumps. An electrician should calculate the actual load rather than estimating from square footage.",
      },
      {
        q: "What maintenance is required?",
        a: "Standby units self-test weekly and need periodic oil and filter changes, typically annually or by running hours. Neglected generators fail precisely when they are finally needed.",
      },
    ],
  },
  {
    n: 44,
    slug: "septic-or-well-replacement",
    category: "home",
    reason: "Replace a septic system or well",
    h1: "Using Home Equity to Replace a Septic System or Well",
    title: "Home Equity for Septic or Well Replacement | Equity Direct",
    description:
      "Fund a failed septic system or well from home equity — an urgent, uninsured cost that makes a home uninhabitable and unsellable.",
    intro:
      "A failed septic system or a dry well makes a house immediately unlivable and immediately unsellable. It is almost never covered by insurance, it is frequently a health department matter with a compliance deadline attached, and it is one of the largest unplanned costs rural homeowners face.",
    why: [
      "A failed system can render a property uninhabitable and unmortgageable.",
      "Homeowner insurance generally excludes septic and well failure.",
      "Health departments can impose deadlines, and permits are required before work starts.",
    ],
    partner: "Septic and well contractors",
    partnerWhy: "Urgent work with a regulatory deadline behind it.",
    faqs: [
      {
        q: "How much does a new septic system cost?",
        a: "A conventional replacement system commonly runs into the tens of thousands. Engineered alternatives such as mound or aerobic systems — required where soil percolation is poor or the water table is high — cost substantially more. Perc testing and permitting come first and add to the total.",
      },
      {
        q: "What about drilling a new well?",
        a: "Cost depends principally on depth, which cannot be known with certainty in advance. Add the pump, pressure tank, electrical, and water testing. Drilling and finding insufficient water is a real risk in some areas, and you generally pay for the attempt.",
      },
      {
        q: "Will insurance cover any of it?",
        a: "Standard policies typically exclude septic and well failure as wear or maintenance. Damage from a specific covered peril might be included. Check your policy, but plan on funding it yourself.",
      },
      {
        q: "Can I sell a house with a failed septic system?",
        a: "Very difficult. Most lenders require a passing septic inspection, and many jurisdictions require certification at transfer. In practice it must be repaired before a sale can complete, and doing it under sale pressure costs more.",
      },
    ],
  },
  {
    n: 45,
    slug: "smart-home-upgrade",
    category: "home",
    reason: "Smart home upgrade",
    h1: "Using Home Equity for a Smart Home Upgrade",
    title: "Home Equity for a Smart Home Upgrade | Equity Direct",
    description:
      "Fund a properly integrated smart home — structured wiring, security, climate, and lighting installed as one system rather than assembled piecemeal.",
    intro:
      "There is a real difference between a house with smart devices in it and a smart home. The first is an accumulation of apps that do not talk to each other; the second is designed, wired, and commissioned as a system. The second costs considerably more and is the only one that people keep using.",
    why: [
      "Structured wiring and networking are infrastructure work best done in one pass.",
      "Integrated systems are reliable in a way that assembled consumer devices are not.",
      "Security, climate, and lighting integration deliver measurable convenience and some energy saving.",
    ],
    partner: "Smart home integrators",
    partnerWhy: "Equipment plus design and installation, often with ongoing support.",
    faqs: [
      {
        q: "What does a smart home installation cost?",
        a: "A DIY approach with consumer devices costs relatively little. A professionally designed system with structured wiring, a robust network, integrated lighting, climate, security, and audio-visual runs from the mid five figures upward. The network is the part people skimp on and then regret.",
      },
      {
        q: "Is it worth doing professionally?",
        a: "If you want it to work reliably for years and be usable by everyone in the household, yes. The common failure of DIY systems is not any single device but the absence of anything holding them together.",
      },
      {
        q: "Does it add resale value?",
        a: "Structured wiring and a good network are genuine assets. Proprietary systems tied to an account or a subscription can be a liability if a buyer cannot easily take them over. Favour open standards.",
      },
      {
        q: "What should be done first?",
        a: "The network. Everything else depends on it, and retrofitting proper cabling after walls are closed costs several times what it would have cost during other work.",
      },
    ],
  },
];
