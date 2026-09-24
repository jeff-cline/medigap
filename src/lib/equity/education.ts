import type { EquityUse } from "./types";

// Rows 75–80 — education and training.
//
// Federal student aid usually offers protections that private funding does not:
// income-driven repayment, deferment, forgiveness programmes, and discharge on
// death or disability. Any page here that did not say so would be doing the
// reader a disservice, so all of them do.
export const EDUCATION: EquityUse[] = [
  {
    n: 75,
    slug: "college-tuition",
    category: "education",
    reason: "Pay college tuition",
    h1: "Using Home Equity to Pay College Tuition",
    title: "Home Equity to Pay College Tuition | Equity Direct",
    description:
      "Cover a tuition gap with home equity — after federal aid, and with a clear comparison against Parent PLUS loans.",
    intro:
      "The gap between what a family is assessed as able to contribute and what it can actually pay is where most college funding decisions get made. Tuition is due on a date that does not move, and families routinely reach for whatever is available rather than whatever is cheapest.",
    why: [
      "Assessed family contribution frequently exceeds what a household can pay from income.",
      "Parent PLUS loans carry an origination fee and a rate set annually by statute.",
      "Tuition deadlines fall before most families have finished comparing options.",
    ],
    partner: "Colleges and financial planners",
    partnerWhy: "Enrolment completion, and planning relationships with the family.",
    faqs: [
      {
        q: "Should I use home equity or a Parent PLUS loan?",
        a: "Compare the full cost. Parent PLUS carries an origination fee deducted up front plus interest that accrues immediately, but it also offers federal protections including deferment options and discharge on the borrower's death. Home equity has no monthly payment but is tied to your house. Neither is universally better.",
      },
      {
        q: "Should my child borrow instead?",
        a: "Federal student loans in the student's name carry lower rates than Parent PLUS, come with income-driven repayment, and qualify for forgiveness programmes. Most advisors suggest exhausting the student's federal eligibility before parents borrow anything.",
      },
      {
        q: "Does releasing home equity affect financial aid?",
        a: "The FAFSA does not count primary residence equity, though some institutions using the CSS Profile do consider it. Cash sitting in a parent's account is an assessable asset. Timing matters — discuss it with the financial aid office before acting.",
      },
      {
        q: "What if my child does not finish?",
        a: "The obligation remains regardless. Roughly a third of students do not complete within six years. Funding a first year and reassessing is more prudent than committing four years of costs up front.",
      },
    ],
  },
  {
    n: 76,
    slug: "graduate-school",
    category: "education",
    reason: "Pay for graduate school",
    h1: "Using Home Equity to Pay for Graduate School",
    title: "Home Equity for Graduate School | Equity Direct",
    description:
      "Fund a graduate degree from home equity — and compare it honestly against Grad PLUS and the earnings the degree will actually produce.",
    intro:
      "Graduate degrees vary enormously in what they return. Some reliably raise lifetime earnings by a substantial multiple of their cost; others do not cover their own tuition. The financing question is secondary to whether this specific programme, at this specific price, pays back.",
    why: [
      "Graduate federal loans carry higher rates and fees than undergraduate borrowing.",
      "Full-time study usually means foregone income as well as tuition.",
      "Returns differ dramatically by field and by institution.",
    ],
    partner: "Universities and financial planners",
    partnerWhy: "Tuition revenue and advisory relationships.",
    faqs: [
      {
        q: "Is graduate school worth the cost?",
        a: "It depends entirely on the field and the programme. Look at published outcome data for your specific programme rather than field averages — median salary at graduation, employment rate, and total debt at completion. Programmes reluctant to publish those numbers are telling you something.",
      },
      {
        q: "How does this compare with Grad PLUS?",
        a: "Grad PLUS carries an origination fee and a statutory rate, and offers income-driven repayment and potential forgiveness under Public Service Loan Forgiveness. Those protections have genuine value, particularly for public-sector careers. Weigh them rather than comparing headline rates alone.",
      },
      {
        q: "Should I keep working while studying?",
        a: "Part-time and executive programmes cost more per credit but avoid foregone income and often come with employer support. For mid-career students the total economics frequently favour continuing to work.",
      },
      {
        q: "What about employer tuition assistance?",
        a: "Check before funding anything yourself. Many employers offer meaningful annual assistance, some of it tax-advantaged. It usually comes with a commitment to stay for a period, which is worth reading carefully but is frequently worth accepting.",
      },
    ],
  },
  {
    n: 77,
    slug: "medical-school",
    category: "education",
    reason: "Pay for medical school",
    h1: "Using Home Equity to Pay for Medical School",
    title: "Home Equity for Medical School | Equity Direct",
    description:
      "Fund medical school costs from home equity — with realistic attention to the long gap before residency income arrives.",
    intro:
      "Medical education is among the largest educational investments there is, and the payback is both substantial and delayed. Four years of tuition are followed by residency years at modest pay, so the period during which costs exceed income runs considerably longer than the degree itself.",
    why: [
      "Total cost of attendance over four years is among the highest of any programme.",
      "Residency income is modest relative to the debt accumulated.",
      "Earnings eventually rise substantially, but the gap is long.",
    ],
    partner: "Universities and financial planners",
    partnerWhy: "Large tuition commitments over several years.",
    faqs: [
      {
        q: "How much does medical school cost?",
        a: "Total cost of attendance including living expenses runs to several hundred thousand dollars over four years at many institutions, with public in-state programmes materially lower. Add residency years at modest income before attending earnings begin.",
      },
      {
        q: "Should federal loans be used first?",
        a: "Generally yes. Federal loans for medical students offer income-driven repayment sized to residency income and eligibility for Public Service Loan Forgiveness, which matters enormously for anyone heading into academic or nonprofit medicine. Those protections are difficult to replace.",
      },
      {
        q: "What about service commitment programmes?",
        a: "The National Health Service Corps, military scholarship programmes, and various state schemes cover substantial costs in exchange for service in defined settings. They constrain your first years of practice but can eliminate most of the debt. Worth investigating before borrowing.",
      },
      {
        q: "Is home equity appropriate here?",
        a: "Most often as a supplement for costs federal aid does not reach, rather than as the primary source. Giving up income-driven repayment during residency — when income is lowest — is a significant thing to trade away.",
      },
    ],
  },
  {
    n: 78,
    slug: "private-school-tuition",
    category: "education",
    reason: "Pay private school tuition",
    h1: "Using Home Equity to Pay Private School Tuition",
    title: "Home Equity for Private School Tuition | Equity Direct",
    description:
      "Fund K-12 private school tuition from home equity — a recurring annual cost that needs a multi-year plan.",
    intro:
      "Private school tuition differs from every other education cost on this list in one important way: it recurs every year, often for a decade or more, and it rises. Funding one year is straightforward. Committing to a full school career is a materially larger decision.",
    why: [
      "Tuition is annual and typically increases each year.",
      "Families frequently commit to a school before working out the full multi-year cost.",
      "Moving a child mid-way through is disruptive, which reduces flexibility later.",
    ],
    partner: "Schools",
    partnerWhy: "Enrolment continuity, which is what independent schools plan around.",
    faqs: [
      {
        q: "Should I fund several years at once?",
        a: "Model the full period including expected increases before committing to the first year. Families who fund year one without that plan frequently face an uncomfortable decision later, and moving a settled child is harder than the spreadsheet suggests.",
      },
      {
        q: "Is financial aid available at private schools?",
        a: "More widely than most families assume. Many independent schools have substantial aid budgets and use need assessments similar to college processes. Apply — families who assume they will not qualify frequently would have.",
      },
      {
        q: "Are there tax-advantaged options?",
        a: "529 plans may be used for K-12 tuition up to an annual limit under federal rules, though state treatment varies and some states do not conform. Check your state's position and the current limit before relying on it.",
      },
      {
        q: "What about moving to a better public district instead?",
        a: "Worth comparing honestly. The premium on housing in a strong district, spread over the years of schooling, sometimes costs less than private tuition — and it builds equity rather than consuming it.",
      },
    ],
  },
  {
    n: 79,
    slug: "pay-student-loans",
    category: "education",
    reason: "Pay off student loans",
    h1: "Using Home Equity to Pay Off Student Loans",
    title: "Home Equity to Pay Off Student Loans | Equity Direct",
    description:
      "Clear student loans using home equity — after understanding exactly which federal protections you would be giving up.",
    intro:
      "This decision turns almost entirely on what kind of loans you hold. Private student loans have few protections and refinancing them is often sensible. Federal loans carry benefits — income-driven repayment, forgiveness programmes, discharge on death or disability — that cannot be bought back once surrendered.",
    why: [
      "Private student loans generally lack the protections federal loans carry.",
      "Federal benefits are lost permanently once the loan is paid off or refinanced privately.",
      "Clearing the balance removes the monthly payment and the associated interest.",
    ],
    partner: "Financial advisors",
    partnerWhy: "Debt strategy work and the planning relationship that follows it.",
    faqs: [
      {
        q: "Should I pay off federal student loans this way?",
        a: "Be cautious. Federal loans carry income-driven repayment, deferment and forbearance, Public Service Loan Forgiveness, and discharge on death or permanent disability. If you work in public service, or your income is variable, those protections may be worth considerably more than any interest saving.",
      },
      {
        q: "What about private student loans?",
        a: "Private loans typically offer little beyond what your contract states, so the calculation is a straightforward cost comparison. This is where paying off from equity most often makes sense.",
      },
      {
        q: "How do I find out what I have?",
        a: "Check the federal student aid site for your federal loans; anything not listed there is private. Many borrowers hold both and are unclear which is which — establish this before making any decision.",
      },
      {
        q: "Does paying off student loans help my credit?",
        a: "The effect is usually modest and can be slightly negative in the short term as an instalment account closes. The real benefit is the freed monthly cash flow and reduced debt-to-income, which matters more for future borrowing.",
      },
    ],
  },
  {
    n: 80,
    slug: "professional-certification",
    category: "education",
    reason: "Fund a professional certification",
    h1: "Using Home Equity to Fund a Professional Certification",
    title: "Home Equity for Professional Certification | Equity Direct",
    description:
      "Fund a certification, licence, or trade credential from home equity — shorter and cheaper than a degree, with a faster payback.",
    intro:
      "Certifications and trade credentials occupy the most efficient corner of education spending. They take months rather than years, cost a fraction of a degree, and in trades and technical fields frequently produce an immediate and verifiable increase in earnings.",
    why: [
      "Programmes are short, so the earnings increase arrives quickly.",
      "Cost is typically a small fraction of a degree programme.",
      "Most certification programmes do not qualify for federal student aid.",
    ],
    partner: "Training providers and trade schools",
    partnerWhy: "Course enrolment, often with a defined and demonstrable outcome.",
    faqs: [
      {
        q: "Which certifications actually pay back?",
        a: "Licensed trades — electrical, HVAC, plumbing, welding — and technical credentials in healthcare and IT tend to show clear, measurable earnings effects. Verify with local job postings and wage data for your specific area rather than relying on the provider's marketing.",
      },
      {
        q: "Can I use federal aid for certification programmes?",
        a: "Often not. Many short programmes are not eligible for federal student aid, which is precisely why people fund them privately. Some are covered by workforce development grants or employer programmes — check both before paying yourself.",
      },
      {
        q: "How do I evaluate a programme?",
        a: "Ask for completion rates, job placement rates, and the pass rate on the relevant licensing exam — and ask whether those figures are independently verified. Programmes that will not provide them, or that lead with financing rather than outcomes, deserve scepticism.",
      },
      {
        q: "Will my employer pay for it?",
        a: "Frequently, particularly where the credential benefits them directly. Ask before funding it yourself — it is one of the most commonly unclaimed benefits there is.",
      },
    ],
  },
];
