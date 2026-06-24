import { db } from "./db";
import { sendEmail } from "./email";
import { parseTags } from "./recapture";
import { FOUNDER_COMM_TAG, FOUNDER_ENGINES, JV_TAG } from "./jv-constants";

// ---------------------------------------------------------------------------
// Founder Communication — personal, one-at-a-time email in the founder's voice,
// sent from a chosen engine, logged to the CRM and tagged FOUNDER COMMUNICATION.
// ---------------------------------------------------------------------------

// Map an engine key → the SMTP provider sendEmail() understands. Klaviyo is the
// opted-in blast path (not one-to-one), so it has no SMTP provider here.
function smtpProviderFor(engine: string): "google_workspace" | "zapmail" | "smtp" | null {
  switch (engine) {
    case "personal": return "google_workspace";
    case "zapmail": return "zapmail";
    case "smtp": return "smtp";
    default: return null;
  }
}

export async function engineReady(engine: string): Promise<boolean> {
  const cfg = FOUNDER_ENGINES.find((e) => e.key === engine);
  if (!cfg) return false;
  const row = await db.integration.findUnique({ where: { key: cfg.integrationKey } });
  if (!row) return false;
  try {
    const c = JSON.parse(row.config || "{}");
    if (engine === "klaviyo") return !!(c.privateKey || c.apiKey);
    return !!(c.smtpHost && c.smtpUser && c.smtpPass);
  } catch { return false; }
}

// Templates already sent to a lead from the founder console, with the engine used.
export async function sentTemplatesFor(leadId: string): Promise<{ templateId: string; templateName: string; engine: string; status: string; at: Date }[]> {
  const rows = await db.emailMessage.findMany({
    where: { leadId, founder: true, direction: "outbound" },
    orderBy: { createdAt: "desc" },
    select: { templateId: true, templateName: true, engine: true, status: true, createdAt: true },
  });
  return rows.map((r) => ({ templateId: r.templateId || "", templateName: r.templateName, engine: r.engine, status: r.status, at: r.createdAt }));
}

// No-resend guard: a (template, lead) pair already sent may only be re-sent via a
// DIFFERENT engine than every prior send of that template (deliverability fallback).
export async function resendCheck(leadId: string, templateId: string, engine: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!templateId) return { allowed: true }; // ad-hoc (no template) is never blocked
  const prior = await db.emailMessage.findMany({
    where: { leadId, founder: true, templateId, status: { not: "failed" } },
    select: { engine: true },
  });
  if (prior.length === 0) return { allowed: true };
  if (prior.some((p) => p.engine === engine)) {
    return { allowed: false, reason: `This template already went to this person via ${engine}. To resend, pick a different email service.` };
  }
  return { allowed: true }; // already sent, but via a different engine → allowed
}

// Light merge for the founder's personal touches.
function merge(s: string, lead: { name: string }): string {
  const first = (lead.name || "").trim().split(/\s+/)[0] || "there";
  return (s || "").replace(/\{first\}/g, first).replace(/\{name\}/g, lead.name || "there");
}

export async function sendFounderEmail(input: {
  leadId: string; engine: string; subject: string; html: string; text?: string;
  templateId?: string; templateName?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const lead = await db.lead.findUnique({ where: { id: input.leadId } });
  if (!lead) return { ok: false, error: "Contact not found" };
  if (!lead.email) return { ok: false, error: "This contact has no email address." };

  const provider = smtpProviderFor(input.engine);
  if (!provider) return { ok: false, error: `${input.engine} is the opted-in blast path — use the Communications page for mass sends.` };

  // Enforce the no-resend guard server-side too.
  const guard = await resendCheck(input.leadId, input.templateId || "", input.engine);
  if (!guard.allowed) return { ok: false, error: guard.reason };

  const subject = merge(input.subject, lead);
  const html = merge(input.html, lead);
  const text = input.text ? merge(input.text, lead) : undefined;

  const res = await sendEmail(lead.email, subject, html, provider, { text });

  await db.emailMessage.create({
    data: {
      to: lead.email, subject, body: html, leadId: lead.id,
      direction: "outbound", engine: input.engine, founder: true,
      fromEmail: res.fromEmail || "", messageId: res.messageId || "",
      templateId: input.templateId || null, templateName: input.templateName || "",
      status: res.ok ? "sent" : "failed", error: res.error || "",
    },
  }).catch(() => {});

  // Tag the lead FOUNDER COMMUNICATION (and keep it in the deal room).
  const tags = parseTags(lead.tags);
  let changed = false;
  for (const t of [FOUNDER_COMM_TAG, JV_TAG]) if (!tags.includes(t)) { tags.push(t); changed = true; }
  if (changed) await db.lead.update({ where: { id: lead.id }, data: { tags: JSON.stringify(tags) } }).catch(() => {});

  return res.ok ? { ok: true } : { ok: false, error: res.error || "send failed" };
}
