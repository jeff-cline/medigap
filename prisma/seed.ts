import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // --- God account ---
  const godHash = await bcrypt.hash("TEMP!234", 10);
  await db.user.upsert({
    where: { email: "jeff.cline@me.com" },
    update: {},
    create: {
      email: "jeff.cline@me.com",
      passwordHash: godHash,
      name: "Jeff Cline",
      role: "god",
      status: "active",
      mustChangePassword: true,
    },
  });

  // --- Sample users for each business unit (all TEMP!234, must change) ---
  const roles: [string, string, string][] = [
    ["agent@demo.com", "agent", "Demo Agent"],
    ["advertiser@demo.com", "advertiser", "Demo Advertiser"],
    ["investor@demo.com", "investor", "Demo Investor"],
    ["marketing@demo.com", "marketing", "Demo Marketer"],
    ["accounting@demo.com", "accounting", "Demo Accountant"],
  ];
  for (const [email, role, name] of roles) {
    const h = await bcrypt.hash("TEMP!234", 10);
    const u = await db.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: h, name, role, mustChangePassword: true,
        stars: role === "agent" ? 4.5 : 0 },
    });
    if (role === "investor") {
      await db.investor.upsert({
        where: { userId: u.id },
        update: {},
        create: { userId: u.id, accredited: true, depositedCents: 1000000, deployedCents: 400000, profitCents: 120000 },
      });
    }
  }

  // --- Global settings (the God knobs) ---
  const settings: Record<string, string> = {
    minCallBidCents: "2500", // $25 min per call
    mgmtFeePct: "2", // 2% of investor deposits
    profitSharePct: "50", // investors get 50% of profit
    aiFeePct: "0",
    futureProofingPct: "5",
    investorPct: "100", // % of new deployment open to investors
    autoApproveAgent: "true",
    autoApproveAdvertiser: "true",
    autoApproveInvestor: "false",
    autonomousMode: "learning", // off|assist|learning|full
    arbitrageTarget: "3.0", // $3 out per $1 in
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // --- Sites (the white-label network) ---
  await db.site.upsert({
    where: { hostname: "medigap.plus" },
    update: {},
    create: { hostname: "medigap.plus", name: "Medigap.plus", kind: "management",
      goal: "God-account management portal + flagship consumer site", vertical: "medicare",
      theme: JSON.stringify({ primary: "#0b5", variant: "flagship" }) },
  });
  await db.site.upsert({
    where: { hostname: "1-800-medigap.com" },
    update: {},
    create: { hostname: "1-800-medigap.com", name: "1-800-MEDIGAP", kind: "marketing",
      goal: "Drive calls to 1-800-MEDIGAP from TV/organic traffic", vertical: "medicare",
      theme: JSON.stringify({ primary: "#1e63d6", variant: "call-first" }) },
  });
  const flagship = await db.site.findUnique({ where: { hostname: "medigap.plus" } });

  // --- Integration checklist rows ---
  const integrations: [string, string][] = [
    ["twilio", "Twilio — toll-free call tracking (1-800-MEDIGAP)"],
    ["groq", "Groq — voice AI intake & routing"],
    ["klaviyo", "Klaviyo — opted-in remarketing flows"],
    ["zapmail", "Zapmail — initial 1-2-3 cold email sequence"],
    ["stripe", "Stripe — all billing, deposits, ACH sweeps"],
    ["datamoon", "Datamoon — data append (DOB/zip/contact enrichment)"],
    ["google_ads", "Google Ads — paid search + Google TV/video"],
    ["facebook", "Facebook/Meta — paid social + video"],
    ["claude", "Claude (Anthropic) — autonomous logic & predictions"],
    ["affiliate", "Affiliate / exit-traffic networks"],
    ["vibe", "Vibe.co — connected TV advertising"],
  ];
  for (const [key, label] of integrations) {
    await db.integration.upsert({ where: { key }, update: { label }, create: { key, label } });
  }

  // --- Sample leads + journey + calls + ledger so dashboards aren't empty ---
  const zips = [["33101","Miami","FL"],["85001","Phoenix","AZ"],["30301","Atlanta","GA"],["10001","New York","NY"]];
  for (let i = 0; i < 24; i++) {
    const [zip, city, state] = zips[i % zips.length];
    const lead = await db.lead.create({
      data: {
        name: `Senior Lead ${i + 1}`,
        phone: `555${String(1000000 + i).slice(-7)}`,
        email: `lead${i + 1}@example.com`,
        dob: `19${45 + (i % 10)}-0${1 + (i % 9)}-1${i % 9}`,
        zip, city, state,
        vertical: ["medicare","medicare_advantage","supplement","housing","care"][i % 5],
        source: ["house","google","facebook","tv","organic"][i % 5],
        status: ["new","contacted","sold","new"][i % 4],
        valueCents: 2500 + (i % 5) * 500,
        siteId: flagship?.id,
      },
    });
    await db.leadAnswer.createMany({
      data: [
        { leadId: lead.id, question: "Are you currently on Medicare?", answer: i % 2 ? "Yes, Part A & B" : "Turning 65 soon" },
        { leadId: lead.id, question: "Do you have a supplement plan today?", answer: i % 3 ? "No" : "Yes, Plan G" },
        { leadId: lead.id, question: "Best number to reach you?", answer: `555${String(1000000 + i).slice(-7)}` },
      ],
    });
    if (i % 2 === 0) {
      await db.call.create({
        data: { leadId: lead.id, fromNumber: lead.phone, zip, state,
          durationSec: 120 + i * 5, status: "completed",
          source: i % 4 === 0 ? "house" : "paid", priceCents: 2500 + (i % 6) * 500,
          siteId: flagship?.id },
      });
      await db.ledgerEntry.create({ data: { type: "revenue", category: "call", channel: "organic", amountCents: 2500 + (i % 6) * 500, note: `Call ${i}` } });
    }
    await db.ledgerEntry.create({ data: { type: "spend", category: "adspend", channel: i % 2 ? "google" : "facebook", amountCents: 800 + (i % 4) * 200, note: `Ad spend ${i}` } });
  }

  // --- Multiple agents with bids & seats (the auction) ---
  const agentDefs: [string, string, number][] = [
    ["sarah.agent@demo.com", "Sarah Mitchell", 4.9],
    ["mike.agent@demo.com", "Mike Cohen", 4.5],
    ["lisa.agent@demo.com", "Lisa Tran", 4.2],
    ["carlos.agent@demo.com", "Carlos Reyes", 3.8],
  ];
  const agentIds: string[] = [];
  for (let a = 0; a < agentDefs.length; a++) {
    const [email, name, stars] = agentDefs[a];
    const h = await bcrypt.hash("TEMP!234", 10);
    const u = await db.user.upsert({ where: { email }, update: {}, create: { email, passwordHash: h, name, role: "agent", stars, mustChangePassword: true } });
    agentIds.push(u.id);
    const zips = ["33101", "85001", "30301", "10001"];
    await db.agentBid.create({ data: { agentId: u.id, scope: "zip", scopeValue: zips[a % zips.length], amountCents: 2800 + a * 700, active: a !== 3, dailyCap: 20 + a * 5, budgetCents: 500000 } });
    if (a % 2 === 0) await db.agentBid.create({ data: { agentId: u.id, scope: "state", scopeValue: ["FL", "AZ", "GA", "NY"][a], amountCents: 2600 + a * 300, active: true, dailyCap: 40 } });
    await db.agentBid.create({ data: { agentId: u.id, scope: "national", scopeValue: "", amountCents: 2500 + a * 150, active: a < 2, dailyCap: 0 } });
    for (const z of zips.slice(0, 2 + (a % 3))) {
      await db.agentSeat.create({ data: { agentId: u.id, zip: z, monthlyFeeCents: 9900, active: true, paidThrough: new Date(2026, 6, 1) } });
      await db.transaction.create({ data: { kind: "charge", userId: u.id, amountCents: 9900, status: "settled", note: `Seat ${z} (monthly)` } });
    }
  }

  // --- Advertisers with ads, balances & click events ---
  const advDefs: [string, string][] = [
    ["dental.adv@demo.com", "BrightSmile Dental"],
    ["hearing.adv@demo.com", "ClearTone Hearing"],
    ["solar.adv@demo.com", "SunSaver Solar"],
  ];
  const adDefs = [
    { kind: "text", headline: "Free Senior Dental — $0 Copay Plans", body: "Dental, vision & hearing in one plan. See if you qualify.", placement: "inline", bid: 120, target: "https://example.com/dental" },
    { kind: "banner", headline: "Hear Every Word Again", body: "Rechargeable hearing aids from $0 with Medicare.", placement: "sidebar", bid: 180, target: "https://example.com/hearing" },
    { kind: "text", headline: "Cut Your Power Bill 70%", body: "Seniors in your ZIP may qualify for $0-down solar.", placement: "footer", bid: 95, target: "https://example.com/solar" },
    { kind: "banner", headline: "Final Expense — Lock $9,500 Coverage", body: "No medical exam. Rates from $20/mo.", placement: "exit", bid: 210, target: "https://example.com/fe" },
  ];
  for (let a = 0; a < advDefs.length; a++) {
    const [email, name] = advDefs[a];
    const h = await bcrypt.hash("TEMP!234", 10);
    const u = await db.user.upsert({ where: { email }, update: {}, create: { email, passwordHash: h, name, role: "advertiser", mustChangePassword: true } });
    await db.transaction.create({ data: { kind: "topup", userId: u.id, amountCents: 50000 + a * 25000, status: "settled", note: "Balance top-up (Stripe)" } });
    for (let k = 0; k < adDefs.length; k++) {
      if ((k + a) % 2 === 0) continue;
      const d = adDefs[k];
      const ad = await db.ad.create({ data: { advertiserId: u.id, kind: d.kind, headline: d.headline, body: d.body, targetUrl: d.target, bidCents: d.bid, balanceCents: 40000 + k * 10000, placement: d.placement, active: true } });
      for (let e = 0; e < 30 + k * 10; e++) await db.adEvent.create({ data: { adId: ad.id, kind: "impression", costCents: 0 } });
      for (let c = 0; c < 5 + k * 2; c++) {
        await db.adEvent.create({ data: { adId: ad.id, kind: "click", costCents: d.bid } });
        await db.ledgerEntry.create({ data: { type: "revenue", category: "click", channel: "advertiser", amountCents: d.bid, note: `Click ${d.headline}` } });
      }
    }
  }

  // --- Money words (keyword-triggered alternate flows) ---
  await db.moneyWord.createMany({ data: [
    { word: "peptides", partner: "VitalPeptide Rx", action: "qualify", payoutCents: 4500, logic: JSON.stringify(["Have you used peptides before?", "Are you working with a doctor?", "Best email for your consult?"]), active: true },
    { word: "diabetic", partner: "GlucoCare Supply", action: "transfer", payoutCents: 3800, active: true },
    { word: "back brace", partner: "OrthoRelief DME", action: "transfer", payoutCents: 5200, active: true },
    { word: "solar", partner: "SunSaver Solar", action: "qualify", payoutCents: 6000, logic: JSON.stringify(["Do you own your home?", "Average monthly power bill?"]), active: true },
    { word: "reverse mortgage", partner: "Heritage HECM", action: "transfer", payoutCents: 9000, active: false },
  ] });

  // --- Live upsell offers ---
  await db.upsellOffer.createMany({ data: [
    { name: "Mortgage Protection — $97/mo", trigger: "Homeowner, age 60-75, not buying Medigap", payoutCents: 6500, vendor: "Guardian MPI", active: true },
    { name: "Final Expense Whole Life", trigger: "No supplement interest; age 65+", payoutCents: 4800, vendor: "Legacy Final Expense", active: true },
    { name: "Dental/Vision/Hearing Add-on", trigger: "On MA plan without DVH", payoutCents: 2200, vendor: "BrightSmile Dental", active: true },
    { name: "Hospital Indemnity", trigger: "MA enrollee worried about copays", payoutCents: 3100, vendor: "ShieldGap", active: true },
  ] });

  // --- Autonomous risk products (carrier mode) ---
  await db.riskProduct.createMany({ data: [
    { name: "Mortgage Life Protection", premiumCents: 9700, sweepDays: 3, active: true, apiConfig: JSON.stringify({ carrier: "Reins Re A", sweep: "stripe_connect" }) },
    { name: "Accidental Death Benefit", premiumCents: 4900, sweepDays: 5, active: true, apiConfig: "{}" },
    { name: "Final Expense Whole Life", premiumCents: 5900, sweepDays: 3, active: true, apiConfig: "{}" },
  ] });

  // --- Marketing campaigns with A/B variants ---
  await db.campaign.createMany({ data: [
    { channel: "google", name: "Medigap Search — Brand", vertical: "supplement", variant: "A", headline: "Compare Medigap Plans in 60 Seconds", description: "Licensed help. No obligation.", spendCents: 320000, clicks: 4100, leads: 540, calls: 210, active: true },
    { channel: "google", name: "Medigap Search — Brand", vertical: "supplement", variant: "B", headline: "Medicare Supplement Quotes — Free", description: "Talk to a real specialist.", spendCents: 300000, clicks: 3800, leads: 610, calls: 250, active: true },
    { channel: "facebook", name: "MA $0 Premium — FL", vertical: "medicare_advantage", variant: "A", headline: "$0 Plans With Extra Benefits", description: "Dental, vision, OTC included.", spendCents: 180000, clicks: 5200, leads: 430, calls: 120, active: true },
    { channel: "tv", name: "1-800-MEDIGAP National Spot", vertical: "medicare", variant: "A", headline: "Call 1-800-MEDIGAP", description: "Connected TV / linear", spendCents: 750000, clicks: 0, leads: 1200, calls: 3400, active: true },
  ] });

  // --- Affiliate / exit-traffic offers ---
  await db.affiliateOffer.createMany({ data: [
    { name: "MediaAlpha — Auto Insurance Exit", code: "MA-AUTO-7781", apiUrl: "https://api.mediaalpha.com/v1", kind: "exit", clickValueCents: 140, active: true },
    { name: "Final Expense ClickWall", code: "FE-9920", apiUrl: "https://api.example-affil.com", kind: "text", clickValueCents: 95, active: true },
    { name: "Senior Discounts Banner Net", code: "SD-3310", apiUrl: "https://api.seniordiscounts.io", kind: "banner", clickValueCents: 60, active: true },
  ] });

  // --- Investor capital movements ---
  await db.transaction.createMany({ data: [
    { kind: "deposit", amountCents: 1000000, status: "settled", note: "Investor deposit — Demo Investor" },
    { kind: "fee", amountCents: 20000, status: "settled", note: "2% management fee" },
    { kind: "payout", amountCents: 60000, status: "settled", note: "Investor profit share (50%)" },
  ] });

  // --- Autonomous logic samples (with one pinned question) ---
  await db.autonomousLog.createMany({
    data: [
      { decision: "Shifted 18% of Google budget to FL zips 33xxx", rationale: "FL call-to-sale ratio ran 2.7x vs 1.9x network avg over trailing 7 days.", data: JSON.stringify({ roiBefore: 1.9, roiAfter: 2.7 }), pinned: false },
      { decision: "Raised min CPC for peptide money-word to $1.80", rationale: "Peptide partner payout rose; clicks still converting above floor.", data: "{}", pinned: false },
      { decision: "AWAITING APPROVAL: increase daily ad budget cap to $4,000", rationale: "Projected unspent demand after noon implies ~$1,900/day missed opportunity.", question: "Approve raising the daily ad budget cap from $2,000 to $4,000?", pinned: true },
    ],
  });

  console.log("✅ Seed complete — God: jeff.cline@me.com / TEMP!234");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
