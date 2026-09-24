import type { EquityUse } from "./types";

// Rows 66–74 — putting property equity into markets and private assets.
//
// This is the category where honest copy and good conversion pull in opposite
// directions, and honest copy wins. Leverage into volatile assets is a real
// strategy and a real way to lose a house. Every page here says both.
export const INVESTING: EquityUse[] = [
  {
    n: 66,
    slug: "invest-with-financial-advisor",
    category: "investing",
    reason: "Invest with a financial advisor",
    h1: "Using Home Equity to Invest with a Financial Advisor",
    title: "Home Equity to Invest with an Advisor | Equity Direct",
    description:
      "Fund a managed portfolio from home equity — including the questions to ask before handing anyone your equity to invest.",
    intro:
      "Placing property equity with an advisor is a decision with two separate questions inside it. The first is whether investing borrowed-against equity suits your circumstances at all. The second is whether this particular advisor is the right custodian for it. They deserve separate answers.",
    why: [
      "Advisory minimums can be high enough to exclude investors without liquid capital.",
      "Professional management suits investors who will not manage a portfolio themselves.",
      "Fee structure and standard of care vary enormously between advisors.",
    ],
    partner: "Registered investment advisors and wealth managers",
    partnerWhy: "Recurring fees on assets under management.",
    faqs: [
      {
        q: "Is it sensible to invest home equity?",
        a: "It can be for investors with a long horizon, stable income, and the capacity to sit through a substantial drawdown without needing the money. It is unsuitable for anyone who would be forced to sell at a loss, or who is relying on returns exceeding the cost of the equity to make it work.",
      },
      {
        q: "What should I ask an advisor before committing?",
        a: "Are you a fiduciary at all times and in writing? How exactly are you paid, including anything from third parties? What are the total costs including underlying fund expenses? And what is your view on investing equity released from a home — an advisor who is untroubled by that question is worth a second look.",
      },
      {
        q: "Fee-only or commission-based?",
        a: "Fee-only advisors are paid solely by you, removing product incentives. Commission-based advisors may be entirely competent but are compensated by what you buy. For a decision involving property equity, the absence of a product incentive has particular value.",
      },
      {
        q: "What return would I need for this to work?",
        a: "Enough to exceed the cost of the equity arrangement over the holding period, after fees and taxes, with a margin for the risk taken. Write that number down before you start. If it requires optimistic assumptions to clear, that is the answer.",
      },
    ],
  },
  {
    n: 67,
    slug: "build-investment-portfolio",
    category: "investing",
    reason: "Build an investment portfolio",
    h1: "Using Home Equity to Build an Investment Portfolio",
    title: "Home Equity to Build a Portfolio | Equity Direct",
    description:
      "Fund a diversified portfolio from home equity — a strategy that depends entirely on time horizon and temperament.",
    intro:
      "The case for investing equity rests on a spread: markets have historically returned more over long periods than the cost of accessing equity. The case against rests on sequence — the average is made of years that are nothing like the average, and the bad ones do not wait until it suits you.",
    why: [
      "Long horizons have historically favoured diversified equity exposure.",
      "Sequence of returns matters enormously when the capital has a cost attached.",
      "Concentration is the usual error; a portfolio funded this way should be broadly diversified.",
    ],
    partner: "Financial advisors",
    partnerWhy: "Recurring advisory revenue on a larger invested balance.",
    faqs: [
      {
        q: "What horizon does this require?",
        a: "Long — generally a decade or more. Over short periods the range of outcomes is wide enough that a poor start can leave you well behind, with the equity commitment still in place. If the money might be needed within a few years, this is not the right use.",
      },
      {
        q: "How should a portfolio like this be built?",
        a: "Broad, low-cost, and diversified across asset classes and geographies, rebalanced periodically. Costs are the one variable you control completely, and over long periods they compound against you exactly as returns compound for you.",
      },
      {
        q: "What is the actual risk here?",
        a: "That markets fall and stay down while the equity commitment remains. The genuine danger is being forced to sell at the bottom because circumstances changed. Anyone whose income is uncertain should not do this, however attractive the long-run arithmetic looks.",
      },
      {
        q: "Should I invest it all at once?",
        a: "Lump-sum investing has historically outperformed phasing in, on average, because markets rise more often than they fall. Phasing in reduces regret and the chance of a terrible entry point. If phasing in helps you stay invested through a fall, it is the better choice for you.",
      },
    ],
  },
  {
    n: 68,
    slug: "alternative-investment",
    category: "investing",
    reason: "Make an alternative investment",
    h1: "Using Home Equity for Alternative Investments",
    title: "Home Equity for Alternative Investments | Equity Direct",
    description:
      "Fund an allocation to alternatives from home equity — with clear eyes on lock-ups, fees, and valuation you cannot verify.",
    intro:
      "Alternatives cover everything outside listed stocks and bonds: private funds, real assets, hedge strategies, collectibles. They are sold on diversification and return potential. What is discussed less is that most are illiquid, many are expensive, and reported valuations are frequently the manager's own opinion.",
    why: [
      "Minimums are often high, and many offerings require accredited investor status.",
      "Capital is typically locked for years with no redemption route.",
      "Reported valuations in private vehicles are usually marks, not market prices.",
    ],
    partner: "Investment sponsors and managers",
    partnerWhy: "Management fees and performance participation.",
    faqs: [
      {
        q: "What counts as an alternative investment?",
        a: "Private equity and credit, hedge funds, real assets such as farmland or infrastructure, commodities, and collectibles. The common features are illiquidity, higher fees, less disclosure, and valuations that are not set by a market.",
      },
      {
        q: "How much should alternatives be of a portfolio?",
        a: "For most individual investors, a minority allocation at most, and only after the core is built. Sizing a position you cannot exit requires assuming you will not be able to exit — because you will not.",
      },
      {
        q: "What questions matter most?",
        a: "What are the total fees including anything at the underlying level? What is the lock-up and is there any redemption mechanism? How is the asset valued and by whom? What is the full-cycle track record including losses? And who audits it?",
      },
      {
        q: "Is home equity appropriate for this?",
        a: "It combines an illiquid investment with a commitment against your home, which concentrates rather than diversifies risk. Investors who do this deliberately, with a modest allocation and ample other resources, may have a case. Anyone reaching for returns to justify the equity cost does not.",
      },
    ],
  },
  {
    n: 69,
    slug: "private-equity-investment",
    category: "investing",
    reason: "Make a private equity investment",
    h1: "Using Home Equity for a Private Equity Investment",
    title: "Home Equity for Private Equity | Equity Direct",
    description:
      "Fund a private equity commitment from home equity — including the capital call obligation people overlook.",
    intro:
      "Private equity commitments work differently from other investments: you commit an amount, and the manager calls it in instalments over several years whenever they choose. Failing to meet a capital call carries severe penalties, so the commitment is not just the money — it is the obligation to have it available on demand.",
    why: [
      "Capital is drawn in unpredictable instalments across the fund's investment period.",
      "Defaulting on a capital call typically forfeits a substantial part of the existing interest.",
      "Fund lives commonly run ten years or more with no redemption route.",
    ],
    partner: "Private equity sponsors and placement advisors",
    partnerWhy: "Management fees and carried interest.",
    faqs: [
      {
        q: "How do capital calls work?",
        a: "You commit a total amount; the manager calls portions as investments are made, usually with short notice. You must have the cash available each time. This is the single most misunderstood feature and the one most likely to cause a problem.",
      },
      {
        q: "What happens if I cannot meet a call?",
        a: "Partnership agreements typically impose severe default remedies, commonly including forfeiture of a large part of your existing interest. This is why funding a commitment from a source that must itself be drawn requires very careful planning.",
      },
      {
        q: "What is the J-curve?",
        a: "Early years usually show negative returns as fees are charged before investments mature, with returns arriving later if the fund performs. Expect paper losses for several years — that pattern is normal rather than a warning sign.",
      },
      {
        q: "Is this suitable funded from home equity?",
        a: "The combination of an unpredictable call schedule, a decade-long lock-up, and a commitment against your home is a demanding one. It requires substantial resources outside this investment. If this would be a large share of your net worth, it is not suitable.",
      },
    ],
  },
  {
    n: 70,
    slug: "private-credit-investment",
    category: "investing",
    reason: "Make a private credit investment",
    h1: "Using Home Equity for a Private Credit Investment",
    title: "Home Equity for Private Credit | Equity Direct",
    description:
      "Fund a private credit allocation from home equity — attractive yields, and credit risk that shows up all at once.",
    intro:
      "Private credit has grown rapidly on the strength of yields well above public bonds. The yield is compensation for real risks: borrowers who could not access cheaper capital, limited liquidity, and loss patterns that stay benign for years and then arrive together when conditions turn.",
    why: [
      "Yields are typically well above public fixed income, reflecting the additional risk taken.",
      "Most vehicles are illiquid or offer only limited periodic redemption.",
      "Credit losses are cyclical — long benign periods are not evidence of low risk.",
    ],
    partner: "Private credit sponsors and advisors",
    partnerWhy: "Management fees and spread.",
    faqs: [
      {
        q: "What is private credit?",
        a: "Lending to companies outside the public bond market, usually by funds. Borrowers pay more than they would publicly, often because of size, complexity, or credit quality. Investors receive that higher yield and take the corresponding risk.",
      },
      {
        q: "How liquid is it?",
        a: "Generally not. Closed-end funds lock capital for the term. Interval and non-traded vehicles offer limited periodic redemption, which can be restricted precisely when many investors want out at once. Treat it as illiquid regardless of what the redemption policy says.",
      },
      {
        q: "What should I examine?",
        a: "Underwriting standards, loan-to-value and covenant quality, sector and borrower concentration, whether the fund uses leverage, the manager's loss history through a genuine credit cycle, and how loans are valued when they stop performing.",
      },
      {
        q: "Is the yield worth the risk?",
        a: "It depends on the manager and on where you are in the cycle. A yield premium that looks generous during an expansion can be inadequate compensation once defaults arrive. Assume losses will happen and ask whether the yield still justifies it.",
      },
    ],
  },
  {
    n: 71,
    slug: "invest-in-startup",
    category: "investing",
    reason: "Invest in a startup",
    h1: "Using Home Equity to Invest in a Startup",
    title: "Home Equity to Invest in a Startup | Equity Direct",
    description:
      "Fund a startup investment from home equity — the highest-risk use on this site, stated plainly.",
    intro:
      "Startup investing has the widest range of outcomes of anything on this site. Most early-stage companies fail completely, a few return capital, and a very small number produce the results everyone has heard about. Professional investors manage this with portfolios of many companies; individuals usually cannot.",
    why: [
      "The majority of early-stage companies fail, returning nothing at all.",
      "Returns concentrate in a small number of outcomes, which requires a portfolio to capture.",
      "Even successful companies take many years to produce liquidity.",
    ],
    partner: "Angel networks and investment platforms",
    partnerWhy: "Placement economics and carried interest.",
    faqs: [
      {
        q: "What is the realistic outcome?",
        a: "For a single startup investment, the most likely single outcome is a total loss. That is not pessimism, it is the base rate. Professional early-stage investors build portfolios of many companies precisely because they cannot pick which one works.",
      },
      {
        q: "How much should anyone invest?",
        a: "Only an amount you can lose entirely without it affecting your life. Using home equity for a single startup investment fails that test for almost everyone, and we would rather say so than not.",
      },
      {
        q: "What terms matter?",
        a: "Valuation, liquidation preference, pro-rata rights, anti-dilution, and board composition. A high valuation with a heavy preference stack can leave common shareholders with nothing in a modest exit. Have a lawyer read the documents.",
      },
      {
        q: "How long until any return?",
        a: "Typically seven to ten years or more, if ever. There is usually no secondary market. Assume the money is entirely inaccessible for the whole period.",
      },
    ],
  },
  {
    n: 72,
    slug: "invest-in-friends-business",
    category: "investing",
    reason: "Invest in a friend's business",
    h1: "Using Home Equity to Invest in a Friend's Business",
    title: "Home Equity to Invest in a Friend's Business | Equity Direct",
    description:
      "Fund an investment in someone you know — and document it properly, because the relationship depends on it more than the money does.",
    intro:
      "Investing with people you know carries a risk that does not appear on any term sheet: the relationship. Deals between friends and family are frequently documented poorly precisely because documenting them feels like distrust, and that omission is what turns a business loss into a permanent estrangement.",
    why: [
      "Personal deals are often undocumented, leaving expectations unstated and disputed later.",
      "The same information asymmetry exists as with any private investment, but diligence feels rude.",
      "A failed investment between friends costs the relationship as well as the money.",
    ],
    partner: "The business owner raising capital",
    partnerWhy: "Capital raised from a source that asks fewer questions than an institution.",
    faqs: [
      {
        q: "How should this be documented?",
        a: "Exactly as it would be with a stranger — in writing, prepared by a lawyer, covering whether it is debt or equity, the return expected, what happens if more capital is needed, what rights you have, and how you exit. Proposing this is not distrust; it is what protects the friendship.",
      },
      {
        q: "Should it be a loan or an equity stake?",
        a: "A loan has defined repayment and a defined return, with no upside. Equity shares the outcome in both directions. Debt is usually simpler between friends because the terms are unambiguous — and ambiguity is what causes the arguments.",
      },
      {
        q: "What diligence should I do?",
        a: "The same you would do for anyone: financial statements, the actual business plan, what the money is for specifically, what happens if it is not enough, and who else has invested on what terms. Someone unwilling to provide this is telling you something.",
      },
      {
        q: "Should I use home equity for this?",
        a: "Only if you would be at peace with losing it and still seeing that person at family events. That is the real test here, and it is not principally a financial one.",
      },
    ],
  },
  {
    n: 73,
    slug: "buy-precious-metals",
    category: "investing",
    reason: "Buy precious metals",
    h1: "Using Home Equity to Buy Precious Metals",
    title: "Home Equity to Buy Precious Metals | Equity Direct",
    description:
      "Fund a precious metals allocation from home equity — and understand dealer spreads before you buy anything.",
    intro:
      "Gold and silver are bought for reasons ranging from the sensible to the apocalyptic, and the industry serving those buyers contains both careful dealers and aggressive ones. The single most important number is the spread between what a dealer sells at and what they will buy back at — and it is rarely volunteered.",
    why: [
      "Metals are held as a diversifier and inflation hedge, producing no income while held.",
      "Dealer spreads and premiums vary enormously, and the difference is your immediate loss.",
      "Storage, insurance, and verification all carry real ongoing cost.",
    ],
    partner: "Precious metals dealers",
    partnerWhy: "Dealer margin, which is concentrated in the spread rather than a stated fee.",
    faqs: [
      {
        q: "What should I watch for when buying?",
        a: "Ask the dealer's buy-back price for the identical item at the same moment. The gap between that and the sale price is your instant loss. Be extremely cautious of anyone steering you toward collectible or 'rare' coins at high premiums instead of standard bullion — that is where the worst margins live.",
      },
      {
        q: "Bullion or collectible coins?",
        a: "For investment purposes, standard bullion with low premiums over spot. Numismatic and proof coins carry substantial markups justified by rarity claims that are frequently overstated and hard for a buyer to verify. High-pressure sales operations favour them for a reason.",
      },
      {
        q: "Where should metals be stored?",
        a: "Home storage risks theft and complicates insurance. Allocated, segregated storage at a reputable depository costs a small annual fee and is verifiable. Avoid arrangements where the dealer holds the metal without independent audit and segregation.",
      },
      {
        q: "How much of a portfolio should be metals?",
        a: "Most advisors who recommend any allocation suggest a small percentage. Metals produce no income and have had long flat periods. Anyone recommending a large allocation, particularly with urgency about economic collapse, is selling rather than advising.",
      },
    ],
  },
  {
    n: 74,
    slug: "structured-investments",
    category: "investing",
    reason: "Buy structured investments",
    h1: "Using Home Equity for Structured Investments",
    title: "Home Equity for Structured Products | Equity Direct",
    description:
      "Fund structured notes from home equity — with the credit risk and the embedded costs made explicit.",
    intro:
      "Structured notes promise shaped outcomes: downside buffers, enhanced upside, defined income. The shaping is done with derivatives, and it is paid for out of your return. They are also unsecured obligations of the issuing bank, which means the bank's solvency matters as much as the index the note references.",
    why: [
      "Payoff is defined by a formula, which suits investors who want a specific shape of outcome.",
      "The note is an unsecured claim on the issuer — issuer failure can mean total loss.",
      "Costs are embedded in the terms rather than charged visibly, and liquidity before maturity is poor.",
    ],
    partner: "Advisors and broker-dealers",
    partnerWhy: "Product and advisory economics embedded in the structure.",
    faqs: [
      {
        q: "What is a structured note?",
        a: "A debt instrument issued by a bank whose return depends on an underlying index or asset via a defined formula — for example, a buffer against the first portion of losses in exchange for a cap on gains. You hold the bank's credit risk, not the index itself.",
      },
      {
        q: "What are the real costs?",
        a: "Embedded rather than stated. The issuer's estimated value at issue is usually disclosed and is typically below the price you pay — that difference is the cost, and it is worth reading carefully because it is the one number that tells you what you are paying.",
      },
      {
        q: "Can I sell before maturity?",
        a: "Usually only back to the issuer at their price, and frequently at a meaningful discount. Structured notes are designed to be held to maturity. Treat the term as the real commitment.",
      },
      {
        q: "Is a buffer the same as protection?",
        a: "No, and the distinction matters. A buffer absorbs the first portion of losses and you take everything beyond it. A barrier can disappear entirely if breached, exposing you to the full decline. Know precisely which one you have.",
      },
    ],
  },
];
