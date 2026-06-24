import { randomUUID } from "crypto";
import { db } from "./db";
import { sendEmail } from "./email";
import { readInbox, type Provider as ImapProvider } from "./imap";
import { appendLeadBackground } from "./predictivedata";
import { parseTags } from "./recapture";
import { FOUNDER, FOUNDER_COMM_TAG, FOUNDER_ENGINES, JV_TAG } from "./jv-constants";

// Absolute base for tracking pixels in outbound email (emails can't use relative URLs).
const TRACK_BASE = process.env.PUBLIC_BASE_URL || "https://medigap.plus";

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
    // Zapmail sends via its rotating mailbox pool (or a single SMTP mailbox fallback).
    if (engine === "zapmail" && Array.isArray(c.mailboxes) && c.mailboxes.length) return true;
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

// Merge tokens available in subjects/bodies/texts: {first} {last} {name} {dob} {today} {calendar}.
export function mergeFields(s: string, lead: { name?: string; dob?: string }): string {
  const parts = (lead.name || "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0] || "there";
  const last = parts.slice(1).join(" ");
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return (s || "")
    .replace(/\{first\}/g, first)
    .replace(/\{last\}/g, last)
    .replace(/\{name\}/g, lead.name || "there")
    .replace(/\{dob\}/g, lead.dob || "")
    .replace(/\{today\}/g, today)
    .replace(/\{calendar\}/g, FOUNDER.calendly);
}

export async function sendFounderEmail(input: {
  leadId: string; engine: string; subject: string; html: string; text?: string;
  templateId?: string; templateName?: string; applyTags?: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const lead = await db.lead.findUnique({ where: { id: input.leadId } });
  if (!lead) return { ok: false, error: "Contact not found" };
  if (!lead.email) return { ok: false, error: "This contact has no email address." };

  const provider = smtpProviderFor(input.engine);
  if (!provider) return { ok: false, error: `${input.engine} is the opted-in blast path — use the Communications page for mass sends.` };

  // Enforce the no-resend guard server-side too.
  const guard = await resendCheck(input.leadId, input.templateId || "", input.engine);
  if (!guard.allowed) return { ok: false, error: guard.reason };

  const subject = mergeFields(input.subject, lead);
  const text = input.text ? mergeFields(input.text, lead) : undefined;

  // Open-tracking pixel: a unique token per send, embedded invisibly in the HTML.
  const openToken = randomUUID();
  const html = mergeFields(input.html, lead) +
    `<img src="${TRACK_BASE}/api/track/open?e=${openToken}" width="1" height="1" alt="" style="display:none" />`;

  const res = await sendEmail(lead.email, subject, html, provider, { text });

  await db.emailMessage.create({
    data: {
      to: lead.email, subject, body: html, leadId: lead.id,
      direction: "outbound", engine: input.engine, founder: true,
      fromEmail: res.fromEmail || "", messageId: res.messageId || "", openToken,
      templateId: input.templateId || null, templateName: input.templateName || "",
      status: res.ok ? "sent" : "failed", error: res.error || "",
    },
  }).catch(() => {});

  // Tag the lead (default: FOUNDER COMMUNICATION + deal room; bulk sends pass their own tags).
  const tags = parseTags(lead.tags);
  let changed = false;
  for (const t of (input.applyTags || [FOUNDER_COMM_TAG, JV_TAG])) if (!tags.includes(t)) { tags.push(t); changed = true; }
  if (changed) await db.lead.update({ where: { id: lead.id }, data: { tags: JSON.stringify(tags) } }).catch(() => {});

  return res.ok ? { ok: true } : { ok: false, error: res.error || "send failed" };
}

// Pull inbound email over IMAP for each connected engine, match each message to a Lead
// by from-address, persist it (deduped) as an inbound EmailMessage, and mark the most
// Skip automated / system senders so the inbox stays real human replies only.
function isSystemSender(email: string): boolean {
  const [local = "", domain = ""] = email.split("@");
  if (/(^|[._-])(no-?reply|do-?not-?reply|donotreply|mailer-daemon|postmaster|bounce[sd]?|notifications?|alerts?|support|news(letter)?)([._-]|$)/.test(local)) return true;
  if (/(^|\.)(accounts\.google\.com|google\.com|mail\.google\.com|bounces\.|sendgrid\.|amazonses\.com)/.test(domain)) return true;
  return false;
}

// recent outbound founder email to that person as replied. Best-effort; returns counts.
export async function syncInbox(): Promise<{ ok: boolean; pulled: number; matched: number; replies: number; errors: string[] }> {
  const providers: { engine: string; imap: ImapProvider }[] = [
    { engine: "personal", imap: "google_workspace" },
    { engine: "zapmail", imap: "zapmail" },
    { engine: "smtp", imap: "smtp" },
  ];
  let pulled = 0, matched = 0, replies = 0;
  const errors: string[] = [];

  for (const p of providers) {
    if (!(await engineReady(p.engine))) continue;
    const res = await readInbox(p.imap, 30).catch(() => ({ ok: false, messages: [] as { from: string; fromName: string; subject: string; date: string }[], error: "imap error" }));
    if (!res.ok) { if (res.error) errors.push(`${p.engine}: ${res.error}`); continue; }

    for (const m of res.messages) {
      const fromEmail = (m.from || "").toLowerCase().trim();
      if (!fromEmail.includes("@")) continue;
      if (isSystemSender(fromEmail)) continue; // skip automated / no-reply / system mail
      // Match to a known contact by email; if none, create one so every reply lands in
      // the CRM (unified by email) and gets auto-appended.
      let lead = await db.lead.findFirst({ where: { email: fromEmail } }).catch(() => null);
      if (!lead) {
        lead = await db.lead.create({
          data: { name: m.fromName || "", email: fromEmail, vertical: "partner", source: "founder-inbound", tags: JSON.stringify([FOUNDER_COMM_TAG, JV_TAG]) },
        }).catch(() => null);
        if (lead) appendLeadBackground(lead.id); // enrich the new contact in the background
      }
      if (!lead) continue;

      const messageId = `in:${p.engine}:${fromEmail}:${m.subject}:${m.date}`.slice(0, 480);
      const exists = await db.emailMessage.findFirst({ where: { messageId, direction: "inbound" } }).catch(() => null);
      if (exists) continue;

      pulled++; matched++;
      const at = m.date ? new Date(m.date) : new Date();
      await db.emailMessage.create({
        data: {
          to: "support@1800medigap.com", fromEmail, subject: m.subject || "(no subject)",
          body: "", leadId: lead.id, direction: "inbound", engine: p.engine, founder: true,
          messageId, status: "received", createdAt: isNaN(at.getTime()) ? new Date() : at,
        },
      }).catch(() => {});

      // Mark the latest outbound founder email to this lead as replied.
      const lastOut = await db.emailMessage.findFirst({
        where: { leadId: lead.id, founder: true, direction: "outbound", repliedAt: null },
        orderBy: { createdAt: "desc" },
      }).catch(() => null);
      if (lastOut) { await db.emailMessage.update({ where: { id: lastOut.id }, data: { repliedAt: new Date() } }).catch(() => {}); replies++; }

      // Ensure the contact is tagged FOUNDER COMMUNICATION.
      const tags = parseTags(lead.tags);
      if (!tags.includes(FOUNDER_COMM_TAG)) { tags.push(FOUNDER_COMM_TAG); await db.lead.update({ where: { id: lead.id }, data: { tags: JSON.stringify(tags) } }).catch(() => {}); }
    }
  }
  return { ok: true, pulled, matched, replies, errors };
}
