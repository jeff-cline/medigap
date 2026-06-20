import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Theme variants for A/B testing — a site's look is chosen deterministically from
// its hostname length so every new site renders differently out of the box.
const VARIANTS = [
  { variant: "aurora", accent: "#22d3ee", layout: "hero-split" },
  { variant: "ember", accent: "#f59e0b", layout: "hero-center" },
  { variant: "forest", accent: "#34d399", layout: "hero-left" },
  { variant: "royal", accent: "#a78bfa", layout: "hero-stacked" },
  { variant: "rose", accent: "#fb7185", layout: "hero-card" },
];

function isGodOrStaff(role?: string) {
  return role === "god" || role === "marketing" || role === "accounting";
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  const isGod = s?.role === "god" || !!s?.impersonatorUid;
  if (!s) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  // Branding editor — the God account OR the site's own partner can update
  // logo, colors, hero headline and custom footer links.
  if (body.action === "branding" && body.id) {
    const site = await db.site.findUnique({ where: { id: String(body.id) } });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });
    const owns = site.ownerId && site.ownerId === s.uid;
    if (!isGod && !isGodOrStaff(s.role) && !owns) {
      return NextResponse.json({ error: "Not your site." }, { status: 403 });
    }
    let footerLinks = site.footerLinks;
    if (Array.isArray(body.footerLinks)) {
      const clean = body.footerLinks
        .map((l: { label?: string; href?: string }) => ({ label: String(l?.label || "").trim().slice(0, 60), href: String(l?.href || "").trim().slice(0, 300) }))
        .filter((l: { label: string; href: string }) => l.label && l.href)
        .slice(0, 20);
      footerLinks = JSON.stringify(clean);
    }
    await db.site.update({
      where: { id: site.id },
      data: {
        logoUrl: typeof body.logoUrl === "string" ? body.logoUrl.trim() : site.logoUrl,
        brandColor: typeof body.brandColor === "string" ? body.brandColor.trim() : site.brandColor,
        heroHeadline: typeof body.heroHeadline === "string" ? body.heroHeadline.trim().slice(0, 140) : site.heroHeadline,
        footerLinks,
      },
    });
    return NextResponse.json({ ok: true });
  }

  // Everything below is God / staff only.
  if (!isGod && !isGodOrStaff(s.role)) {
    return NextResponse.json({ error: "God / staff only" }, { status: 403 });
  }

  // Toggle active flag. Accepts {id, toggle:true} or {id, action:"toggle"}.
  if ((body.toggle || body.action === "toggle") && body.id) {
    const site = await db.site.findUnique({ where: { id: String(body.id) } });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });
    await db.site.update({ where: { id: site.id }, data: { active: !site.active } });
    return NextResponse.json({ ok: true });
  }

  const hostname = String(body.hostname || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  const vertical = String(body.vertical || "medicare").trim();
  const goal = String(body.goal || "").trim();
  const kind = body.kind === "management" ? "management" : "marketing";

  if (!hostname) return NextResponse.json({ error: "Hostname is required." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Site name is required." }, { status: 400 });

  const theme = JSON.stringify(VARIANTS[hostname.length % VARIANTS.length]);

  // Advanced / standalone fields (optional).
  const mode = body.mode === "standalone" ? "standalone" : "network";
  const territoryZips = Array.isArray(body.territoryZips)
    ? JSON.stringify(body.territoryZips.map((z: string) => String(z).replace(/\D/g, "").slice(0, 5)).filter(Boolean))
    : JSON.stringify(String(body.territoryZips || "").split(/[\s,]+/).map((z) => z.replace(/\D/g, "").slice(0, 5)).filter(Boolean));

  try {
    const site = await db.site.create({
      data: {
        hostname, name, vertical, goal, kind, theme, active: true,
        mode,
        ownerId: body.ownerId ? String(body.ownerId) : null,
        territoryZips,
        affiliateRevSharePct: Math.max(0, Math.min(100, Math.round(Number(body.affiliateRevSharePct) || 0))),
        audience: String(body.audience || "").trim(),
        primaryCta: body.primaryCta === "form" ? "form" : "call",
        brandColor: String(body.brandColor || "").trim(),
        moneyWords: String(body.moneyWords || "").trim(),
      },
    });
    return NextResponse.json({ ok: true, id: site.id });
  } catch {
    // Most likely the unique hostname constraint.
    return NextResponse.json(
      { error: `A site already uses "${hostname}". Pick a different hostname.` },
      { status: 409 }
    );
  }
}
