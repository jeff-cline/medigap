import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { searchOffers, fetchTransactions } from "@/lib/rakuten";

export const maxDuration = 120;
function gate(s: Awaited<ReturnType<typeof getSession>>) { return !!s && (s.role === "god" || s.role === "marketing" || !!s.impersonatorUid); }
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!gate(s)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");
  try {
    if (action === "createPage") {
      const slug = slugify(b.slug || b.moneyWord || b.title || "");
      if (!slug) return NextResponse.json({ error: "Need a keyword/slug" }, { status: 400 });
      const page = await db.rakPage.upsert({
        where: { slug },
        update: { moneyWord: String(b.moneyWord || ""), title: String(b.title || slug), headline: String(b.headline || ""), intro: String(b.intro || ""), outro: String(b.outro || "") },
        create: { slug, moneyWord: String(b.moneyWord || ""), title: String(b.title || slug), headline: String(b.headline || ""), intro: String(b.intro || ""), outro: String(b.outro || "") },
      });
      return NextResponse.json({ ok: true, id: page.id, slug });
    }
    if (action === "updatePage") {
      const data: Record<string, unknown> = {};
      for (const k of ["moneyWord", "title", "headline", "intro", "outro", "offerIds"] as const) if (b[k] !== undefined) data[k] = String(b[k]);
      if (b.active !== undefined) data.active = !!b.active;
      await db.rakPage.update({ where: { id: String(b.id) }, data });
      return NextResponse.json({ ok: true });
    }
    if (action === "deletePage") { await db.rakPage.delete({ where: { id: String(b.id) } }); return NextResponse.json({ ok: true }); }
    if (action === "approveOffer") { await db.rakOffer.update({ where: { id: String(b.id) }, data: { approved: !!b.approved } }); return NextResponse.json({ ok: true }); }
    if (action === "deleteOffer") { await db.rakOffer.delete({ where: { id: String(b.id) } }); return NextResponse.json({ ok: true }); }

    if (action === "pullOffers") {
      const kw = String(b.keyword || "");
      const raw = await searchOffers(kw);
      let added = 0;
      for (const o of raw) {
        if (!o.deepLink && !o.title) continue;
        const existing = await db.rakOffer.findFirst({ where: { deepLink: o.deepLink, title: o.title } });
        if (existing) continue;
        await db.rakOffer.create({ data: { advertiserId: o.advertiserId, advertiser: o.advertiser, title: o.title, description: o.description, imageUrl: o.imageUrl, deepLink: o.deepLink, category: o.category, keywords: JSON.stringify(kw ? [kw] : []), payoutNote: o.payoutNote, approved: false } });
        added++;
      }
      return NextResponse.json({ ok: true, pulled: raw.length, added, note: raw.length ? "Review + approve below." : "No offers returned — check Rakuten SID + approved advertisers." });
    }

    if (action === "importTransactions") {
      const end = new Date(); const start = new Date(Date.now() - 30 * 86400000);
      const tx = await fetchTransactions(start.toISOString(), end.toISOString());
      let imported = 0;
      for (const t of tx) {
        // u1 format from our tracker: mg_<slug>_<offerId>_<clickfrag>
        const m = /^mg_(.+?)_([a-z0-9]+)(?:_[a-z0-9]+)?$/i.exec(t.u1 || "");
        const slug = m?.[1] || ""; const offerId = m?.[2] || "";
        try {
          await db.rakEvent.upsert({
            where: { orderId_offerId: { orderId: t.orderId, offerId } },
            update: { saleCents: t.saleCents, commissionCents: t.commissionCents, status: t.status, slug, subId: t.u1 },
            create: { orderId: t.orderId, offerId, slug, subId: t.u1, saleCents: t.saleCents, commissionCents: t.commissionCents, status: t.status, eventAt: t.eventAt ? new Date(t.eventAt) : new Date() },
          });
          imported++;
        } catch {}
      }
      return NextResponse.json({ ok: true, fetched: tx.length, imported });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e).slice(0, 300) }, { status: 200 });
  }
}
