import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// FOREVER RULE: jeff.cline@me.com always has a God account on the Core (and anything
// connected to it). Runs on every deploy. Never overwrites an existing password — only
// guarantees the account exists and is role=god/active. Jeff can change his password anytime.
const FOUNDER_EMAIL = "jeff.cline@me.com";
const TEMP = "TEMP!234";

export async function ensureFounderGod(db = new PrismaClient()) {
  const existing = await db.user.findUnique({ where: { email: FOUNDER_EMAIL } });
  if (existing) {
    if (existing.role !== "god" || existing.status !== "active") {
      await db.user.update({ where: { id: existing.id }, data: { role: "god", status: "active" } });
      return "promoted to god";
    }
    return "already god";
  }
  await db.user.create({ data: { email: FOUNDER_EMAIL, name: "Jeff Cline", role: "god", status: "active", mustChangePassword: true, passwordHash: await bcrypt.hash(TEMP, 10), source: "founder god invariant" } });
  return "created god (temp TEMP!234)";
}

if (require.main === module) {
  const db = new PrismaClient();
  ensureFounderGod(db).then((r) => { console.log("ensure-god:", r); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
}
