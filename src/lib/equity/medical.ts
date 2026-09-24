import type { EquityUse } from "./types";

// Rows 81–90 — medical, dental, fertility, and care costs.
//
// These pages are read by people under genuine distress, and several of them
// have a free or cheaper option that should be tried first — hospital financial
// assistance, charity care, nonprofit negotiation. Every page that has one says
// so before it says anything about funding.
export const MEDICAL: EquityUse[] = [
  {
    n: 81,
    slug: "family-hospital-bill",
    category: "medical",
    reason: "Pay a family member's hospital bill",
    h1: "Using Home Equity to Pay a Hospital Bill",
    title: "Home Equity to Pay Medical Bills | Equity Direct",
    description:
      "Settle a large hospital bill using home equity — after asking for the financial assistance most hospitals are required to offer.",
    intro:
      "Before funding a hospital bill from any source, ask the hospital for its financial assistance policy. Nonprofit hospitals are required to have one, they are frequently far more generous than patients expect, and bills are regularly reduced or written off entirely for people who simply asked.",
    why: [
      "Nonprofit hospitals must maintain a written financial assistance policy.",
      "Itemised bills contain errors often enough that reviewing one is always worthwhile.",
      "Hospitals routinely discount substantially for prompt settlement.",
    ],
    partner: "Hospitals and medical billing advocates",
    partnerWhy: "Resolution of an outstanding receivable.",
    faqs: [
      {
        q: "What should I do before paying a large medical bill?",
        a: "Request an itemised bill and check it for errors and duplicate charges. Ask for the hospital's financial assistance or charity care policy and apply — nonprofit hospitals are required to have one. Then ask what discount is available for prompt payment. Each of these regularly reduces the bill substantially.",
      },
      {
        q: "Can medical bills be negotiated?",
        a: "Very often, yes. Hospitals accept far less than billed from insurers routinely, and many will negotiate with individuals — particularly for immediate settlement. Ask what the insurer-negotiated rate would have been and request the same.",
      },
      {
        q: "Should I put medical debt on a credit card?",
        a: "Generally no. Medical debt held by the provider typically carries no interest and has weaker collection treatment, including limits on credit reporting for smaller balances. Moving it to a card converts it into interest-bearing consumer debt and removes those protections.",
      },
      {
        q: "Is a payment plan better than funding it?",
        a: "Frequently, yes — many hospitals offer genuinely interest-free plans. Ask for that first. Funding from equity makes most sense where a discount for settlement is large, or where the debt has already gone to collection.",
      },
    ],
  },
  {
    n: 82,
    slug: "major-surgery",
    category: "medical",
    reason: "Pay for major surgery",
    h1: "Using Home Equity to Pay for Major Surgery",
    title: "Home Equity to Pay for Surgery | Equity Direct",
    description:
      "Fund surgery costs, deductibles, and recovery from home equity — including the lost income most people forget to budget.",
    intro:
      "The surgery is rarely the whole cost. Deductibles and coinsurance, anaesthesia and facility fees billed separately, follow-up care, physical therapy, and time away from work all accumulate — and for self-employed people the lost income during recovery frequently exceeds the medical bill itself.",
    why: [
      "Deductibles and out-of-pocket maximums reset annually and can be substantial.",
      "Anaesthesia, facility, and surgeon fees are frequently billed separately.",
      "Recovery time means lost income, particularly for self-employed households.",
    ],
    partner: "Surgeons and hospitals",
    partnerWhy: "Procedure scheduling that would otherwise be deferred.",
    faqs: [
      {
        q: "What should I ask before scheduling?",
        a: "Request a good-faith estimate in writing covering every component — surgeon, anaesthesia, facility, implants, and follow-up. Confirm every provider involved is in network, because an out-of-network anaesthetist attached to an in-network surgery is a classic and expensive surprise.",
      },
      {
        q: "What protections exist against surprise bills?",
        a: "Federal No Surprises Act protections limit balance billing in many emergency and certain in-network facility situations. They do not cover everything. If you receive an unexpected bill, ask specifically whether those protections apply before paying it.",
      },
      {
        q: "Should I wait until a new plan year?",
        a: "If your deductible is already met, completing treatment before the year ends can save a great deal. If it is not, and the procedure can safely wait, starting in the new year may be better. This is worth discussing with both your doctor and your insurer.",
      },
      {
        q: "How much should I budget for recovery?",
        a: "Ask your surgeon for a realistic return-to-work estimate and plan for the longer end of it. Recovery routinely takes longer than expected, and running out of money halfway through recovery is its own medical risk.",
      },
    ],
  },
  {
    n: 83,
    slug: "elective-surgery",
    category: "medical",
    reason: "Pay for elective surgery",
    h1: "Using Home Equity to Pay for Elective Surgery",
    title: "Home Equity for Elective Surgery | Equity Direct",
    description:
      "Fund elective or cosmetic surgery from home equity — usually not covered by insurance, and worth choosing the surgeon carefully.",
    intro:
      "Elective procedures are paid for entirely out of pocket, which creates a market where financing is offered aggressively at the point of consultation. That environment rewards deciding quickly, and deciding quickly is precisely the wrong approach to choosing someone who will operate on you.",
    why: [
      "Insurance generally does not cover cosmetic or elective procedures.",
      "Practice-offered financing is frequently expensive and presented under time pressure.",
      "Revision procedures are common enough that the possibility should be budgeted for.",
    ],
    partner: "Plastic and cosmetic surgeons",
    partnerWhy: "High-value procedures where funding is the deciding factor.",
    faqs: [
      {
        q: "How should I choose a surgeon?",
        a: "Board certification in the relevant specialty, hospital privileges for the procedure even if performed in an office, substantial specific experience with your procedure, and before-and-after photographs of their own patients. Price should be well down the list — revision surgery costs far more than choosing properly first.",
      },
      {
        q: "Is practice financing worth taking?",
        a: "Read the terms closely. Medical credit cards frequently use deferred-interest promotions that charge all accrued interest retroactively if the balance is not cleared exactly on time. That structure catches a great many patients.",
      },
      {
        q: "What should the quote include?",
        a: "Surgeon's fee, anaesthesia, facility fee, implants or materials, post-operative garments and medication, follow-up visits, and the policy on revision. Ask specifically what a revision would cost and under what circumstances it is included.",
      },
      {
        q: "What about medical tourism?",
        a: "Prices abroad are lower and some facilities are excellent, but complications after returning home are your problem and your cost, revision is difficult, and recourse is limited. Anyone considering it should budget for complications rather than assuming the best case.",
      },
    ],
  },
  {
    n: 84,
    slug: "dental-implants",
    category: "medical",
    reason: "Pay for dental implants",
    h1: "Using Home Equity to Pay for Dental Implants",
    title: "Home Equity for Dental Implants | Equity Direct",
    description:
      "Fund implants or full-arch restoration from home equity — dental insurance rarely covers more than a fraction.",
    intro:
      "Dental insurance was designed around annual maximums that have barely moved in decades, typically a low four-figure cap. Against a full-arch restoration costing many multiples of that, insurance is close to irrelevant, which is why dental work is so often funded personally.",
    why: [
      "Dental plan annual maximums are far below the cost of implant work.",
      "Full-arch restoration is among the most expensive dental procedures there is.",
      "Delay can mean bone loss, which adds grafting and cost to any eventual treatment.",
    ],
    partner: "Dentists and oral surgeons",
    partnerWhy: "High-value treatment plans that frequently stall on funding.",
    typicalRange: "$10,000–$50,000+ depending on the number of implants",
    faqs: [
      {
        q: "How much do dental implants cost?",
        a: "A single implant with abutment and crown typically runs into the low thousands. Full-arch restoration — often marketed under brand names for same-day teeth — runs to tens of thousands per arch. Bone grafting or sinus lift procedures add further.",
      },
      {
        q: "Will dental insurance help?",
        a: "Usually only marginally. Most plans cap annual benefits at a level far below implant costs, and some exclude implants entirely as cosmetic. Check whether your plan has a waiting period and a missing-tooth clause, both of which commonly apply.",
      },
      {
        q: "Are cheaper alternatives reasonable?",
        a: "Bridges and dentures cost considerably less and are appropriate for many patients. Implants preserve bone and function better long-term but are not the only acceptable answer. A dentist who presents alternatives honestly is worth more than one who presents only the most expensive option.",
      },
      {
        q: "Should I get a second opinion?",
        a: "For treatment plans of this size, yes. Recommended scope varies considerably between practitioners, and the difference between plans is frequently many thousands of dollars for a comparable clinical outcome.",
      },
    ],
  },
  {
    n: 85,
    slug: "fertility-ivf",
    category: "medical",
    reason: "Pay for fertility treatment or IVF",
    h1: "Using Home Equity to Pay for Fertility Treatment",
    title: "Home Equity for IVF and Fertility | Equity Direct",
    description:
      "Fund IVF or fertility treatment from home equity — including the reality that more than one cycle is often needed.",
    intro:
      "Fertility treatment combines high cost, limited insurance coverage, and a timeline that genuinely matters. Success rates decline with age, which means delay while funds are assembled has a real clinical cost — and multiple cycles are common enough that funding only one is usually optimistic.",
    why: [
      "Insurance coverage for fertility treatment varies enormously and is absent in many plans.",
      "More than one cycle is frequently required, and medication is a substantial separate cost.",
      "Success rates decline with age, so delay carries a clinical as well as financial cost.",
    ],
    partner: "Fertility clinics",
    partnerWhy: "Treatment cycles that would otherwise be postponed or abandoned.",
    typicalRange: "$15,000–$50,000+ across multiple cycles including medication",
    faqs: [
      {
        q: "How much does IVF cost?",
        a: "A single cycle commonly runs well into five figures before medication, which adds several thousand more. Genetic testing, freezing, and storage are further costs. Since many patients need more than one cycle, budget for the realistic total rather than the quoted single-cycle price.",
      },
      {
        q: "Will insurance cover any of it?",
        a: "It varies dramatically. A number of states mandate some fertility coverage, and a growing number of large employers offer a benefit. Check your plan documents specifically and ask your employer — this benefit has expanded considerably and many people do not know they have it.",
      },
      {
        q: "What are multi-cycle or refund programmes?",
        a: "Clinics often offer packages covering several cycles at a discount, sometimes with a partial refund if treatment is unsuccessful. These can be good value for patients likely to need multiple cycles. Read the eligibility and refund conditions carefully, as they are usually narrow.",
      },
      {
        q: "Should we fund one cycle or several?",
        a: "Funding a single cycle and needing another mid-treatment is a difficult position — emotionally and practically. Many couples fund for two or three from the outset. Ask your clinic for cumulative success rates at your age, which is the number that should drive the decision.",
      },
    ],
  },
  {
    n: 86,
    slug: "long-term-care",
    category: "medical",
    reason: "Pay for long-term care",
    h1: "Using Home Equity to Pay for Long-Term Care",
    title: "Home Equity to Pay for Long-Term Care | Equity Direct",
    description:
      "Fund long-term care from home equity — including how the home is treated for Medicaid purposes.",
    intro:
      "Long-term care is the expense that most reliably exhausts a lifetime of savings. Medicare does not cover extended custodial care, private costs run to several thousand a month, and Medicaid only begins after assets are largely spent. How the home fits into that picture is complicated and worth proper advice.",
    why: [
      "Medicare does not pay for extended custodial care.",
      "Monthly costs continue indefinitely, and the duration is unpredictable.",
      "Medicaid treatment of the home involves look-back rules and estate recovery.",
    ],
    partner: "Elder law attorneys and care advisors",
    partnerWhy: "Planning work where the sequence of decisions genuinely matters.",
    faqs: [
      {
        q: "Does Medicare cover long-term care?",
        a: "No, not for extended custodial care. Medicare covers limited skilled nursing following a qualifying hospital stay. Help with daily living — bathing, dressing, eating — which is what most long-term care actually consists of, is not covered.",
      },
      {
        q: "How does my home affect Medicaid eligibility?",
        a: "Rules are complex and vary by state. A primary residence is often exempt up to an equity limit while the applicant or a spouse lives there, but estate recovery may claim against it afterwards. Consult an elder law attorney before moving any assets — the look-back period penalises transfers made too late.",
      },
      {
        q: "Should equity be used before applying for Medicaid?",
        a: "This is precisely the question to put to an elder law attorney, not to a website. Transfers and spend-down decisions made in the wrong order can create eligibility penalties lasting months or years. Get advice before acting, not after.",
      },
      {
        q: "What does long-term care cost?",
        a: "Home health aides, assisted living, and skilled nursing rise in cost in that order, with skilled nursing commonly exceeding six figures annually in many markets. Costs vary substantially by region — look up figures for your own area.",
      },
    ],
  },
  {
    n: 87,
    slug: "assisted-living",
    category: "medical",
    reason: "Pay for assisted living",
    h1: "Using Home Equity to Pay for Assisted Living",
    title: "Home Equity to Pay for Assisted Living | Equity Direct",
    description:
      "Fund assisted living from home equity — particularly useful when one spouse moves and the other stays in the home.",
    intro:
      "Assisted living is usually paid for privately, month after month, for an unpredictable number of years. The common difficulty arises when one spouse needs care and the other remains at home: the house cannot be sold, yet it holds most of the family's wealth.",
    why: [
      "Assisted living is predominantly private-pay, with limited Medicaid participation.",
      "Monthly fees escalate as the level of care required increases.",
      "Selling the home is often impossible while a spouse still lives in it.",
    ],
    partner: "Senior living communities and placement advisors",
    partnerWhy: "Recurring monthly revenue and placement fees.",
    faqs: [
      {
        q: "How much does assisted living cost?",
        a: "Commonly several thousand dollars a month, varying widely by region and by the level of care included. Memory care costs substantially more. Most communities also charge a one-time community fee on entry.",
      },
      {
        q: "Will Medicare or Medicaid pay for it?",
        a: "Medicare does not cover assisted living room and board. Some states have Medicaid waiver programmes that contribute, but availability is limited, waiting lists are common, and participating communities are a subset. Most residents pay privately.",
      },
      {
        q: "What if one spouse stays in the home?",
        a: "This is the situation equity access most often addresses — the house cannot be sold, but the care must be funded. Community spouse protections under Medicaid rules are relevant here, and an elder law attorney should review the position before large decisions are made.",
      },
      {
        q: "Should we sell the home instead?",
        a: "Sometimes the right answer, particularly if nobody is living in it and it is producing cost without benefit. If a spouse remains, or if the family intends to keep it, accessing equity may achieve the same end without the disruption of a sale.",
      },
    ],
  },
  {
    n: 88,
    slug: "home-healthcare",
    category: "medical",
    reason: "Pay for home healthcare",
    h1: "Using Home Equity to Pay for Home Healthcare",
    title: "Home Equity for Home Healthcare | Equity Direct",
    description:
      "Fund in-home care from home equity — often the option families prefer, and frequently cheaper than residential care.",
    intro:
      "Most people would rather be cared for at home, and for moderate care needs it is frequently cheaper than a residential facility. The economics invert at high hourly requirements: once care approaches round-the-clock, in-home costs can exceed a care home considerably.",
    why: [
      "In-home care allows someone to remain in familiar surroundings.",
      "Cost is hourly, so it scales with need rather than being a flat monthly fee.",
      "Medicare covers only limited, intermittent skilled care — not ongoing custodial help.",
    ],
    partner: "Home health agencies",
    partnerWhy: "Recurring care revenue with a long client relationship.",
    faqs: [
      {
        q: "What does home healthcare cost?",
        a: "Usually charged hourly, with a minimum shift length. At a few hours a day it is considerably cheaper than residential care. At sixteen or twenty-four hours it typically exceeds assisted living and can exceed skilled nursing. Calculate against the hours actually required.",
      },
      {
        q: "Does Medicare cover home care?",
        a: "Only intermittent skilled nursing or therapy prescribed by a doctor for a homebound patient, and not for long. Ongoing help with daily living — the majority of what families need — is not covered.",
      },
      {
        q: "Agency or private hire?",
        a: "Agencies cost more but handle insurance, bonding, background checks, payroll taxes, and cover when a caregiver is sick. Hiring privately is cheaper and makes you an employer with the obligations that carries. Many families underestimate what that involves.",
      },
      {
        q: "How do we know when home care is no longer enough?",
        a: "When safety cannot be maintained between visits, when night-time needs become constant, or when the primary family caregiver is no longer coping. That last one is a legitimate reason on its own and families are often too slow to acknowledge it.",
      },
    ],
  },
  {
    n: 89,
    slug: "addiction-treatment",
    category: "medical",
    reason: "Pay for addiction treatment",
    h1: "Using Home Equity to Pay for Addiction Treatment",
    title: "Home Equity for Addiction Treatment | Equity Direct",
    description:
      "Fund inpatient or outpatient treatment from home equity — and check your insurance parity rights before paying privately.",
    intro:
      "Families arranging treatment are usually doing it urgently, often in crisis, and that is exactly when high-cost private programmes are easiest to sell. Before paying privately, check what your insurance must cover — federal parity law requires many plans to treat addiction comparably to physical conditions.",
    why: [
      "Residential treatment is expensive and frequently arranged under acute time pressure.",
      "Parity law requires many plans to cover substance use treatment comparably to medical care.",
      "More than one episode of treatment is common, so budgeting for a single stay may be optimistic.",
    ],
    partner: "Treatment centers",
    partnerWhy: "Admissions that would otherwise not proceed.",
    faqs: [
      {
        q: "What should I check before paying privately?",
        a: "Your insurance. The Mental Health Parity and Addiction Equity Act requires many plans to cover substance use treatment on terms comparable to medical care. Appeal denials — they are frequently overturned. SAMHSA's national helpline is free, confidential, and can point to treatment regardless of ability to pay.",
      },
      {
        q: "How do I choose a programme?",
        a: "Look for accreditation, licensed clinical staff, evidence-based treatment including medication-assisted treatment where appropriate, and a genuine aftercare plan. Be wary of programmes with aggressive call centres, paid referral arrangements, or luxury marketing in place of clinical detail.",
      },
      {
        q: "Is residential treatment necessary?",
        a: "Not always. Intensive outpatient programmes cost far less and are clinically appropriate for many people. A proper clinical assessment should determine the level of care — not a programme's admissions department, whose interest is not neutral.",
      },
      {
        q: "What if treatment does not work the first time?",
        a: "Relapse is common and is not a reason to give up. It does mean families should avoid committing every available resource to a single episode, leaving nothing for continuing care — which is frequently what determines the long-term outcome.",
      },
    ],
  },
  {
    n: 90,
    slug: "experimental-medical-care",
    category: "medical",
    reason: "Pay for experimental or private medical care",
    h1: "Using Home Equity for Experimental or Private Medical Care",
    title: "Home Equity for Experimental Treatment | Equity Direct",
    description:
      "Fund treatment outside standard insurance coverage — with the diligence that unproven care particularly requires.",
    intro:
      "Families facing a serious diagnosis after standard options are exhausted will consider almost anything, and there is an industry that understands this. Some experimental care is genuine and conducted under proper oversight. Some is not, and the distinction is harder to see from inside the situation than from outside it.",
    why: [
      "Insurance rarely covers treatment considered experimental or investigational.",
      "Legitimate clinical trials frequently provide treatment at no cost to the participant.",
      "Clinics offering unproven treatments for large cash payments are a recognised problem.",
    ],
    partner: "Medical providers and specialist clinics",
    partnerWhy: "Procedure and treatment revenue outside insurance reimbursement.",
    faqs: [
      {
        q: "Should I look at clinical trials first?",
        a: "Yes. Registered clinical trials are conducted under institutional review board oversight and frequently provide the investigational treatment at no charge. ClinicalTrials.gov lists them and your treating physician can help identify suitable ones. A legitimate trial asking for large payments is unusual and warrants questions.",
      },
      {
        q: "How do I evaluate a clinic offering unproven treatment?",
        a: "Ask whether the treatment is under IRB oversight, whether results are published in peer-reviewed literature, and what the actual evidence is. Testimonials are not evidence. Be very cautious of clinics treating many unrelated conditions with the same therapy, or requiring large payment up front.",
      },
      {
        q: "Will insurance cover any of it?",
        a: "Usually not, if it is classed as experimental — though standard care delivered alongside a trial sometimes is. Appeal denials with your physician's support; definitions of experimental are sometimes applied more broadly than a policy actually requires.",
      },
      {
        q: "How much should a family commit?",
        a: "This is an intensely personal decision and not one a website should make. What we would say is that decisions made under this kind of pressure benefit enormously from one person outside the immediate situation reviewing them before money moves.",
      },
    ],
  },
];
