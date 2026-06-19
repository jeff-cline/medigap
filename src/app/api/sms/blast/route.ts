import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendSms, getTwilioCfg } from "@/lib/sms";
import { Prisma } from "@prisma/client";

const MAX_PER_REQUEST = 250; // safety cap per call
const SMS_COST_CENTS = 1; // ~$0.0079/segment; tracked as spend for accounting

// Bulk SMS to a lead audience, with a testLimit safety. God/staff only.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !["god", "marketing", "accounting"].includes(s.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { body, status, vertical, source, leadIds, testLimit, batch } = await req.json().catch(() => ({}));
  if (!body) return NextResponse.json({ error: "body required" }, { status: 400 });

  const where: Prisma.LeadWhereInput = { smsOptOut: false, phone: { not: "" } };
  if (status) where.status = String(status);
  if (vertical) where.vertical = String(vertical);
  if (source) where.source = String(source);
  if (Array.isArray(leadIds) && leadIds.length) where.id = { in: leadIds.map(String) };

  let leads = await db.lead.findMany({ where, select: { id: true, phone: true }, take: MAX_PER_REQUEST });
  const limit = Number(testLimit) > 0 ? Math.min(Number(testLimit), leads.length) : leads.length;
  leads = leads.slice(0, limit);

  const cfg = await getTwilioCfg(); // fetch once for the whole batch
  const label = String(batch || "blast") + " " + new Date().toISOString().slice(0, 16);
  let sent = 0, failed = 0;
  for (const lead of leads) {
    const r = await sendSms({ to: lead.phone, body: String(body), leadId: lead.id, batch: label, cfg });
    r.ok ? sent++ : failed++;
  }
  if (sent > 0) {
    await db.ledgerEntry.create({ data: { type: "spend", category: "sms", channel: "twilio", amountCents: sent * SMS_COST_CENTS, note: `SMS blast: ${label} (${sent} sent)` } });
  }
  return NextResponse.json({ ok: true, audience: leads.length, sent, failed, batch: label });
}
