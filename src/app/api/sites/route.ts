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
  if (!s || (!isGod && !isGodOrStaff(s.role))) {
    return NextResponse.json({ error: "God / staff only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

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

  try {
    const site = await db.site.create({
      data: { hostname, name, vertical, goal, kind, theme, active: true },
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
