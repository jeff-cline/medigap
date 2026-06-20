import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/sms";

// Import contacts from a PredictiveData export (paste CSV/lines): phone, email, name per row.
// Creates deduped leads tagged with the given source so they become a reachable segment.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !["god", "marketing", "accounting"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { text, source } = await req.json().catch(() => ({}));
  const src = String(source || "import").trim() || "import";
  const rows = String(text || "").split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
  let created = 0, skipped = 0;
  for (const row of rows) {
    const parts = row.split(/[,;\t]/).map((p) => p.trim());
    const phoneRaw = parts.find((p) => /\d{7,}/.test(p)) || "";
    const email = parts.find((p) => /@/.test(p)) || "";
    const name = parts.find((p) => p && !/\d{7,}/.test(p) && !/@/.test(p)) || "";
    const phone = normalizePhone(phoneRaw) || "";
    if (!phone && !email) { skipped++; continue; }
    const last10 = phone.replace(/\D/g, "").slice(-10);
    const exists = await db.lead.findFirst({ where: { OR: [...(last10 ? [{ phone: { contains: last10 } }] : []), ...(email ? [{ email }] : [])] } });
    if (exists) { skipped++; continue; }
    await db.lead.create({ data: { phone, email, name: name || "Imported", source: src, vertical: "medicare" } });
    created++;
  }
  return NextResponse.json({ ok: true, created, skipped, source: src });
}
