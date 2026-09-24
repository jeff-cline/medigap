// ---------------------------------------------------------------------------
// Mammo Express — content, facts and citations.
//
// EVERYTHING medical on this site is sourced. Screening guidance genuinely
// differs between expert bodies, and self-referral genuinely differs by state,
// so the site states both rather than picking the convenient one. Getting this
// wrong is not a marketing problem, it is a safety and liability problem.
// ---------------------------------------------------------------------------

export const SITE = 'https://mammo.express'
export const BRAND = 'Mammo Express'

// Purple on white. Purple is the deliberate choice here rather than pink:
// research on gender priming found pink breast-cancer creative left women
// rating themselves as LESS at risk and less likely to act. Purple reads as
// considered and premium, carries none of that baggage, and gives far more
// contrast against white — which is what makes it pop.
export const COLORS = {
  ink: '#2E1065',        // near-black violet, for body text
  accent: '#7C3AED',     // vivid violet — the pop
  accentDeep: '#5B21B6', // 9.2:1 on white, for smaller text and hovers
  mid: '#6D28D9',        // 6.9:1 on white
  light: '#C4B5FD',      // highlights on dark violet
  white: '#FFFFFF',
  wash: '#F3EEFF',       // pale lavender panels
}

export type Source = { label: string; url: string }

