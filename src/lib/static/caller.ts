import { db } from "@/lib/db";

export async function callerDetail(callId: string) {
  const call = await db.call.findUnique({ where: { id: callId } });
  if (!call) return null;
  const lead = call.leadId ? await db.lead.findUnique({ where: { id: call.leadId } }) : null;
  const answers = lead ? await db.leadAnswer.findMany({ where: { leadId: lead.id }, orderBy: { askedAt: "asc" } }) : [];
  const otherCalls = await db.call.findMany({
    where: { fromNumber: call.fromNumber, id: { not: callId }, disposition: { startsWith: "static" } },
    orderBy: { createdAt: "desc" }, take: 50,
  });
  return { call, lead, answers, otherCalls };
}

export function parseTranscript(s: string | null): { role: string; text: string }[] {
  try { const a = JSON.parse(s || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
}
