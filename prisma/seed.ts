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
