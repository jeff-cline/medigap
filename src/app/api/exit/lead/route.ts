import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EXIT } from "@/lib/exit";

export const dynamic = "force-dynamic";

// Leads sit on top of the Core: attach to the exitoptimization.com Site so they flow into the CRM.
async function exitSite() {
  return db.site.upsert({
    where: { hostname: EXIT.siteHost },
    update: {},
    create: { hostname: EXIT.siteHost, name: "Exit Optimization", kind: "marketing", mode: "standalone", vertical: "exit", brandColor: EXIT.colors.orange, primaryCta: "form", heroHeadline: EXIT.tagline },
  });
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim();
  if (!name || !email) return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  const site = await exitSite();
  await db.lead.create({
    data: {
      name, email, phone: String(b.phone || "").trim(), vertical: "exit", source: "exitoptimization", siteId: site.id,
      tags: JSON.stringify(["exit", ...(b.company ? [`company:${String(b.company).slice(0, 60)}`] : []), ...(b.revenue ? [`revenue:${String(b.revenue).slice(0, 40)}`] : [])]),
    },
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}
