import { db } from "@/lib/db";
import { sendSms, getTwilioCfg, normalizePhone } from "@/lib/sms";

// Unified consumer SMS inbox: threads grouped by the consumer's number, plus canned-response CRUD.
// NOTE: distinct from src/lib/comms.ts (audience blasts) and src/lib/canned.ts (matcher + Canned type).

export type CommsMsg = { id: string; direction: string; body: string; at: string; read: boolean };
export type Thread = { sender: string; ourNumber: string; leadId: string | null; name: string; lastAt: string; needsHuman: boolean; messages: CommsMsg[] };
export type CannedRow = { id: string; label: string; keywords: string; reply: string; active: boolean; sortOrder: number };

// Build the unified inbox: recent SMS (both directions) grouped by the CONSUMER number = `to`.
// (`to` is the consumer number on inbound AND on our outbound replies, so grouping is symmetric.)
export async function unifiedThreads(limit = 500): Promise<{ threads: Thread[]; numbers: string[] }> {
  const rows = await db.smsMessage.findMany({ orderBy: { createdAt: "desc" }, take: limit });

  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = r.to || "";
    if (!key) continue;
    const g = groups.get(key);
    if (g) g.push(r); else groups.set(key, [r]);
  }

  const threads: Thread[] = [];
  for (const [sender, msgs] of groups) {
    // rows are already newest-first from the query
    const newestInbound = msgs.find((m) => m.direction === "inbound");
    const ourNumber = newestInbound?.fromLabel || "";
    const needsHuman = msgs.some((m) => m.direction === "inbound" && m.readAt == null);
    const withLead = msgs.find((m) => m.leadId);
    const leadId = withLead?.leadId ?? null;

    let name = sender;
    if (leadId) {
      const lead = await db.lead.findUnique({ where: { id: leadId } });
      if (lead?.name) name = lead.name;
    }

    const messages: CommsMsg[] = msgs
      .map((m) => ({ id: m.id, direction: m.direction, body: m.body, at: m.createdAt.toISOString(), read: m.direction === "outbound" || m.readAt != null }))
      .sort((a, b) => b.at.localeCompare(a.at));

    threads.push({ sender, ourNumber, leadId, name, lastAt: messages[0]?.at || "", needsHuman, messages });
  }

  // needsHuman first, then most-recent activity.
  threads.sort((a, b) => {
    if (a.needsHuman !== b.needsHuman) return a.needsHuman ? -1 : 1;
    return b.lastAt.localeCompare(a.lastAt);
  });

  const numbers = Array.from(new Set(threads.map((t) => t.ourNumber).filter((n) => n)));
  return { threads, numbers };
}

export async function cannedList(): Promise<CannedRow[]> {
  return db.cannedResponse.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
}

export async function cannedCreate(input: { label?: string; keywords?: string[]; reply?: string; sortOrder?: number }): Promise<CannedRow> {
  const keywords = JSON.stringify((input.keywords || []).map((k) => String(k).toLowerCase()));
  return db.cannedResponse.create({
    data: { label: input.label || "", keywords, reply: input.reply || "", sortOrder: input.sortOrder ?? 0 },
  });
}

export async function cannedUpdate(id: string, patch: Record<string, unknown>): Promise<CannedRow> {
  const EDITABLE = ["label", "keywords", "reply", "active", "sortOrder"] as const;
  const data: Record<string, unknown> = {};
  for (const k of EDITABLE) {
    if (k in patch) data[k] = patch[k];
  }
  if (Array.isArray(patch.keywords)) data.keywords = JSON.stringify(patch.keywords.map((k) => String(k).toLowerCase()));
  return db.cannedResponse.update({ where: { id }, data });
}

export async function cannedDelete(id: string): Promise<void> {
  await db.cannedResponse.delete({ where: { id } });
}

// Mark all of a consumer's unread inbound messages as read (handled by a human/auto-reply).
export async function markHandled(sender: string): Promise<void> {
  await db.smsMessage.updateMany({ where: { to: sender, direction: "inbound", readAt: null }, data: { readAt: new Date() } });
}

// Reply to a consumer FROM the number they texted us on (forces From=ourNumber), then mark handled.
export async function sendReply(input: { sender: string; ourNumber: string; body: string; leadId?: string | null }): Promise<{ ok: boolean; error?: string }> {
  const cfg = { ...(await getTwilioCfg()), messagingSid: "", tollFree: input.ourNumber || undefined };
  const r = await sendSms({ to: input.sender, body: input.body, leadId: input.leadId ?? undefined, cfg });
  if (r.ok) await markHandled(input.sender);
  return { ok: r.ok, error: r.error };
}

// Re-exported for callers that normalize sender / our-number values alongside the inbox.
export { normalizePhone };
