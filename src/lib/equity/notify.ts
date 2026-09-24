import { sendEmail } from "@/lib/email";
import { db } from "@/lib/db";
import { getEquitySettings } from "./settings";

// Outbound mail for equity.direct.
//
// Every send is best-effort at the call site — a mail failure must never lose a
// lead or a partner record. The consequence is that a broken mailbox looks
// exactly like everything working, which is why every attempt is logged to
// EqEmailLog and surfaced in the back office. Silent failure is the thing this
// module is built to prevent.

const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const shell = (inner: string, phone: string) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f2ea;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#0a0f1c;border-radius:14px;padding:32px;color:#e6ebf4">
    <div style="font-size:19px;letter-spacing:-0.01em;color:#f5f2ea;margin-bottom:22px">
      Equity<strong style="color:#c9a227">Direct</strong>
    </div>
    ${inner}
    <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #24334d;color:#8b98ae;font-size:13px">
      Questions? Call us on <a href="tel:${esc(phone.replace(/[^\d+]/g, ""))}" style="color:#c9a227;text-decoration:none">${esc(phone)}</a>.
    </p>
  </div>
  <p style="max-width:560px;margin:16px auto 0;font-size:11px;color:#6e7c92;line-height:1.55">
    Equity Direct is a marketing and referral service, not a lender, broker, or financial
    adviser. We do not make credit decisions or provide financial, tax, or legal advice.
  </p>
</div>`;

/** Send and record the outcome. Never throws. */
async function send(kind: string, to: string, subject: string, html: string) {
  let ok = false;
  let error = "";
  try {
    const r = await sendEmail(to, subject, html);
    ok = r.ok;
    error = r.error ?? "";
  } catch (e) {
    error = e instanceof Error ? e.message : "send failed";
  }
  await db.eqEmailLog
    .create({ data: { to, kind, subject, ok, error: error.slice(0, 500) } })
    .catch(() => null);
  return { ok, error };
}

const money = (c: number) =>
  c > 0 ? `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—";

/**
 * Welcome the homeowner and confirm what they told us.
 *
 * Includes their own figures back, because the single most reassuring thing
 * after handing over details is seeing that they arrived correctly, and a
 * magic link so they can return to their tools without a password.
 */
export async function sendWelcome(opts: {
  to: string; firstName: string; ref: string; reason: string;
  zip: string; estEquity: number; token: string;
}) {
  const { phone } = await getEquitySettings();
  const link = `https://equity.direct/account?t=${encodeURIComponent(opts.token)}`;

  return send("welcome", opts.to, "Your Equity Direct account is open", shell(`
    <h1 style="margin:0 0 14px;font-size:22px;color:#f5f2ea;font-weight:600">
      ${opts.firstName ? `${esc(opts.firstName)}, you` : "You"}&rsquo;re in.
    </h1>
    <p style="margin:0 0 18px;color:#b9c4d6;font-size:15px;line-height:1.6">
      Your account is open and someone will be in touch about your options. Nothing is
      committed, and there is no obligation at any point.
    </p>
    <table style="border-collapse:collapse;font-size:14px;color:#b9c4d6;margin-bottom:22px">
      <tr><td style="padding:5px 18px 5px 0">Reference</td>
          <td style="color:#c9a227;font-family:ui-monospace,monospace">${esc(opts.ref)}</td></tr>
      ${opts.reason ? `<tr><td style="padding:5px 18px 5px 0">You told us</td><td style="color:#f5f2ea">${esc(opts.reason)}</td></tr>` : ""}
      ${opts.zip ? `<tr><td style="padding:5px 18px 5px 0">Property ZIP</td><td style="color:#f5f2ea">${esc(opts.zip)}</td></tr>` : ""}
      ${opts.estEquity > 0 ? `<tr><td style="padding:5px 18px 5px 0">Estimated equity</td><td style="color:#f5f2ea">${money(opts.estEquity)}</td></tr>` : ""}
    </table>
    <p style="margin:0 0 20px;color:#b9c4d6;font-size:15px;line-height:1.6">
      Your account has calculators for comparing an equity agreement against a loan,
      working out what you could access, and seeing what each option actually costs
      over time.
    </p>
    <p style="margin:0 0 20px">
      <a href="${link}" style="background:#c9a227;color:#1a1405;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:999px;display:inline-block">
        Open your account
      </a>
    </p>
    <p style="margin:0;color:#8b98ae;font-size:12px;line-height:1.6">
      No password needed — this link signs you in. It is personal to you, so do not
      forward it. If the button does not work, paste this into your browser:<br>
      <span style="color:#c9a227;word-break:break-all">${esc(link)}</span>
    </p>`, phone));
}

