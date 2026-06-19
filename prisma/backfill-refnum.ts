import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
(async () => {
  const leads = await db.lead.findMany({ where: { refNum: null }, orderBy: { createdAt: "asc" } });
  const maxRow = await db.lead.aggregate({ _max: { refNum: true } });
  let n = maxRow._max.refNum ?? 0;
  for (const l of leads) { n++; await db.lead.update({ where: { id: l.id }, data: { refNum: n } }); }
  await db.counter.upsert({ where: { name: "lead" }, update: { value: n }, create: { name: "lead", value: n } });
  console.log("backfilled leads; counter now at", n);
  await db.$disconnect();
})();
