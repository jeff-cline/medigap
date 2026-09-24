import { sendEmail } from "@/lib/email";

// Outbound mail for equity.direct.
//
// Every send here is best-effort at the call site: a mail failure must never
// lose a partner record or a lead. The dashboard shows invite URLs so anything
// that does not arrive can be sent by hand.

const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const shell = (inner: string) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f2ea;padding:32px">
  <div style="max-width:540px;margin:0 auto;background:#0a0f1c;border-radius:14px;padding:32px;color:#e6ebf4">
    <div style="font-size:19px;letter-spacing:-0.01em;color:#f5f2ea;margin-bottom:22px">
      Equity<strong style="color:#c9a227">Direct</strong>
    </div>
    ${inner}
  </div>
  <p style="max-width:540px;margin:16px auto 0;font-size:11px;color:#6e7c92;line-height:1.55">
    Equity Direct is a marketing and referral service, not a lender, broker, or financial
    adviser. We do not make credit decisions or provide financial, tax, or legal advice.
  </p>
</div>`;

export async function sendPartnerInvite(to: string, name: string, token: string) {
  const url = `https://equity.direct/partners/invite?token=${encodeURIComponent(token)}`;
  return sendEmail(
    to,
    "Your Equity Direct partner invitation",
    shell(`
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
        This link is valid for 14 days and can be used once. If the button does not
        work, paste this into your browser:<br>
        <span style="color:#c9a227;word-break:break-all">${esc(url)}</span>
      </p>`),
  );
}

/** Tells the owners a lead arrived, and which keyword page produced it. */
export async function notifyNewLead(opts: {
  to: string[]; ref: string; name: string; email: string; phone: string;
  zip: string; reason: string; consented: boolean;
}) {
  if (opts.to.length === 0) return;
  const html = shell(`
    <h1 style="margin:0 0 14px;font-size:20px;color:#f5f2ea;font-weight:600">New lead — ${esc(opts.ref)}</h1>
    <table style="border-collapse:collapse;font-size:14px;color:#b9c4d6">
      <tr><td style="padding:5px 18px 5px 0">Name</td><td style="color:#f5f2ea">${esc(opts.name || "—")}</td></tr>
      <tr><td style="padding:5px 18px 5px 0">Email</td><td style="color:#f5f2ea">${esc(opts.email || "—")}</td></tr>
      <tr><td style="padding:5px 18px 5px 0">Phone</td><td style="color:#f5f2ea">${esc(opts.phone || "—")}</td></tr>
      <tr><td style="padding:5px 18px 5px 0">ZIP</td><td style="color:#f5f2ea">${esc(opts.zip || "—")}</td></tr>
      <tr><td style="padding:5px 18px 5px 0">Reason</td><td style="color:#f5f2ea">${esc(opts.reason || "—")}</td></tr>
      <tr><td style="padding:5px 18px 5px 0">Contact by</td><td style="color:${opts.consented ? "#3f9c6d" : "#ff5d6c"}">
        ${opts.consented ? "Phone, text or email — consent on file" : "EMAIL ONLY — no call/text consent"}
      </td></tr>
    </table>
    <p style="margin:22px 0 0">
      <a href="https://medigap.plus/dashboard/equity" style="background:#c9a227;color:#1a1405;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;display:inline-block">
        Open the CRM
      </a>
    </p>`);

  await Promise.allSettled(opts.to.map((t) => sendEmail(t, `New equity.direct lead: ${opts.ref}`, html)));
}
