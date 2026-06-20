import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createImageTask } from "@/lib/runway";

const VARIANTS = [{ variant: "aurora", accent: "#22d3ee" }, { variant: "ember", accent: "#f59e0b" }, { variant: "forest", accent: "#34d399" }, { variant: "royal", accent: "#a78bfa" }];

// Coupon discount for upgrades (reuses the coupon table; discounts the price rather than crediting balance).
async function couponDiscount(code: string, priceCents: number) {
  if (!code) return { discount: 0, label: "" };
  const c = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!c || !c.active) return { discount: 0, label: "", error: "Invalid coupon" };
  if (c.expiresAt && c.expiresAt < new Date()) return { discount: 0, label: "", error: "Coupon expired" };
  let discount = c.kind === "credit" ? c.amountCents : Math.min(Math.round((priceCents * c.percent) / 100), c.amountCents || Infinity);
  discount = Math.min(discount, priceCents);
  await db.coupon.update({ where: { id: c.id }, data: { redemptions: { increment: 1 } } }).catch(() => {});
  return { discount, label: c.code };
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== "god") return NextResponse.json({ error: "God only" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");
  const id = String(b.id || "");
  const app = id ? await db.partnerApplication.findUnique({ where: { id } }) : null;

  if (action === "revshare") {
    await db.partnerApplication.update({ where: { id }, data: { revSharePct: Math.max(0, Math.min(100, Math.round(Number(b.pct) || 0))) } });
    return NextResponse.json({ ok: true });
  }
  if (action === "reject") { await db.partnerApplication.update({ where: { id }, data: { status: "rejected" } }); return NextResponse.json({ ok: true }); }

  if (action === "generate") {
    if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    // 1) Owner account (partner portal + CRM).
    const email = (app.email || `${app.businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}@partner.medigap.plus`).toLowerCase();
    let owner = await db.user.findUnique({ where: { email } });
    if (!owner) owner = await db.user.create({ data: { email, name: app.contactName || app.businessName, role: "agent", passwordHash: await bcrypt.hash("TEMP!234", 10), mustChangePassword: true, status: "active", source: `Partner: ${app.businessName}` } });
    // 2) Standalone site from the intake.
    const hostname = (app.hostname || `${app.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.medigap.plus`).toLowerCase();
    const territory = JSON.stringify((app.territoryZips || "").split(/[\s,]+/).map((z) => z.replace(/\D/g, "").slice(0, 5)).filter(Boolean));
    const brand = (app.brandColors || "").split(/[\s,]+/)[0] || "";
    const goal = `Lead-gen funnel for ${app.businessName}. Audience: ${app.audience}. USP: ${app.usp}. Emphasize: ${app.moneyWords}. Geography: ${app.geography}.`.slice(0, 900);
    let site;
    try {
      site = await db.site.create({ data: { hostname, name: app.businessName, vertical: app.vertical, kind: "marketing", theme: JSON.stringify(VARIANTS[hostname.length % VARIANTS.length]), active: true, mode: "standalone", ownerId: owner.id, territoryZips: territory, affiliateRevSharePct: app.revSharePct, audience: app.audience, primaryCta: app.primaryCta, brandColor: brand, moneyWords: app.moneyWords, goal } });
    } catch { return NextResponse.json({ error: `Hostname "${hostname}" already exists — set a unique domain on the application first.` }, { status: 409 }); }
    await db.partnerApplication.update({ where: { id }, data: { status: "generated", ownerId: owner.id, siteId: site.id } });
    return NextResponse.json({ ok: true, hostname, ownerEmail: email, siteId: site.id });
  }

  if (action === "upgrade") {
    if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    const kind = b.kind === "mediakit" ? "mediakit" : "video";
    const price = 150000;
    const cp = await couponDiscount(String(b.couponCode || ""), price);
    const paid = Math.max(0, price - cp.discount);
    // Kick off a first RunwayML asset (best-effort; video/series runs async).
    const prompt = `High-quality ${kind === "video" ? "social media video ad" : "brand graphic"} for ${app.businessName}, a senior ${app.vertical} insurance service. Audience: ${app.audience}. Style: trustworthy, premium, ${app.brandColors || "teal and blue"}. Vertical 9:16 for Instagram/Facebook.`;
    const r = await createImageTask(prompt);
    const taskId = (r.data as { id?: string })?.id || "";
    const up = await db.upgrade.create({ data: { applicationId: id, siteId: app.siteId, kind, amountCents: price, paidCents: paid, couponCode: cp.label, status: r.ok ? "generating" : "ordered", note: r.ok ? `Runway task ${taskId}` : (r.error || "queued — connect RunwayML") } });
    return NextResponse.json({ ok: true, id: up.id, paidCents: paid, discountCents: cp.discount, status: up.status, runway: r.ok });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
