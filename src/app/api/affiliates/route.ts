import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { quinstreetPing, quinstreetPost, isQsVertical, STAGE, type QsLead, type QsVertical } from "@/lib/quinstreet";

// God-only management of affiliate-network partners (QuinStreet et al).
function gate(s: Awaited<ReturnType<typeof getSession>>) {
  return !!s && (s.role === "god" || !!s.impersonatorUid);
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!gate(s)) return NextResponse.json({ error: "God only" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");

  // One-click master on/off for a whole partner.
  if (action === "toggleAffiliate") {
    const id = String(b.id || "");
    const aff = await db.affiliate.findUnique({ where: { id } });
    if (!aff) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.affiliate.update({ where: { id }, data: { active: !aff.active } });
    return NextResponse.json({ ok: true, active: !aff.active });
  }

  // One-click on/off for a single vertical.
  if (action === "toggleVertical") {
    const id = String(b.id || "");
    const v = await db.affiliateVertical.findUnique({ where: { id } });
    if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.affiliateVertical.update({ where: { id }, data: { active: !v.active } });
    return NextResponse.json({ ok: true, active: !v.active });
  }

  // Edit a vertical's bid (placeholder until the live ping API; lets you test the router).
  if (action === "setBid") {
    const id = String(b.id || "");
    const cents = Math.max(0, Math.round(Number(b.cents) || 0));
    await db.affiliateVertical.update({ where: { id }, data: { bidCents: cents } }).catch(() => {});
    return NextResponse.json({ ok: true, bidCents: cents });
  }

  // GO-LIVE: save the partner's live API creds (base URL, key, secret).
  if (action === "setCreds") {
    const id = String(b.id || "");
    const data: Record<string, string> = {};
    if (typeof b.baseUrl === "string") data.baseUrl = b.baseUrl.trim();
    if (typeof b.apiKey === "string") data.apiKey = b.apiKey.trim();
    if (typeof b.apiSecret === "string") data.apiSecret = b.apiSecret.trim();
    await db.affiliate.update({ where: { id }, data }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  // GO-LIVE: save per-vertical live endpoints + tracking number.
  if (action === "setEndpoints") {
    const id = String(b.id || "");
    const data: Record<string, string> = {};
    if (typeof b.pingUrl === "string") data.pingUrl = b.pingUrl.trim();
    if (typeof b.postUrl === "string") data.postUrl = b.postUrl.trim();
    if (typeof b.quadTag === "string") data.quadTag = b.quadTag.trim();
    if (typeof b.trackingNumber === "string") data.trackingNumber = b.trackingNumber.trim();
    await db.affiliateVertical.update({ where: { id }, data }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  // RECONCILIATION: attach what THEIR system reports they'll pay for a ping, and mark reconciled.
  if (action === "reconcile") {
    const id = String(b.id || "");
    const reportedCents = Math.max(0, Math.round(Number(b.reportedCents) || 0));
    const reconciled = b.reconciled !== false;
    await db.affiliatePing.update({
      where: { id },
      data: { reportedCents, reconciled, reconciledAt: reconciled ? new Date() : null, externalId: typeof b.externalId === "string" ? b.externalId.trim() : undefined },
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  // DEMO: simulate a ping through the tree so you can SEE the reconciliation flow before go-live.
  if (action === "simulatePing") {
    const affiliateId = String(b.affiliateId || "");
    const vid = String(b.verticalId || "");
    const v = await db.affiliateVertical.findUnique({ where: { id: vid } });
    if (!v) return NextResponse.json({ error: "Pick a vertical" }, { status: 400 });
    // model the tree: they "offer" their current bid; we "sell" it at that price.
    const sold = Math.random() > 0.25; // ~75% accepted, like a real tree
    await db.affiliatePing.create({
      data: {
        affiliateId, verticalId: vid, vertical: v.vertical,
        status: sold ? "sold" : "rejected",
        offerCents: v.bidCents, qualifySec: 60, matchedClient: "Simulated buyer",
        soldCents: sold ? v.bidCents : 0,
        trackingNumber: v.trackingNumber,
        isTest: true,
        note: "Simulated ping (test) — clear anytime.",
        postedAt: new Date(),
      },
    });
    // NOTE: do NOT touch the vertical counters here — test pings must never inflate real totals.
    // All displayed numbers derive from the ping ledger (isTest split), so the test row is enough.
    return NextResponse.json({ ok: true, sold });
  }

  // Master mode: off | observe (ping+log only) | live (ping+post+reroute).
  if (action === "setMode") {
    const id = String(b.id || "");
    const mode = ["off", "observe", "live"].includes(String(b.mode)) ? String(b.mode) : "off";
    await db.affiliate.update({ where: { id }, data: { mode, liveRouting: mode === "live" } }).catch(() => {});
    return NextResponse.json({ ok: true, mode });
  }

  // Save a vertical's PRODUCTION quadTag and AUTO-GO-LIVE: the moment every active wired vertical
  // has a prod (non-stage) quadTag, flip the partner to Live and turn it on. This is the one
  // credential QuinStreet provides — there's no separate API key.
  if (action === "saveQuadTag") {
    const vid = String(b.verticalId || "");
    const quadTag = String(b.quadTag || "").trim();
    const v = await db.affiliateVertical.findUnique({ where: { id: vid } });
    if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.affiliateVertical.update({ where: { id: vid }, data: { quadTag } });

    const aff = await db.affiliate.findUnique({ where: { id: v.affiliateId }, include: { verticals: true } });
    if (!aff) return NextResponse.json({ ok: true });
    const wired = aff.verticals.filter((x) => isQsVertical(x.vertical) && x.active && !!x.pingUrl);
    const isProd = (x: { vertical: string; quadTag: string }) => !!x.quadTag && x.quadTag !== STAGE[x.vertical as QsVertical].testQuadTag;
    const allProd = wired.length > 0 && wired.every(isProd);

    let mode = aff.mode;
    if (allProd && aff.mode !== "live") { mode = "live"; await db.affiliate.update({ where: { id: aff.id }, data: { mode: "live", liveRouting: true, active: true } }); }
    return NextResponse.json({ ok: true, mode, allProd, autoLive: allProd && aff.mode !== "live", verticals: wired.map((x) => ({ id: x.id, vertical: x.vertical, isProd: isProd(x) })) });
  }

  // Set the partner's default vertical (pinged when no money word resolves one).
  if (action === "setDefaultVertical") {
    const id = String(b.id || "");
    const vertical = String(b.vertical || "");
    await db.affiliate.update({ where: { id }, data: { defaultVertical: vertical } }).catch(() => {});
    return NextResponse.json({ ok: true, vertical });
  }

  // Map a Money Word to a QuinStreet vertical (or clear it). This is how a spoken word picks the vertical.
  if (action === "mapMoneyWord") {
    const id = String(b.moneyWordId || "");
    const vertical = String(b.vertical || "");
    await db.moneyWord.update({ where: { id }, data: { affiliateVertical: vertical } }).catch(() => {});
    return NextResponse.json({ ok: true, vertical });
  }

  // Create a NEW money word already tagged to a vertical (so you can wire home/auto/life words here).
  if (action === "addMoneyWord") {
    const word = String(b.word || "").trim().toLowerCase();
    const vertical = String(b.vertical || "");
    if (!word) return NextResponse.json({ error: "Enter a word/phrase" }, { status: 400 });
    const mw = await db.moneyWord.upsert({
      where: { word },
      update: { affiliateVertical: vertical, active: true },
      create: { word, affiliateVertical: vertical, active: true },
    });
    return NextResponse.json({ ok: true, id: mw.id, word: mw.word });
  }

  // LIVE TEST: fire a real ping (and post if it monetizes) at QuinStreet for this vertical, using
  // the stored prod endpoint/quadTag if present else the stage defaults. Logs a TEST ping so the
  // result shows up in reconciliation. This is how we verify each vertical is wired correctly.
  if (action === "pingTest") {
    const vid = String(b.verticalId || "");
    const v = await db.affiliateVertical.findUnique({ where: { id: vid }, include: { affiliate: true } });
    if (!v) return NextResponse.json({ error: "Pick a vertical" }, { status: 400 });
    if (!isQsVertical(v.vertical)) return NextResponse.json({ error: `No QuinStreet endpoint for ${v.vertical}` }, { status: 400 });

    const lead: QsLead = {
      firstName: "John", lastName: "Sample", email: "john.sample@example.com",
      phone: "4045551234", address: "123 Peachtree St", city: "Atlanta",
      zip: "30301", state: "GA", birthDate: "1955-05-12", gender: "Male", aff: "medigapplus-test",
    };
    const ping = await quinstreetPing({ vertical: v.vertical, lead, pingUrl: v.pingUrl || undefined, quadTag: v.quadTag || undefined });
    let post: Awaited<ReturnType<typeof quinstreetPost>> | null = null;
    if (ping.ok && ping.pingId) {
      post = await quinstreetPost({ vertical: v.vertical, lead, pingId: ping.pingId, postUrl: v.postUrl || undefined, quadTag: v.quadTag || undefined });
    }
    await db.affiliatePing.create({
      data: {
        affiliateId: v.affiliateId, verticalId: v.id, vertical: v.vertical,
        status: ping.ok ? (post?.ok ? "sold" : "posted") : (ping.status.toUpperCase() === "SUCCESS" ? "no_bid" : "rejected"),
        offerCents: ping.bidCents, qualifySec: ping.qualifySec ?? 0, matchedClient: ping.matchedClient ?? "",
        soldCents: post?.ok ? ping.bidCents : 0,
        externalId: ping.pingId || "", isTest: true,
        note: `STAGE test · ${ping.message}${ping.qualifySec ? ` · qualify ${ping.qualifySec}s` : ""}${ping.matchedClient ? ` · ${ping.matchedClient}` : ""}`,
        postedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, ping, post });
  }

  // DEMO: clear all simulated/test pings.
  if (action === "clearTestPings") {
    await db.affiliatePing.deleteMany({ where: { isTest: true } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
