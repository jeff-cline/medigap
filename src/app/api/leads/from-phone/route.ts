import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { normalizePhone } from "@/lib/sms";
import { appendLeadBackground } from "@/lib/predictivedata";

// Create (or find) a lead from a bare phone number and kick off enrichment, then return its id.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !["god", "marketing", "accounting", "moneywords"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { phone } = await req.json().catch(() => ({}));
  const e164 = normalizePhone(String(phone || "")) || String(phone || "");
  const last10 = e164.replace(/\D/g, "").slice(-10);
  if (!last10) return NextResponse.json({ error: "Invalid phone" }, { status: 400 });

  let lead = await db.lead.findFirst({ where: { phone: { contains: last10 } } });
  if (!lead) {
    lead = await db.lead.create({ data: { phone: e164, name: "Unknown caller", source: "house", vertical: "medicare" } });
    appendLeadBackground(lead.id); // enrich via PredictiveData
  }
  return NextResponse.json({ ok: true, id: lead.id });
}
