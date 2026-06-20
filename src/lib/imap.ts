import { ImapFlow } from "imapflow";
import { db } from "./db";

export type Provider = "google_workspace" | "zapmail";
export type InboundMsg = { from: string; subject: string; date: string; snippet: string };

// Read the latest inbound emails for a provider's mailbox over IMAP.
export async function readInbox(provider: Provider, limit = 20): Promise<{ ok: boolean; messages: InboundMsg[]; error?: string }> {
  const row = await db.integration.findUnique({ where: { key: provider } });
  let c: Record<string, string> = {};
  try { c = row ? JSON.parse(row.config) : {}; } catch {}
  const host = c.imapHost || (c.smtpHost?.includes("gmail") ? "imap.gmail.com" : "");
  const user = c.smtpUser, pass = c.smtpPass;
  if (!host || !user || !pass) return { ok: false, messages: [], error: "IMAP not configured (host / user / password)" };

  const client = new ImapFlow({ host, port: parseInt(c.imapPort || "993", 10), secure: true, auth: { user, pass }, logger: false });
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    const out: InboundMsg[] = [];
    try {
      const status = await client.status("INBOX", { messages: true });
      const totalMsgs = status.messages || 0;
      if (totalMsgs > 0) {
        const start = Math.max(1, totalMsgs - limit + 1);
        for await (const msg of client.fetch(`${start}:*`, { envelope: true, bodyStructure: false, source: false })) {
          const env = msg.envelope;
          const fromAddr = env?.from?.[0];
          out.push({
            from: fromAddr?.address || fromAddr?.name || "—",
            subject: env?.subject || "(no subject)",
            date: env?.date ? new Date(env.date).toISOString() : "",
            snippet: "",
          });
        }
      }
    } finally { lock.release(); }
    await client.logout();
    return { ok: true, messages: out.reverse() };
  } catch (e) {
    try { await client.close(); } catch {}
    return { ok: false, messages: [], error: e instanceof Error ? e.message : "IMAP error" };
  }
}
