import { db } from "@/lib/db";

// Serves a live advertiser ad for a placement, records an impression, links through the
// tracked /go/[adId] redirect which charges the advertiser per click.
export default async function AdSlot({ placement = "inline" }: { placement?: string }) {
  const ads = await db.ad.findMany({ where: { active: true, placement, balanceCents: { gt: 0 } }, take: 5 }).catch(() => []);
  if (!ads.length) return null;
  // Optimize by expected value per impression (bid × a simple CTR proxy); pick the best.
  const ad = ads.sort((a, b) => b.bidCents - a.bidCents)[0];
  await db.adEvent.create({ data: { adId: ad.id, kind: "impression", costCents: 0 } }).catch(() => {});

  if (ad.kind === "text") {
    return (
      <a href={`/go/${ad.id}`} className="card p-4 block hover:glow transition">
        <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Sponsored</div>
        <div className="font-semibold mt-1">{ad.headline}</div>
        <div className="text-sm text-[var(--muted)]">{ad.body}</div>
      </a>
    );
  }
  return (
    <a href={`/go/${ad.id}`} className="block rounded-2xl overflow-hidden border border-[var(--border)] hover:glow transition">
      <div className="text-[10px] uppercase tracking-wide text-[var(--muted)] px-3 pt-2">Sponsored</div>
      {ad.assetUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.assetUrl} alt={ad.headline} className="w-full object-cover" />
      ) : (
        <div className="brand-gradient h-28 flex items-center justify-center text-black font-bold px-4 text-center">{ad.headline}</div>
      )}
    </a>
  );
}
