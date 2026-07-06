import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { EXIT } from "@/lib/exit";

export const dynamic = "force-dynamic";
const GOD = "jeff.cline@me.com";

export async function partnerSignupOn(): Promise<boolean> {
  const row = await db.integration.findUnique({ where: { key: "exit" } }).catch(() => null);
  try { return row ? JSON.parse(row.config).partnerSignup !== "off" : true; } catch { return true; }
}

export async function POST(req: NextRequest) {
  if (!(await partnerSignupOn())) return NextResponse.json({ error: "We're not accepting new partners right now — check back soon." }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase();
  const name = String(b.name || "").trim();
  const business = String(b.businessName || "").trim();
  const phone = String(b.phone || "").trim();
  const password = String(b.password || "");
  if (!email || !name || !business || password.length < 6) return NextResponse.json({ error: "Name, business, email, and a 6+ char password are required." }, { status: 400 });
  if (await db.user.findUnique({ where: { email } })) return NextResponse.json({ error: "An account with that email already exists — please log in." }, { status: 400 });

  const user = await db.user.create({ data: { email, name, phone, role: "adpartner", passwordHash: await hashPassword(password), mustChangePassword: false, status: "active", source: `exitoptimization partner · ${business}` } });
  const category = ["service", "advertiser", "adjacent"].includes(b.category) ? b.category : "advertiser";
  const partner = await db.calcPartner.create({ data: { name: business, category, contactEmail: email, ownerId: user.id } });
  const max = await db.calcAd.aggregate({ _max: { sortOrder: true } });
  if (b.adTitle && b.adUrl) {
    await db.calcAd.create({ data: { partnerId: partner.id, title: String(b.adTitle), description: String(b.adDescription || ""), imageUrl: String(b.adImageUrl || ""), ctaLabel: String(b.adCtaLabel || "Learn more"), ctaUrl: String(b.adUrl), category, sortOrder: (max._max.sortOrder || 0) + 1 } });
  }
  const site = await db.site.findUnique({ where: { hostname: EXIT.siteHost } }).catch(() => null);
  await db.lead.create({ data: { name, email, phone, vertical: "exit", source: "exitoptimization", siteId: site?.id, tags: JSON.stringify(["exit", "partner-signup", `business:${business.slice(0, 40)}`]) } }).catch(() => {});
  await sendEmail(GOD, "New Exit Optimization Partner", `New partner signup:<br>Name: ${name}<br>Business: ${business}<br>Email: ${email}<br>Phone: ${phone}<br>Category: ${category}`, "google_workspace", { text: `New partner signup: ${name} · ${business} · ${email} · ${phone} · ${category}` }).catch(() => {});
  await createSession({ uid: user.id, email: user.email, role: "adpartner", mustChangePassword: false });
  return NextResponse.json({ ok: true });
}
