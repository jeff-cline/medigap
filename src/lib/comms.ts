import { db } from "./db";
import { Prisma } from "@prisma/client";
import { leadRef } from "./format";

export type AudienceFilter = { type: string; value?: string };

// Resolve a segment to its leads. Channels then filter by phone/email + opt-outs at send time.
export function audienceWhere(f: AudienceFilter): Prisma.LeadWhereInput {
  const v = (f.value || "").trim();
  switch (f.type) {
    case "missed": return { calls: { some: { OR: [{ status: { in: ["missed", "no-answer", "busy", "failed"] } }, { durationSec: { lt: 20 } }] } } };
    case "moneyword": return v ? { OR: [{ appended: { contains: v } }, { calls: { some: { moneyWord: { contains: v } } } }] } : {};
    case "site": return v ? { siteId: v } : {};
    case "status": return v ? { status: v } : {};
    case "vertical": return v ? { vertical: v } : {};
    case "source": return v ? { source: v } : {};
    case "search": return v ? { OR: [{ name: { contains: v } }, { phone: { contains: v } }, { email: { contains: v } }, { zip: { contains: v } }] } : {};
    case "all": default: return {};
  }
}

export async function audienceCount(f: AudienceFilter) {
  return db.lead.count({ where: audienceWhere(f) });
}

export async function audienceLeads(f: AudienceFilter, take = 500) {
  return db.lead.findMany({ where: audienceWhere(f), orderBy: { createdAt: "desc" }, take, select: { id: true, name: true, phone: true, email: true, refNum: true, zip: true, state: true, smsOptOut: true, emailOptOut: true } });
}

type LeadLite = { name: string; phone: string; email: string; refNum: number | null; zip: string };
export function merge(text: string, lead: LeadLite) {
  const first = (lead.name || "").trim().split(/\s+/)[0] || "there";
  return (text || "")
    .replace(/\{first\}/gi, first)
    .replace(/\{name\}/gi, lead.name || "there")
    .replace(/\{ref\}/gi, leadRef(lead.refNum))
    .replace(/\{zip\}/gi, lead.zip || "");
}