export const SOURCES: Record<string, Source> = {
  mqsa: { label: 'FDA — Mammography Quality Standards Act', url: 'https://www.fda.gov/radiation-emitting-products/mammography-quality-standards-act-mqsa-and-mqsa-program' },
  mqsaFaq: { label: 'FDA — Frequently Asked Questions About MQSA', url: 'https://www.fda.gov/radiation-emitting-products/mammography-information-patients/frequently-asked-questions-about-mqsa' },
  density: { label: 'FDA — Understanding Breast Density', url: 'https://www.fda.gov/consumers/womens-health-topics/understanding-breast-density' },
  densityRule: { label: 'FDA — breast density reporting rule (effective 10 Sep 2024)', url: 'https://www.fda.gov/news-events/press-announcements/fda-updates-mammography-regulations-require-reporting-breast-density-information-and-enhance' },
  cdc: { label: 'CDC — About Mammograms', url: 'https://www.cdc.gov/breast-cancer/about/mammograms.html' },
  cdcScreening: { label: 'CDC — Breast Cancer Screening', url: 'https://www.cdc.gov/breast-cancer/screening/index.html' },
  uspstf: { label: 'USPSTF — Breast Cancer: Screening (2024)', url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/breast-cancer-screening' },
  acs: { label: 'American Cancer Society — screening recommendations', url: 'https://www.cancer.org/cancer/types/breast-cancer/screening-tests-and-early-detection/american-cancer-society-recommendations-for-the-early-detection-of-breast-cancer.html' },
  nci: { label: 'National Cancer Institute — Mammograms', url: 'https://www.cancer.gov/types/breast/screening/mammograms' },
  nysrs: { label: 'New York State Radiological Society — prescription requirement', url: 'https://nysrs.org/notice-to-all-members-2/' },
}

// --- how to prepare --------------------------------------------------------
// Straight from CDC/FDA guidance. Practical, specific, no invention.
export const PREP_STEPS: { title: string; body: string; source: Source }[] = [
  {
    title: 'Skip deodorant, perfume and powder that morning',
    body: 'Don’t wear deodorant, perfume or powder on the day of your appointment. These can show up as white spots on the X-ray and can mean repeating images. Bring your deodorant and put it on afterwards — most locations expect it.',
    source: SOURCES.cdc,
  },
  {
    title: 'Time it away from your period if you can',
    body: 'Breasts are often more tender the week before and during your period. If you still have periods, booking the week after usually makes the exam more comfortable. If that is not practical, it is far better to go than to wait.',
    source: SOURCES.cdc,
  },
  {
    title: 'Wear a two-piece outfit',
    body: 'You undress from the waist up, so a top with trousers or a skirt is easier than a dress. Many locations give you a gown that opens at the front.',
    source: SOURCES.cdc,
  },
  {
    title: 'Bring or forward your previous images',
    body: 'If you have had a mammogram somewhere else, ask that facility to send the images to your new location beforehand. Comparing this year against last year is one of the most useful things a radiologist can do.',
    source: SOURCES.nci,
  },
  {
    title: 'Tell the technologist what is going on',
    body: 'Say if you have breast implants, are breastfeeding, might be pregnant, have had surgery, or have noticed a lump or change. It changes how the images are taken — and a new lump or change means you need a diagnostic exam, not a screening one.',
    source: SOURCES.nci,
  },
  {
    title: 'Know what it feels like',
    body: 'Your breast is pressed firmly between two plates for a few seconds while the image is taken. Most people find it uncomfortable; some find it painful. It is over quickly — the whole appointment is usually around twenty minutes.',
    source: SOURCES.cdc,
  },
  {
    title: 'Expect a letter — including your breast density',
    body: 'You will get your results in plain language. Since September 2024 the FDA requires every facility in the US to tell you whether your breasts are dense. About half of women over 40 have dense tissue, which can hide cancers on a mammogram and is itself a risk factor. It is information, not alarm — discuss it with a clinician.',
    source: SOURCES.densityRule,
  },
]

// --- screening guidance ----------------------------------------------------
// Two respected bodies, two different answers. We show both.
export const GUIDELINES = [
  {
    body: 'U.S. Preventive Services Task Force (2024)',
    advice: 'Screening mammography every 2 years for women aged 40 to 74.',
    note: 'This is the recommendation most insurance plans are built around, and it drives no-cost-sharing coverage under the Affordable Care Act.',
    source: SOURCES.uspstf,
  },
  {
    body: 'American Cancer Society',
    advice: 'Optional yearly screening from 40. Yearly from 45 to 54. From 55, every 2 years or continue yearly.',
    note: 'The ACS puts more weight on yearly screening in the years when breast cancer is most often found at a treatable stage.',
    source: SOURCES.acs,
  },
]

// --- FAQ -------------------------------------------------------------------
export type Faq = { q: string; a: string; source?: Source }

export const FAQS: Faq[] = [
  {
    q: 'Do I really not need a doctor’s order?',
    a: 'For a routine screening mammogram, usually not. Federal law under the Mammography Quality Standards Act allows FDA-certified facilities to screen you without a referring clinician — the facility simply sends your results directly to you. But some states add their own requirement: New York, for example, requires a written order even for screening. Each location on this site tells you which applies, and we will not send you somewhere expecting a walk-in if that location needs paperwork.',
    source: SOURCES.mqsaFaq,
  },
  {
    q: 'What is the difference between a screening and a diagnostic mammogram?',
    a: 'A screening mammogram is for people with no symptoms — that is what you can book yourself here. A diagnostic mammogram is for when there is something specific to look at: a lump, pain, nipple discharge, a skin change, or a follow-up on a previous result. A diagnostic exam does need a clinician’s order. If you have noticed a change, please see a clinician rather than booking a screening.',
    source: SOURCES.nci,
  },
  {
    q: 'How often should I go?',
    a: 'It depends whose guidance you follow, and both are reasonable. The U.S. Preventive Services Task Force recommends every 2 years from age 40 to 74. The American Cancer Society recommends yearly from 45 to 54, with the option to start yearly at 40. If you have a family history, a known gene variant, dense breasts or prior chest radiation, your schedule may be different — that is a conversation with a clinician.',
    source: SOURCES.uspstf,
  },
  {
    q: 'What does it cost?',
    a: 'Under the Affordable Care Act, most private plans and Medicare cover screening mammography with no copay, no deductible and no coinsurance when you use an in-network facility. Booking yourself also skips the office-visit copay you would pay just to get a referral. What we cannot do is promise your specific plan behaves that way — check with your insurer, and ask the location what they charge if you are paying cash.',
  },
  {
    q: 'How long does the appointment take?',
    a: 'Usually about twenty minutes in total, with the imaging itself taking only a few minutes. That is why we call it express — the appointment was never the slow part. The waiting and the referral were.',
    source: SOURCES.cdc,
  },
  {
    q: 'Does it hurt?',
    a: 'Your breast is compressed firmly for a few seconds per image. Most people describe it as uncomfortable rather than painful, and a minority do find it painful. Booking the week after your period, and telling the technologist if you are struggling, both help. It is brief.',
    source: SOURCES.cdc,
  },
  {
    q: 'What is breast density and why am I being told about it?',
    a: 'Dense breast tissue looks white on a mammogram — and so do many cancers, which makes them harder to spot. Roughly half of women over 40 have dense breasts, and density is itself a modest risk factor. Since September 2024 the FDA requires every US facility to tell you your density in your results letter. If yours is dense, ask a clinician whether additional imaging makes sense for you.',
    source: SOURCES.density,
  },
  {
    q: 'Who gets my results?',
    a: 'The facility sends them to you directly, in plain language, and that is a federal requirement. If you give them the name of a clinician, they will send a copy there too. Mammo Express does not receive, store or have access to your images or your results — we schedule, we do not read.',
    source: SOURCES.mqsaFaq,
  },
  {
    q: 'Is Mammo Express a medical provider?',
    a: 'No. We are a scheduling front door. The imaging is performed by an independent, FDA-certified facility that you choose, and your relationship for the exam itself is with them. We do not provide medical care, we do not give medical advice, and we do not interpret results.',
  },
  {
    q: 'I am a man, or I am transgender or nonbinary. Does this apply to me?',
    a: 'Possibly. Breast cancer is far less common in men but it happens, and screening needs for transgender and nonbinary people depend on hormone use and surgical history. Anyone with breast tissue can be screened. The guidance above is written around the populations it was studied in — if you are outside that, a clinician can tell you what fits.',
  },
  {
    q: 'What happens after I book?',
    a: 'You pick a location and we hand you to that location’s own calendar to choose your time. We keep a note of where you went so we can remind you when you are due again — by default a year later, which you can change or switch off. We will never text you without your explicit consent.',
  },
  {
    q: 'How do I stop the reminders?',
    a: 'Reply STOP to any text, click unsubscribe in any email, or turn reminders off in your account. It takes effect immediately.',
  },
]

// --- per-page FAQ sets ------------------------------------------------------
// Every page carries its own questions rather than pointing at one FAQ page.
// An answer engine quoting a page should find the objection handled on that
// page, and each set is a different slice so the pages do not cannibalise.

export const HOME_FAQS: Faq[] = [
  {
    q: 'Am I actually allowed to do this?',
    a: 'Yes — for a routine screening mammogram, in most states. Federal law under the Mammography Quality Standards Act lets an FDA-certified facility screen you without a referring clinician; they then send your results directly to you. This has been true for years and most people were simply never told. Some states add their own rule — New York requires a written order even for screening — and we mark those locations clearly so you are never sent somewhere expecting to walk in when you cannot.',
    source: SOURCES.mqsaFaq,
  },
  {
    q: 'How much time does this actually save?',
    a: 'The exam is about twenty minutes and always was. What Mammo Express removes is the queue in front of it: the wait for a clinician appointment, the visit itself, the wait for the referral to reach the imaging centre, and the wait for a slot. For most people that is weeks, sometimes months, compressed into the minute it takes to pick a time.',
  },
  {
    q: 'What does it cost me?',
    a: 'Under the Affordable Care Act, most private plans and Medicare cover screening mammography with no copay, no deductible and no coinsurance at an in-network facility. Booking yourself also removes the office-visit copay you would otherwise pay purely to be told yes. Check your own plan, and ask the location for their self-pay price if you are uninsured.',
  },
  {
    q: 'What if I have found a lump?',
    a: 'Then you need a diagnostic mammogram rather than a screening one, and that does require a clinician’s order. Please contact a clinician instead of booking a screening appointment. It is not a reason to panic and it is a reason not to wait.',
    source: SOURCES.nci,
  },
  {
    q: 'Do you see my results?',
    a: 'No. The facility sends results directly to you in plain language — a federal requirement. Mammo Express does not receive, store or have access to your images or your results. We schedule; we do not read.',
    source: SOURCES.mqsaFaq,
  },
]

export const HOW_IT_WORKS_FAQS: Faq[] = [
  {
    q: 'Why do I need an account just to book?',
    a: 'Two reasons, both practical. It lets us hold your follow-up reminder, which is the part almost everyone forgets a year later. And it lets us tell the location you are coming, so the hand-off to their calendar is not anonymous. It takes about a minute and costs nothing.',
  },
  {
    q: 'What happens when I click “Pick a time”?',
    a: 'You go straight to that location’s own booking calendar and choose a slot with them. We record which location you picked so your history and your reminder are right, but the appointment itself lives with the facility.',
  },
  {
    q: 'Can I change or cancel my appointment?',
    a: 'Yes — through the location, since the appointment is theirs. Their phone number is on the location card and in your confirmation. Turning off reminders is separate and is done in your account.',
  },
  {
    q: 'What if there is no location near me yet?',
    a: 'Create an account anyway with your ZIP. We will tell you when a screening location opens in your area rather than leaving you to check back.',
  },
  {
    q: 'How do I stop the reminders?',
    a: 'Reply STOP to any text, click unsubscribe in any email, or switch them off in your account. It takes effect immediately, and we never text at all unless you explicitly ticked that box at signup.',
  },
]

export const LOCATION_FAQS: Faq[] = [
  {
    q: 'How do you choose which location to show me first?',
    a: 'By your ZIP code. An exact match comes first, then locations that list your ZIP as one they serve, then the nearest by ZIP proximity. You can pick any of them regardless of the order — the ranking is a convenience, not a restriction.',
  },
  {
    q: 'Are these facilities vetted?',
    a: 'Every location listed is an independent, FDA-certified mammography facility — certification under the Mammography Quality Standards Act is a federal requirement to operate at all. Mammo Express does not employ them, inspect them or supervise their work, and listing is not an endorsement.',
    source: SOURCES.mqsa,
  },
  {
    q: 'What does “written order required” mean on a location?',
    a: 'It means that state requires a written order even for a routine screening exam — New York is the main example. It does not mean you cannot go; the facility’s own radiologist can often write it. Call them first so you are not turned away on the day.',
    source: SOURCES.nysrs,
  },
  {
    q: 'What should I bring?',
    a: 'Photo ID, your insurance card if you have one, and the name of the facility where you had your last mammogram so they can request those images for comparison. Skip deodorant that morning.',
    source: SOURCES.cdc,
  },
]

export const PREPARE_FAQS: Faq[] = [
  {
    q: 'Why can’t I wear deodorant?',
    a: 'Antiperspirants and powders contain fine metallic particles that show up as white specks on the X-ray, and those specks can look like calcifications. It is a common cause of repeat images. Bring it with you and put it on afterwards.',
    source: SOURCES.cdc,
  },
  {
    q: 'Does it hurt?',
    a: 'Your breast is compressed firmly between two plates for a few seconds per image. Most people find it uncomfortable rather than painful; a minority do find it painful. Booking the week after your period helps, and so does telling the technologist if you are struggling.',
    source: SOURCES.cdc,
  },
  {
    q: 'What if I have implants?',
    a: 'Say so when you book and again when you arrive. Implants can obscure tissue, so the technologist uses additional displacement views to image around them. It is routine — it just needs to be known in advance.',
    source: SOURCES.nci,
  },
  {
    q: 'How long until I get results?',
    a: 'It varies by facility, but you will receive a letter in plain language, and since September 2024 it must also tell you whether your breasts are dense. Ask the location for their usual turnaround when you book.',
    source: SOURCES.densityRule,
  },
  {
    q: 'Can I bring someone with me?',
    a: 'Almost always, though they may wait outside the imaging room itself. If it helps you go, bring them — the appointment being uncomfortable is a real reason people put it off, and having company is a legitimate answer to that.',
  },
]

// --- SEO / answer-engine pages ---------------------------------------------
export type SeoPage = {
  slug: string
  title: string
  h1: string
  description: string
  intro: string
  body: { heading: string; text: string }[]
  faqs: Faq[]
  /** Slugs of sibling pages — the internal link graph, set deliberately. */
  related: string[]
}

export const SEO_PAGES: SeoPage[] = [
  {
    slug: 'mammogram-without-a-doctor-referral',
    title: 'Can You Get a Mammogram Without a Doctor’s Referral?',
    h1: 'Can you get a mammogram without a doctor’s referral?',
    description: 'In most of the US, yes — federal law allows self-referral for a screening mammogram. A few states add their own requirement. Here is exactly how it works.',
    intro: 'Short answer: for a routine screening mammogram, in most states you can book it yourself. The rule that allows this is federal, and it has been in place for years — most people simply have not been told.',
    body: [
      { heading: 'The federal rule', text: 'The Mammography Quality Standards Act governs every mammography facility in the United States. Under it, an FDA-certified facility may screen a person who does not have a referring clinician. The facility then has to send the results directly to you, in language you can understand. Self-referral is expected and accounted for in the regulation.' },
      { heading: 'Where states differ', text: 'A state can impose more than the federal floor. New York requires a written order even for a screening exam, and a radiologist at the facility can write it. That is why a blanket claim of "no referral needed anywhere" is wrong — the honest answer is that it depends on where you go, and the location should tell you before you travel.' },
      { heading: 'Screening versus diagnostic', text: 'Self-referral covers screening: no symptoms, routine interval. If you have found a lump, or have pain, discharge or a skin change, you need a diagnostic mammogram, and that does require a clinician’s order. Please do not book a screening exam to investigate a symptom — see a clinician.' },
      { heading: 'What it saves you', text: 'The office visit purely to obtain a referral costs you a copay, time off work, and typically weeks of delay. Removing that step is the entire point. The mammogram itself is usually covered with no cost sharing by most plans and by Medicare.' },
    ],
    faqs: [
      { q: 'Which states require a referral for a screening mammogram?', a: 'New York is the clearest example — its Department of Health requires a prescription for screening mammography, and a radiologist at the facility can write it. Other states occasionally apply their own conditions, and facilities can set their own policy on top of the law. Because it varies, each location on this site carries a flag, and we say so before you travel rather than after.', source: SOURCES.nysrs },
      { q: 'Will insurance still cover it without a referral?', a: 'Usually yes. Coverage of screening mammography under the Affordable Care Act is tied to the USPSTF recommendation, not to whether a clinician referred you. What can affect coverage is going outside the recommended interval or using an out-of-network facility. Check with your plan if you are unsure.' },
      { q: 'Who gets the results if there is no referring clinician?', a: 'You do. Under MQSA the facility must send results directly to the patient in plain language, and that is precisely the provision that makes self-referral workable. You can also give them a clinician’s name to copy.', source: SOURCES.mqsaFaq },
      { q: 'Does self-referral apply to diagnostic mammograms too?', a: 'No. Self-referral covers screening — routine, no symptoms. A diagnostic mammogram investigates something specific and requires a clinician’s order. If you have a lump, pain, discharge or a skin change, see a clinician.', source: SOURCES.nci },
    ],
    related: ['walk-in-mammogram-near-me', 'mammogram-cost-and-insurance', 'how-often-should-you-get-a-mammogram'],
  },
  {
    slug: 'how-to-prepare-for-a-mammogram',
    title: 'How to Prepare for a Mammogram',
    h1: 'How to prepare for a mammogram',
    description: 'No deodorant, time it after your period, wear two pieces, bring your prior images. Practical preparation drawn from CDC, FDA and NCI guidance.',
    intro: 'Preparation takes about two minutes of thought and makes the appointment quicker and more comfortable. All of this comes from CDC, FDA and National Cancer Institute guidance.',
    body: [
      { heading: 'The night before', text: 'Find out whether you have had a mammogram elsewhere, and if so, ring that facility and ask them to send your prior images. Comparison against last year is one of the most valuable things the radiologist has.' },
      { heading: 'The morning of', text: 'No deodorant, perfume or powder — the metallic particles in antiperspirant can appear as white specks on the image and can mean a repeat. Put it in your bag and apply it afterwards. Wear a top and trousers rather than a dress.' },
      { heading: 'At the appointment', text: 'Tell the technologist about implants, breastfeeding, possible pregnancy, previous surgery, or any lump or change you have noticed. The exam takes a few minutes; the whole visit is usually about twenty.' },
      { heading: 'Afterwards', text: 'You will get a results letter in plain language, and since September 2024 it must include whether your breasts are dense. Dense tissue is common and is not a diagnosis — but it does make mammograms harder to read, so it is worth discussing.' },
    ],
    faqs: [
      { q: 'What if I forget and wear deodorant?', a: 'Tell the technologist. Most facilities have wipes and you can simply clean it off before the images are taken. It is a common enough thing that they are ready for it.', source: SOURCES.cdc },
      { q: 'Should I take a painkiller beforehand?', a: 'Some people take an over-the-counter painkiller about an hour before if they know they find it painful. That is a reasonable thing to ask a pharmacist or clinician about for your own circumstances — it is not something we can advise on.' },
      { q: 'What if I am breastfeeding or might be pregnant?', a: 'Say so when you book and again when you arrive. It changes how and whether imaging is done, and the facility will advise. Do not simply skip the appointment without telling them.', source: SOURCES.nci },
      { q: 'How do I get my previous images sent over?', a: 'Ring the facility that took them and ask them to send the images to your new location — you will usually need to sign a release. Do it a week ahead if you can; comparison against last year is one of the most useful things the radiologist has.', source: SOURCES.nci },
    ],
    related: ['walk-in-mammogram-near-me', 'dense-breasts-what-it-means', 'mammogram-without-a-doctor-referral'],
  },
  {
    slug: 'how-often-should-you-get-a-mammogram',
    title: 'How Often Should You Get a Mammogram?',
    h1: 'How often should you get a mammogram?',
    description: 'USPSTF says every two years from 40. The American Cancer Society says yearly from 45. Both are credible — here is the difference and what it means for you.',
    intro: 'This is one of those questions where the honest answer is that experts disagree, and anyone telling you there is a single correct interval is oversimplifying.',
    body: [
      { heading: 'What the USPSTF says', text: 'In 2024 the U.S. Preventive Services Task Force recommended screening mammography every two years for women aged 40 to 74. It lowered the starting age to 40, citing rising incidence among women in their forties and higher mortality among Black women. It favours a two-year interval because it produces fewer false positives for a similar mortality benefit.' },
      { heading: 'What the American Cancer Society says', text: 'The ACS recommends the option of yearly screening from 40, yearly screening from 45 to 54, and from 55 either continuing yearly or moving to every two years. It weights the earlier detection of yearly screening more heavily.' },
      { heading: 'Why the difference matters', text: 'Insurance coverage tends to follow the USPSTF, because the Affordable Care Act ties no-cost-sharing preventive coverage to its recommendations. That does not make the ACS wrong; it means if you want yearly screening you should check how your plan treats it.' },
      { heading: 'When your schedule is different', text: 'Family history, a known BRCA or other gene variant, prior chest radiation, or dense breasts can all change what is right for you — sometimes earlier, sometimes more often, sometimes with additional imaging. That is a conversation with a clinician, not a website.' },
    ],
    faqs: [
      { q: 'Why do the USPSTF and the American Cancer Society disagree?', a: 'They weigh the same evidence differently. Yearly screening finds some cancers earlier; it also produces more false positives, more call-backs and more biopsies that turn out to be nothing. The USPSTF puts more weight on reducing that harm, the ACS on the earlier detection. Neither is being careless — it is a genuine trade-off.', source: SOURCES.uspstf },
      { q: 'Which one does my insurance follow?', a: 'Generally the USPSTF, because the Affordable Care Act ties no-cost-sharing preventive coverage to its recommendations. If you want yearly screening and your plan follows a two-year interval, ask how the extra exam would be billed before you book it.' },
      { q: 'When should I start if breast cancer runs in my family?', a: 'Possibly earlier than 40, and possibly with additional imaging. Family history, a known BRCA or other variant, and prior chest radiation all change the calculation. This is exactly the situation where you want a clinician rather than a general guideline.', source: SOURCES.cdcScreening },
      { q: 'Is there an age when I should stop?', a: 'The USPSTF recommendation runs to 74, and says the evidence is insufficient beyond that rather than that screening is wrong. Past 75 it becomes an individual conversation about overall health and life expectancy.', source: SOURCES.uspstf },
    ],
    related: ['mammogram-cost-and-insurance', 'dense-breasts-what-it-means', 'mammogram-without-a-doctor-referral'],
  },
  {
    slug: 'walk-in-mammogram-near-me',
    title: 'Walk-In Mammogram Appointments',
    h1: 'Walk-in and express mammogram appointments',
    description: 'Find a screening location, pick a time on their calendar, and go. No referral appointment first, no waiting weeks for a slot.',
    intro: 'The imaging takes a few minutes. Almost all of the delay people experience is administrative — getting an appointment to get a referral to get an appointment.',
    body: [
      { heading: 'How express scheduling works', text: 'You choose a location from the map, you are handed to that location’s own booking calendar, and you pick a time that suits you. Nothing sits in a queue waiting for paperwork.' },
      { heading: 'What to bring', text: 'Photo ID, your insurance card if you have one, and the name of the facility where you had your last mammogram so images can be compared. Skip deodorant that morning.' },
      { heading: 'If a location needs an order', text: 'Some states require a written order even for screening. Where that is the case, the location is marked so you know before you go, and the facility’s own radiologist can often write it.' },
    ],
    faqs: [
      { q: 'Is this really walk-in, or do I still book a slot?', a: 'You book a slot — you just book it yourself, immediately, rather than waiting on a referral. Some locations do accept genuine walk-ins; their card will say so. "Express" here means no queue in front of the appointment, not no appointment.' },
      { q: 'How soon can I usually be seen?', a: 'That depends entirely on the location’s own calendar, which is why we hand you straight to it rather than quoting a number we cannot keep. What we remove is the two-to-six week referral step in front of it.' },
      { q: 'What if the location I want has no times available?', a: 'Pick another from the map — most people have more than one within a reasonable distance, and availability varies a lot between facilities on any given week.' },
      { q: 'Do I need to bring anything?', a: 'Photo ID, insurance card if you have one, and the name of the facility that took your last mammogram. And skip deodorant that morning.', source: SOURCES.cdc },
    ],
    related: ['mammogram-without-a-doctor-referral', 'how-to-prepare-for-a-mammogram', 'mammogram-cost-and-insurance'],
  },
  {
    slug: 'mammogram-cost-and-insurance',
    title: 'What Does a Mammogram Cost?',
    h1: 'What does a screening mammogram cost?',
    description: 'Most plans and Medicare cover screening mammography with no copay. Booking yourself also removes the referral visit copay.',
    intro: 'For most people the screening exam itself costs nothing out of pocket. The costs that catch people out are the ones around it.',
    body: [
      { heading: 'The exam', text: 'Under the Affordable Care Act, most private plans and Medicare cover screening mammography with no copay, no deductible and no coinsurance at an in-network facility. Coverage rules follow the USPSTF recommendation, so an interval outside that may be treated differently by your plan.' },
      { heading: 'The visit you no longer need', text: 'Seeing a clinician purely to obtain a referral is itself a billable office visit with its own copay. Self-referral removes it.' },
      { heading: 'Diagnostic follow-up is different', text: 'If a screening mammogram finds something that needs another look, the follow-up diagnostic imaging is usually NOT covered at 100% in the way screening is. It is worth knowing that before you are surprised by a bill.' },
      { heading: 'Paying cash', text: 'If you are uninsured, ask the location directly for their self-pay price. Many publish it, and CDC-funded programmes provide free or low-cost screening for people who qualify.' },
    ],
    faqs: [
      { q: 'Is a screening mammogram really free?', a: 'For most insured people, yes — no copay, no deductible, no coinsurance at an in-network facility, under the Affordable Care Act’s preventive services rules. "Free" depends on your plan being subject to those rules, the facility being in network, and the interval matching what your plan covers.' },
      { q: 'Why did I get a bill after my mammogram?', a: 'Most often because the exam was coded as diagnostic rather than screening — which happens if you reported a symptom, or if it was follow-up imaging after an abnormal screening. Diagnostic imaging is generally not covered at 100% the way screening is. It is worth asking which one you are booked for.' },
      { q: 'What if I have no insurance?', a: 'Ask the location for their self-pay price, which many publish and which is often far lower than people expect. The CDC’s National Breast and Cervical Cancer Early Detection Program also provides free or low-cost screening for people who qualify on income and age.', source: SOURCES.cdcScreening },
      { q: 'Does skipping the referral visit save money?', a: 'Yes — that office visit is itself billable and carries its own copay. Removing it is a direct saving on top of the time.' },
    ],
    related: ['mammogram-without-a-doctor-referral', 'how-often-should-you-get-a-mammogram', 'walk-in-mammogram-near-me'],
  },
  {
    slug: 'dense-breasts-what-it-means',
    title: 'Dense Breasts: What Your Results Letter Means',
    h1: 'You were told you have dense breasts. What now?',
    description: 'About half of women over 40 have dense breast tissue. Since September 2024 every US facility must tell you. Here is what it does and does not mean.',
    intro: 'Since 10 September 2024 the FDA has required every mammography facility in the country to tell you whether your breasts are dense. A lot of people received that sentence for the first time and had no idea what to do with it.',
    body: [
      { heading: 'What density is', text: 'Breasts are made of fatty tissue and fibroglandular tissue. Fibroglandular tissue appears white on a mammogram. So do many tumours. The more dense tissue you have, the more places a small cancer can hide.' },
      { heading: 'It is common', text: 'Roughly half of women over 40 in the United States have dense breasts. It is not a disease, not a diagnosis and not something you caused. It also tends to decrease with age.' },
      { heading: 'It is a modest risk factor', text: 'Dense tissue is associated with a somewhat higher risk of developing breast cancer, separately from making detection harder. Both facts are worth knowing; neither is cause for panic.' },
      { heading: 'What to do about it', text: 'Ask a clinician whether supplemental imaging — ultrasound or MRI — makes sense given your density and your other risk factors. And keep screening. A mammogram that is harder to read is still far better than no mammogram.' },
    ],
    faqs: [
      { q: 'Does dense tissue mean I have cancer?', a: 'No. Density describes the proportion of fibroglandular to fatty tissue and nothing more. About half of women over 40 have dense breasts. It is common, it is not a diagnosis, and it is not something you caused.', source: SOURCES.density },
      { q: 'Why was I only told about this recently?', a: 'Because the FDA made it mandatory. Since 10 September 2024 every mammography facility in the United States must report breast density in the results letter. Many people received that sentence for the first time and had no context for it.', source: SOURCES.densityRule },
      { q: 'Should I have an ultrasound or MRI as well?', a: 'Possibly — it depends on your density together with your other risk factors, and it is a decision to make with a clinician. Supplemental imaging finds more cancers and also produces more false positives, so it is a judgement rather than an automatic yes.', source: SOURCES.density },
      { q: 'Is a mammogram still worth it if my breasts are dense?', a: 'Yes. Dense tissue makes a mammogram harder to read; it does not make it useless. A harder-to-read mammogram is still far better than no screening at all.', source: SOURCES.density },
    ],
    related: ['how-often-should-you-get-a-mammogram', 'how-to-prepare-for-a-mammogram', 'mammogram-cost-and-insurance'],
  },
]

export const findSeoPage = (slug: string) => SEO_PAGES.find((p) => p.slug === slug)

/** Resolve a page's `related` slugs to real pages, skipping anything missing. */
export const relatedPages = (p: SeoPage): SeoPage[] =>
  p.related.map(findSeoPage).filter((x): x is SeoPage => Boolean(x))

// --- disclaimers -----------------------------------------------------------
export const MEDICAL_DISCLAIMER =
  'Mammo Express is a scheduling service, not a medical provider. We do not provide medical advice, perform imaging or interpret results. Screening is carried out by independent FDA-certified facilities. If you have noticed a lump or any change in your breast, contact a clinician — that needs a diagnostic exam, not a screening appointment.'

export const SMS_CONSENT_TEXT =
  'I agree to receive appointment reminders, annual screening reminders and other timely health and wellness reminders from Mammo Express by text at the number I provided, including messages sent by an automated system. Consent is not a condition of any purchase or service. Message and data rates may apply; message frequency varies. Reply STOP to cancel or HELP for help.'
