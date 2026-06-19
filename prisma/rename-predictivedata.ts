import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
(async () => {
  const old = await db.integration.findUnique({ where: { key: "datamoon" } });
  if (old) {
    await db.integration.upsert({
      where: { key: "predictivedata" },
      update: { label: "PredictiveData — data append", config: old.config, connected: old.connected, status: old.status },
      create: { key: "predictivedata", label: "PredictiveData — data append", config: old.config, connected: old.connected, status: old.status },
    });
    await db.integration.delete({ where: { key: "datamoon" } });
    console.log("migrated datamoon → predictivedata (config preserved)");
  } else {
    await db.integration.upsert({ where: { key: "predictivedata" }, update: {}, create: { key: "predictivedata", label: "PredictiveData — data append" } });
    console.log("no datamoon row; ensured predictivedata exists");
  }
  await db.$disconnect();
})();