/** A fresh sign-in link for someone returning later. */
export async function sendMagicLink(to: string, firstName: string, token: string) {
  const { phone } = await getEquitySettings();
  const link = `https://equity.direct/account?t=${encodeURIComponent(token)}`;
  return send("magic_link", to, "Your Equity Direct sign-in link", shell(`
    <h1 style="margin:0 0 14px;font-size:21px;color:#f5f2ea;font-weight:600">Sign in</h1>
    <p style="margin:0 0 20px;color:#b9c4d6;font-size:15px;line-height:1.6">
      ${firstName ? `${esc(firstName)}, here` : "Here"} is your link. It is good for
      24 hours and signs you straight in.
    </p>
    <p style="margin:0 0 20px">
      <a href="${link}" style="background:#c9a227;color:#1a1405;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:999px;display:inline-block">
        Open your account
      </a>
    </p>
    <p style="margin:0;color:#8b98ae;font-size:12px">
      If you did not ask for this, ignore it and nothing happens.
    </p>`, phone));
}

export async function sendPartnerInvite(to: string, name: string, token: string) {
  const { phone } = await getEquitySettings();
  const url = `https://equity.direct/partners/invite?token=${encodeURIComponent(token)}`;
  return send("partner_invite", to, "Your Equity Direct partner invitation", shell(`
    <h1 style="margin:0 0 14px;font-size:22px;color:#f5f2ea;font-weight:600">
      ${name ? `${esc(name)}, you` : "You"} have been invited as a partner
    </h1>
    <p style="margin:0 0 18px;color:#b9c4d6;font-size:15px;line-height:1.6">
      Set your password and you will be able to see every homeowner you refer and
      where each one has got to.
    </p>
    <p style="margin:0 0 22px">
      <a href="${url}" style="background:#c9a227;color:#1a1405;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:999px;display:inline-block">
        Set your password
      </a>
    </p>
    <p style="margin:0;color:#8b98ae;font-size:12px;line-height:1.6">
      Valid for 14 days, single use. If the button does not work, paste this in:<br>
      <span style="color:#c9a227;word-break:break-all">${esc(url)}</span>
    </p>`, phone));
}

/** Tells the owners a lead arrived, and which keyword page produced it. */
export async function notifyNewLead(opts: {
  ref: string; name: string; email: string; phone: string;
  zip: string; reason: string; consented: boolean; estEquity: number;
}) {
  const settings = await getEquitySettings();

  // Explicit alert addresses if set, otherwise every active God account —
  // queried rather than hardcoded so promoting an owner updates the list.
  let to = settings.alertEmails.split(",").map((s) => s.trim()).filter(Boolean);
  if (to.length === 0) {
    const owners = await db.user
      .findMany({ where: { role: "god", status: "active" }, select: { email: true } })
      .catch(() => [] as { email: string }[]);
    to = owners.map((o) => o.email);
  }
  if (to.length === 0) return;

  const html = shell(`
    <h1 style="margin:0 0 14px;font-size:20px;color:#f5f2ea;font-weight:600">New lead — ${esc(opts.ref)}</h1>
    <table style="border-collapse:collapse;font-size:14px;color:#b9c4d6">
      <tr><td style="padding:5px 18px 5px 0">Name</td><td style="color:#f5f2ea">${esc(opts.name || "—")}</td></tr>
      <tr><td style="padding:5px 18px 5px 0">Email</td><td style="color:#f5f2ea">${esc(opts.email || "—")}</td></tr>
      <tr><td style="padding:5px 18px 5px 0">Phone</td><td style="color:#f5f2ea">${esc(opts.phone || "—")}</td></tr>
      <tr><td style="padding:5px 18px 5px 0">ZIP</td><td style="color:#f5f2ea">${esc(opts.zip || "—")}</td></tr>
      <tr><td style="padding:5px 18px 5px 0">Est. equity</td><td style="color:#f5f2ea">${money(opts.estEquity)}</td></tr>
      <tr><td style="padding:5px 18px 5px 0">Reason</td><td style="color:#f5f2ea">${esc(opts.reason || "—")}</td></tr>
      <tr><td style="padding:5px 18px 5px 0">Contact by</td><td style="color:${opts.consented ? "#3f9c6d" : "#ff5d6c"}">
        ${opts.consented ? "Phone, text or email — consent on file" : "EMAIL ONLY — no call/text consent"}
      </td></tr>
    </table>
    <p style="margin:22px 0 0">
      <a href="https://medigap.plus/dashboard/equity" style="background:#c9a227;color:#1a1405;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;display:inline-block">
        Open the CRM
      </a>
    </p>`, settings.phone);

  await Promise.allSettled(
    to.map((t) => send("lead_alert", t, `New equity.direct lead: ${opts.ref}`, html)),
  );
}
