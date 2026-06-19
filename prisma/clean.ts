import { PrismaClient } from "@prisma/client";

// Wipes all transactional + demo data, KEEPING: God account, settings, integration rows, sites.
// Use to take the platform to a real-data-only state. Run: npx tsx prisma/clean.ts
const db = new PrismaClient();

async function main() {
  await db.adEvent.deleteMany({});
  await db.ad.deleteMany({});
  await db.leadAnswer.deleteMany({});
  await db.call.deleteMany({});
  await db.agentBid.deleteMany({});
  await db.agentSeat.deleteMany({});
  await db.investor.deleteMany({});
  await db.smsMessage.deleteMany({});
  await db.ledgerEntry.deleteMany({});
  await db.transaction.deleteMany({});
  await db.moneyWord.deleteMany({});
  await db.upsellOffer.deleteMany({});
  await db.riskProduct.deleteMany({});
  await db.campaign.deleteMany({});
  await db.affiliateOffer.deleteMany({});
  await db.autonomousLog.deleteMany({});
  await db.asset.deleteMany({});
  await db.lead.deleteMany({});
  await db.user.deleteMany({ where: { role: { not: "god" } } });

  // Ensure the new monetization/accounting settings exist.
  const newSettings: Record<string, string> = {
    defaultCallPriceCents: "7744",
    defaultForwardNumber: "9728006670",
    tollFreeCallerId: "+18006334427",
    showUnrealized: "true",
    callWhisper: "true",
  };
  for (const [key, value] of Object.entries(newSettings)) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  const counts = {
    users: await db.user.count(), leads: await db.lead.count(), calls: await db.call.count(),
    ledger: await db.ledgerEntry.count(), settings: await db.setting.count(), integrations: await db.integration.count(), sites: await db.site.count(),
  };
  console.log("✅ Cleaned to real-data-only:", JSON.stringify(counts));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
