import { ImapFlow } from "imapflow";
import { getZapConfig, type ZapMailbox } from "./zapmail";

// ---------------------------------------------------------------------------
// The spam-review inbox.
//
// One Zapmail mailbox is reserved out of the cold-outreach send rotation and
// used for one thing: the founder forwards any spam that still gets through,
// and we read it here to find which form is unprotected.
//
// It has to be OUT of the send rotation — a mailbox that is also blasting cold
// outreach fills with bounces and auto-replies, and the forwarded spam is lost
// in it. lib/zapmail.ts nextMailbox() skips whatever is set here.
// ---------------------------------------------------------------------------

/** The reserved address. Change it here and in the zapmail integration config. */
export const REVIEW_INBOX = "jane@securityup.co";

export type ForwardedMsg = {
  uid: number;
  from: string;
  fromName: string;
  subject: string;
  date: string;
  body: string;
};

export async function reviewMailbox(): Promise<ZapMailbox | null> {
  const cfg = await getZapConfig();
  const want = (cfg?.reservedInbox || REVIEW_INBOX).toLowerCase();
  return (cfg?.mailboxes || []).find((m) => m.email.toLowerCase() === want) ?? null;
}

/** Strip an email body down to readable text. */
function toText(raw: string): string {
  // Take the part after the headers, drop obvious MIME scaffolding and tags.
  const split = raw.indexOf("\r\n\r\n");
  let body = split >= 0 ? raw.slice(split + 4) : raw;
  body = body
    .replace(/=\r?\n/g, "")                         // quoted-printable soft breaks
    .replace(/=([0-9A-F]{2})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/^--[-\w]+\r?$/gm, "")
    .replace(/^Content-(Type|Transfer-Encoding|Disposition):.*$/gim, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return body.slice(0, 4000);
}

/**
 * Read the most recent forwarded messages, bodies included — the body is the
 * whole point, since that is where the form's fields and the source URL are.
 */
export async function readReviewInbox(limit = 25): Promise<{ ok: boolean; address: string; messages: ForwardedMsg[]; error?: string }> {
  const mb = await reviewMailbox();
  if (!mb) {
    return { ok: false, address: REVIEW_INBOX, messages: [], error: `${REVIEW_INBOX} is not in the Zapmail mailbox list — re-sync mailboxes in Integrations → Zapmail.` };
  }
  if (!mb.smtpPass) {
    return { ok: false, address: mb.email, messages: [], error: "No stored app password for this mailbox — run the Zapmail credential export." };
  }

  const client = new ImapFlow({
    host: mb.imapHost || "imap.gmail.com",
    port: mb.imapPort || 993,
    secure: true,
    auth: { user: mb.smtpUser || mb.email, pass: mb.smtpPass },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    const out: ForwardedMsg[] = [];
    try {
      const status = await client.status("INBOX", { messages: true });
      const total = status.messages || 0;
      if (total > 0) {
        const start = Math.max(1, total - limit + 1);
        for await (const msg of client.fetch(`${start}:*`, { envelope: true, source: true })) {
          const env = msg.envelope;
          const from = env?.from?.[0];
          out.push({
            uid: msg.uid,
            from: (from?.address || "").toLowerCase(),
            fromName: from?.name || "",
            subject: env?.subject || "(no subject)",
            date: env?.date ? new Date(env.date).toISOString() : "",
            body: msg.source ? toText(msg.source.toString("utf8")) : "",
          });
        }
      }
    } finally { lock.release(); }
    await client.logout();
    return { ok: true, address: mb.email, messages: out.reverse() };
  } catch (e) {
    try { await client.logout(); } catch { /* already closed */ }
    return { ok: false, address: mb.email, messages: [], error: e instanceof Error ? e.message : "IMAP error" };
  }
}
