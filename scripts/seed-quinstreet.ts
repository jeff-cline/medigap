// Seed QuinStreet as our affiliate-network partner with the verticals from their publisher guides.
// Idempotent: safe to run every deploy. Wires the STAGE ping/post endpoints + TEST quad tags so the
// "Test live ping" button works out of the box — without ever clobbering a prod value you enter.
import { db } from "../src/lib/db";
import { VERTICALS } from "../src/lib/affiliate";
import { STAGE, isQsVertical } from "../src/lib/quinstreet";

export async function seedQuinstreet() {
  const aff = await db.affiliate.upsert({
    where: { slug: "quinstreet" },
    update: {},
    create: { name: "QuinStreet", slug: "quinstreet", active: true, config: "{}" },
  });
  // Default to the medicare vertical for unworded inbound (medigap line) — only if unset.
  if (!aff.defaultVertical) await db.affiliate.update({ where: { id: aff.id }, data: { defaultVertical: "medicare" } });

  for (const v of VERTICALS) {
    const row = await db.affiliateVertical.upsert({
      where: { affiliateId_vertical: { affiliateId: aff.id, vertical: v.key } },
      update: {},
      create: { affiliateId: aff.id, vertical: v.key, label: v.label, active: true, bidCents: 0 },
    });
    // Wire stage endpoints + test quadTag for the 4 QuinStreet verticals, only if not already set
    // (so a manually-entered prod endpoint/quadTag is preserved across deploys).
    if (isQsVertical(v.key)) {
      const s = STAGE[v.key];
      const patch: Record<string, string> = {};
      if (!row.pingUrl) patch.pingUrl = s.pingUrl;
      if (!row.postUrl) patch.postUrl = s.postUrl;
      if (!row.quadTag) patch.quadTag = s.testQuadTag;
      if (Object.keys(patch).length) await db.affiliateVertical.update({ where: { id: row.id }, data: patch });
    }
  }
  return aff.id;
}

if (require.main === module) {
  seedQuinstreet()
    .then((id) => { console.log("quinstreet seeded:", id); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
}
