import { db } from "@/lib/db";

const GRAPH = "https://graph.facebook.com/v19.0";

async function getJson(url: string) {
  try { return await fetch(url).then((r) => r.json()); } catch { return null; }
}

export type FbPage = { id: string; name: string; access_token?: string; followers?: number };

/** Read the Doublewide app config (App ID/Secret + Business ID) from the fb_social integration. */
export async function fbConfig() {
  const row = await db.integration.findUnique({ where: { key: "fb_social" } });
  let c: Record<string, string> = {};
  try { c = row ? JSON.parse(row.config) : {}; } catch {}
  return { appId: c.appId || "", appSecret: c.appSecret || "", businessId: c.businessId || "" };
}

/**
 * Pull current metrics for every page reachable from a connected user's token, capturing a
 * time-series snapshot. Uses the Business portfolio's owned_pages when a Business ID is set
 * (so it sees the whole portfolio), else falls back to the pages stored on the connection.
 */
export async function pullFacebook(userId: string): Promise<{ ok: boolean; captured: number; error?: string }> {
  const conn = await db.socialConnection.findUnique({ where: { userId_platform: { userId, platform: "facebook" } } });
  if (!conn || !conn.accessToken) return { ok: false, captured: 0, error: "Not connected" };
  const { businessId } = await fbConfig();

  // Gather pages: prefer the Business portfolio (whole org), else the connection's stored pages.
  let pages: FbPage[] = [];
  if (businessId) {
    const owned = await getJson(`${GRAPH}/${businessId}/owned_pages?fields=id,name,access_token,followers_count&limit=200&access_token=${conn.accessToken}`);
    if (Array.isArray(owned?.data)) pages = owned.data.map((p: Record<string, unknown>) => ({ id: String(p.id), name: String(p.name || ""), access_token: p.access_token as string, followers: Number(p.followers_count || 0) }));
  }
  if (pages.length === 0) {
    try { pages = JSON.parse(conn.pages || "[]"); } catch { pages = []; }
  }
  if (pages.length === 0) return { ok: false, captured: 0, error: "No pages found on this connection" };

  let captured = 0;
  for (const pg of pages) {
    const token = pg.access_token || conn.accessToken;
    // followers
    const meta = await getJson(`${GRAPH}/${pg.id}?fields=name,followers_count,fan_count&access_token=${token}`);
    const followers = Number(meta?.followers_count ?? meta?.fan_count ?? pg.followers ?? 0);
    // insights (last day): impressions, reach, engaged users
    const ins = await getJson(`${GRAPH}/${pg.id}/insights?metric=page_impressions,page_impressions_unique,page_post_engagements&period=day&access_token=${token}`);
    const val = (name: string) => {
      const m = Array.isArray(ins?.data) ? ins.data.find((d: Record<string, unknown>) => d.name === name) : null;
      const arr = (m?.values as { value: number }[]) || [];
      return arr.length ? Number(arr[arr.length - 1]?.value || 0) : 0;
    };
    await db.socialSnapshot.create({
      data: {
        userId, platform: "facebook", pageId: pg.id, pageName: meta?.name || pg.name || "",
        followers, impressions: val("page_impressions"), reach: val("page_impressions_unique"), engagement: val("page_post_engagements"),
      },
    });
    captured++;
  }
  return { ok: true, captured };
}

export type PageReport = {
  pageId: string; pageName: string;
  followers: number; impressions: number; reach: number; engagement: number;
  dFollowers: number; dImpressions: number; dEngagement: number; // change vs the prior snapshot
  capturedAt: Date | null;
};

/** Build the current report: latest snapshot per page + change vs the previous snapshot. */
export async function socialReport(): Promise<{ pages: PageReport[]; totals: { followers: number; impressions: number; engagement: number; pages: number }; lastCaptured: Date | null }> {
  const snaps = await db.socialSnapshot.findMany({ orderBy: { capturedAt: "desc" }, take: 2000 });
  const byPage = new Map<string, typeof snaps>();
  for (const s of snaps) { const a = byPage.get(s.pageId) || []; a.push(s); byPage.set(s.pageId, a); }

  const pages: PageReport[] = [];
  for (const [pageId, list] of byPage) {
    const cur = list[0]; const prev = list[1];
    pages.push({
      pageId, pageName: cur.pageName,
      followers: cur.followers, impressions: cur.impressions, reach: cur.reach, engagement: cur.engagement,
      dFollowers: prev ? cur.followers - prev.followers : 0,
      dImpressions: prev ? cur.impressions - prev.impressions : 0,
      dEngagement: prev ? cur.engagement - prev.engagement : 0,
      capturedAt: cur.capturedAt,
    });
  }
  pages.sort((a, b) => b.followers - a.followers);
  const totals = pages.reduce((t, p) => ({ followers: t.followers + p.followers, impressions: t.impressions + p.impressions, engagement: t.engagement + p.engagement, pages: t.pages + 1 }), { followers: 0, impressions: 0, engagement: 0, pages: 0 });
  return { pages, totals, lastCaptured: snaps[0]?.capturedAt ?? null };
}
