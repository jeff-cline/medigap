import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/sms";

// Import past phone numbers (paste, one per line or comma-separated) as house leads so they
// appear in the CRM and can be texted/called. Dedupes against existing phones.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !["god", "marketing", "accounting"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { numbers, vertical, source } = await req.json().catch(() => ({}));
  const raw = String(numbers || "").split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
  const normalized = Array.from(new Set(raw.map((n) => normalizePhone(n)).filter(Boolean) as string[]));
  if (!normalized.length) return NextResponse.json({ ok: false, error: "No valid phone numbers found" }, { status: 200 });

  const last10s = normalized.map((p) => p.replace(/\D/g, "").slice(-10));
  const existing = await db.lead.findMany({ where: { OR: last10s.map((d) => ({ phone: { contains: d } })) }, select: { phone: true } });
  const existingSet = new Set(existing.map((e) => e.phone.replace(/\D/g, "").slice(-10)));

  let created = 0, skipped = 0;
  for (const phone of normalized) {
    const d10 = phone.replace(/\D/g, "").slice(-10);
    if (existingSet.has(d10)) { skipped++; continue; }
    existingSet.add(d10);
    await db.lead.create({ data: { phone, name: "Imported lead", source: String(source || "house"), vertical: String(vertical || "medicare"), status: "new" } });
    created++;
  }
  return NextResponse.json({ ok: true, found: normalized.length, created, skipped });
}
