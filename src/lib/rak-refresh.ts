import { db } from "@/lib/db";
import { rakCfg, searchOffers } from "@/lib/rakuten";
import { TAXONOMY } from "@/lib/rak-taxonomy";

export type RefreshResult = { ok: boolean; keywords: number; pulled: number; added: number; updated: number; expired: number; error?: string; autoApprove: boolean };

/**
 * Real-time keyword refresh: for every live keyword (taxonomy categories + active money-word
 * landers) pull the current Rakuten offers, upsert them (fresh = refreshedAt now), auto-approve
 * if configured, and expire auto-pulled offers that have gone stale — so each keyword page always
 * shows the best current offers and monetization stays maximized.
 */
export async function refreshRakOffers(): Promise<RefreshResult> {
  const cfg = await rakCfg();
  const autoApprove = cfg.autoApprove !== "false"; // default ON — maximize opportunity
  if (!cfg.clientId || !cfg.clientSecret) return { ok: false, keywords: 0, pulled: 0, added: 0, updated: 0, expired: 0, autoApprove, error: "Rakuten keys not set." };

  // Build the keyword universe: every category + every active money-word lander.
  const keywords = new Set<string>();
  for (const c of TAXONOMY) keywords.add(c.name);
  const pages = await db.rakPage.findMany({ where: { active: true }, select: { moneyWord: true, slug: true } });
  for (const p of pages) keywords.add((p.moneyWord || p.slug.replace(/-/g, " ")).trim());

  const now = new Date();
  let pulled = 0, added = 0, updated = 0;
  for (const kw of keywords) {
    if (!kw) continue;
    const offers = await searchOffers(kw);
    pulled += offers.length;
    for (const o of offers) {
      if (!o.title && !o.deepLink) continue;
      const existing = await db.rakOffer.findFirst({ where: { deepLink: o.deepLink, title: o.title } });
      if (existing) {
        await db.rakOffer.update({ where: { id: existing.id }, data: { refreshedAt: now, active: true, description: o.description || existing.description, imageUrl: o.imageUrl || existing.imageUrl, advertiser: o.advertiser || existing.advertiser } });
        updated++;
      } else {
        await db.rakOffer.create({ data: { advertiserId: o.advertiserId, advertiser: o.advertiser, title: o.title, description: o.description, imageUrl: o.imageUrl, deepLink: o.deepLink, category: o.category, keywords: JSON.stringify([kw]), payoutNote: o.payoutNote, approved: autoApprove, active: true, refreshedAt: now } });
        added++;
      }
    }
  }

  // Expire auto-pulled offers not seen in ~10 days (stale promo) — never touch manually-added ones.
  const cutoff = new Date(now.getTime() - 10 * 86400000);
  const expired = await db.rakOffer.updateMany({ where: { refreshedAt: { lt: cutoff, not: null }, active: true }, data: { active: false } });

  await db.integration.update({ where: { key: "rakuten" }, data: { status: `refreshed ${now.toISOString().slice(0, 16)} · +${added}/${updated}` } }).catch(() => {});
  return { ok: true, keywords: keywords.size, pulled, added, updated, expired: expired.count, autoApprove };
}
