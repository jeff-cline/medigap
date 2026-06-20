import nodemailer from "nodemailer";
import { db } from "./db";

// Three separate email systems, each its own integration:
//   google_workspace = business / transactional (alerts to staff)
//   zapmail          = cold / non-opted-in outreach (seasoned mailboxes)
//   klaviyo          = opted-in marketing (API, handled elsewhere)
type Provider = "google_workspace" | "zapmail";

async function smtpConfig(key: Provider) {
  const row = await db.integration.findUnique({ where: { key } });
  let c: Record<string, string> = {};
  try { c = row ? JSON.parse(row.config) : {}; } catch {}
  return c;
}

async function getTransport(key: Provider) {
  const c = await smtpConfig(key);
  if (!c.smtpHost || !c.smtpUser || !c.smtpPass) return null;
  const port = parseInt(c.smtpPort || "587", 10);
  return { from: c.fromEmail || c.smtpUser, transport: nodemailer.createTransport({ host: c.smtpHost, port, secure: port === 465, auth: { user: c.smtpUser, pass: c.smtpPass } }) };
}

export async function sendEmail(to: string, subject: string, html: string, provider: Provider = "google_workspace"): Promise<{ ok: boolean; error?: string }> {
  const t = await getTransport(provider);
  if (!t) return { ok: false, error: `${provider} SMTP not configured` };
  try { await t.transport.sendMail({ from: t.from, to, subject, html }); return { ok: true }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : "send failed" }; }
}

export async function verifyEmail(provider: Provider): Promise<{ ok: boolean; error?: string }> {
  const t = await getTransport(provider);
  if (!t) return { ok: false, error: "Missing SMTP host / user / password" };
  try { await t.transport.verify(); return { ok: true }; } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "verify failed" }; }
}

const BRAND = "#16d6a5";
export function newAccountEmail(u: { name: string; email: string; role: string; phone: string; source: string; id: string }) {
  const row = (k: string, v: string) => `<tr><td style="padding:6px 0;color:#8a93a6;font-size:13px;width:130px">${k}</td><td style="padding:6px 0;color:#0f1115;font-size:14px;font-weight:600">${v || "—"}</td></tr>`;
  return `<!doctype html><html><body style="margin:0;background:#0b0e14;padding:24px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6e8ee">
    <div style="background:linear-gradient(120deg,#16d6a5,#1e8bff);padding:20px 24px">
      <div style="color:#03110d;font-weight:800;font-size:18px">medigap.plus</div>
      <div style="color:#03110d;opacity:.8;font-size:13px;margin-top:2px">New account created</div>
    </div>
    <div style="padding:24px">
      <h2 style="margin:0 0 4px;color:#0f1115;font-size:20px">${u.name || u.email}</h2>
      <span style="display:inline-block;background:${BRAND}1f;color:#0b7;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;text-transform:capitalize">${u.role}</span>
      <table style="width:100%;border-collapse:collapse;margin-top:16px">${row("Email", u.email)}${row("Phone", u.phone)}${row("Role", u.role)}${row("Came in from", u.source)}</table>
      <a href="https://medigap.plus/dashboard/users" style="display:inline-block;margin-top:20px;background:linear-gradient(120deg,#16d6a5,#1e8bff);color:#03110d;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:12px;font-size:14px">Review in dashboard →</a>
      <p style="color:#8a93a6;font-size:12px;margin-top:18px">Sent automatically by medigap.plus when a new account is created.</p>
    </div>
  </div></body></html>`;
}

// New-account alerts go through Google Workspace (business email).
export async function notifyNewAccount(u: { name: string; email: string; role: string; phone: string; source: string; id: string }) {
  return sendEmail("jeff.cline@me.com", `New ${u.role} account: ${u.name || u.email}`, newAccountEmail(u), "google_workspace");
}
