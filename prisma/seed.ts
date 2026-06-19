import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const DEMO = process.env.SEED_DEMO === "1"; // demo/sample data only when explicitly requested

async function main() {
  // --- God account (always) ---
  const godHash = await bcrypt.hash("TEMP!234", 10);
  await db.user.upsert({
    where: { email: "jeff.cline@me.com" },
    update: {},
    create: { email: "jeff.cline@me.com", passwordHash: godHash, name: "Jeff Cline", role: "god", status: "active", mustChangePassword: true },
  });

  // --- Global settings (always) — the God knobs ---
  const settings: Record<string, string> = {
    minCallBidCents: "2500",          // $25 min per sold call
    defaultCallPriceCents: "7744",     // $77.44 house price for unsold/default calls
    defaultForwardNumber: "9728006670",// where default/house calls forward
    tollFreeCallerId: "+18006334427",  // caller ID used when bridging
    showUnrealized: "true",            // include unrealized (house) revenue in totals
    callWhisper: "true",               // whisper to agents on connect
    mgmtFeePct: "2", profitSharePct: "50", aiFeePct: "0", futureProofingPct: "5", investorPct: "100",
    autoApproveAgent: "true", autoApproveAdvertiser: "true", autoApproveInvestor: "false",
    autonomousMode: "learning", arbitrageTarget: "3.0",
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // --- Sites (always) ---
  await db.site.upsert({ where: { hostname: "medigap.plus" }, update: {}, create: { hostname: "medigap.plus", name: "Medigap.plus", kind: "management", goal: "God-account management portal + flagship consumer site", vertical: "medicare", theme: JSON.stringify({ primary: "#0b5", variant: "flagship" }) } });
  await db.site.upsert({ where: { hostname: "1-800-medigap.com" }, update: {}, create: { hostname: "1-800-medigap.com", name: "1-800-MEDIGAP", kind: "marketing", goal: "Drive calls to 1-800-MEDIGAP from TV/organic traffic", vertical: "medicare", theme: JSON.stringify({ primary: "#1e63d6", variant: "call-first" }) } });
  const flagship = await db.site.findUnique({ where: { hostname: "medigap.plus" } });

  // --- Integration checklist rows (always) ---
  const integrations: [string, string][] = [
    ["twilio", "Twilio — toll-free call tracking (1-800-MEDIGAP)"], ["groq", "Groq — voice AI intake & routing"],
    ["klaviyo", "Klaviyo — opted-in remarketing flows"], ["zapmail", "Zapmail — initial 1-2-3 cold email sequence"],
    ["stripe", "Stripe — all billing, deposits, ACH sweeps"], ["predictivedata", "PredictiveData — data append"],
    ["google_ads", "Google Ads — paid search + Google TV/video"], ["facebook", "Facebook/Meta — paid social + video"],
    ["claude", "Claude (Anthropic) — autonomous logic & predictions"], ["affiliate", "Affiliate / exit-traffic networks"],
    ["vibe", "Vibe.co — connected TV advertising"],
  ];
  for (const [key, label] of integrations) await db.integration.upsert({ where: { key }, update: { label }, create: { key, label } });

  if (!DEMO) { console.log("✅ Clean seed complete (no demo data) — God: jeff.cline@me.com / TEMP!234"); return; }

  // ===================== DEMO DATA (SEED_DEMO=1 only) =====================
  for (const [email, role, name] of [["agent@demo.com","agent","Demo Agent"],["advertiser@demo.com","advertiser","Demo Advertiser"],["investor@demo.com","investor","Demo Investor"],["marketing@demo.com","marketing","Demo Marketer"],["accounting@demo.com","accounting","Demo Accountant"]] as [string,string,string][]) {
    const u = await db.user.upsert({ where: { email }, update: {}, create: { email, passwordHash: await bcrypt.hash("TEMP!234", 10), name, role, mustChangePassword: true, stars: role === "agent" ? 4.5 : 0 } });
    if (role === "investor") await db.investor.upsert({ where: { userId: u.id }, update: {}, create: { userId: u.id, accredited: true, depositedCents: 1000000, deployedCents: 400000, profitCents: 120000 } });
  }
  const zips = [["33101","Miami","FL"],["85001","Phoenix","AZ"],["30301","Atlanta","GA"],["10001","New York","NY"]];
  for (let i = 0; i < 24; i++) {
    const [zip, city, state] = zips[i % zips.length];
    const lead = await db.lead.create({ data: { name: `Senior Lead ${i + 1}`, phone: `555${String(1000000 + i).slice(-7)}`, email: `lead${i + 1}@example.com`, dob: `19${45 + (i % 10)}-0${1 + (i % 9)}-1${i % 9}`, zip, city, state, vertical: ["medicare","medicare_advantage","supplement","housing","care"][i % 5], source: ["house","google","facebook","tv","organic"][i % 5], status: ["new","contacted","sold","new"][i % 4], valueCents: 2500 + (i % 5) * 500, siteId: flagship?.id } });
    await db.leadAnswer.createMany({ data: [{ leadId: lead.id, question: "Are you currently on Medicare?", answer: i % 2 ? "Yes, Part A & B" : "Turning 65 soon" }, { leadId: lead.id, question: "Do you have a supplement plan today?", answer: i % 3 ? "No" : "Yes, Plan G" }] });
    if (i % 2 === 0) { await db.call.create({ data: { leadId: lead.id, fromNumber: lead.phone, zip, state, durationSec: 120 + i * 5, status: "completed", source: "paid", disposition: "sold", priceCents: 2500 + (i % 6) * 500, siteId: flagship?.id } }); await db.ledgerEntry.create({ data: { type: "revenue", category: "call", channel: "auction", amountCents: 2500 + (i % 6) * 500, note: `Call ${i}` } }); }
    await db.ledgerEntry.create({ data: { type: "spend", category: "adspend", channel: i % 2 ? "google" : "facebook", amountCents: 800 + (i % 4) * 200, note: `Ad spend ${i}` } });
  }
  console.log("✅ Demo seed complete — God: jeff.cline@me.com / TEMP!234");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
