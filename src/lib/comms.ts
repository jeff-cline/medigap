import { db } from "./db";
import { Prisma } from "@prisma/client";
import { leadRef } from "./format";

export type AudienceFilter = { type: string; value?: string | string[] };

// Resolve a segment to its leads. Channels then filter by phone/email + opt-outs at send time.
export function audienceWhere(f: AudienceFilter): Prisma.LeadWhereInput {
  const v = (typeof f.value === "string" ? f.value : "").trim();
  switch (f.type) {
    case "missed": return { calls: { some: { OR: [{ status: { in: ["missed", "no-answer", "busy", "failed"] } }, { durationSec: { lt: 20 } }] } } };
    case "tag": return v ? { tags: { contains: v } } : {};
    case "stage": return v ? { recaptureStage: v } : {};
    case "ids": return Array.isArray(f.value) ? { id: { in: f.value } } : {};
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

export const COMMS_BASE = "https://medigap.plus";
// Tracked CTA link for a lead — a click marks them "clicked" and lands them on the funnel.
export function trackedLink(leadId: string, to = "/medicare") {
  return `${COMMS_BASE}/r/${leadId}?to=${encodeURIComponent(to)}`;
}

type LeadLite = { id?: string; name: string; phone: string; email: string; refNum: number | null; zip: string };
export function merge(text: string, lead: LeadLite) {
  const first = (lead.name || "").trim().split(/\s+/)[0] || "there";
  return (text || "")
    .replace(/\{first\}/gi, first)
    .replace(/\{name\}/gi, lead.name || "there")
    .replace(/\{ref\}/gi, leadRef(lead.refNum))
    .replace(/\{zip\}/gi, lead.zip || "")
    .replace(/\{link\}/gi, lead.id ? trackedLink(lead.id) : `${COMMS_BASE}/`);
}
