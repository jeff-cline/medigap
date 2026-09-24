import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/sms";
import { guardForm } from "@/lib/form-guard";

/**
 * Gate in front of The Plus Network memorandum.
 *
 * Captures name / email / phone / accredited-investor status, records the
 * contact as a lead with jvInterest = "investor", stores the accreditation
 * answer on the lead, notifies the founder, and returns the PDF path.
 *
 * Follows the existing lead conventions in /api/leads: dedupe on phone or
 * email first so a returning contact is enriched rather than duplicated.
 */

// Served through an API route, not public/, because middleware rewrites
// unreserved paths on 1800medigap.biz into the /biz segment. See /api/plus-doc.
const FILE = "/api/plus-doc";
const NOTIFY = process.env.PLUS_NOTIFY_TO || "jeff.cline@me.com";

const ACCREDITED: Record<string, string> = {
  yes: "Yes — accredited investor",
  no: "No — not accredited",
  unsure: "Not sure",
};

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));

  // The Core's standard form defence: reCAPTCHA + content heuristics.
  // A blocked submission gets a silent success — no lead, no email, no PDF path.
  const gate = await guardForm(req, "plus_access", b, {
    texts: [b.name, b.company, b.message],
    email: b.email,
    phone: b.phone,
  });
  if (gate.blocked) return gate.response;

  // Honeypot, kept as a cheap second layer alongside the guard.
  if (b.company_website) return NextResponse.json({ ok: true, file: FILE });

  const name = String(b.name || "").trim().slice(0, 200);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 200);
  const rawPhone = String(b.phone || "").trim().slice(0, 40);
  const accredited = String(b.accredited || "").trim();

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (!rawPhone) return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  if (!ACCREDITED[accredited]) {
    return NextResponse.json({ error: "Select your accredited-investor status" }, { status: 400 });
  }

  const phone = normalizePhone(rawPhone) || rawPhone;
  const last10 = phone.replace(/\D/g, "").slice(-10);
  const host = (await headers()).get("host") || "";
  const site = await db.site.findUnique({ where: { hostname: host } }).catch(() => null);

  // Enrich an existing contact rather than creating a duplicate.
  const existing =
    (email ? await db.lead.findFirst({ where: { email } }) : null) ||
    (last10 ? await db.lead.findFirst({ where: { phone: { contains: last10 } } }) : null) ||
    null;

  let lead;
  if (existing) {
    const fill: Record<string, unknown> = {
      status: "contacted",
      jvInterest: "investor",
      source: existing.source && existing.source !== "organic" ? existing.source : "plus-memorandum",
    };
    if (name && (!existing.name || existing.name === "Inbound caller")) fill.name = name;
    if (email && !existing.email) fill.email = email;
    if (phone && !existing.phone) fill.phone = phone;
    if (site?.id && !existing.siteId) fill.siteId = site.id;
    lead = await db.lead.update({ where: { id: existing.id }, data: fill });
  } else {
    lead = await db.lead.create({
      data: {
        name, email, phone,
        vertical: "investor",
        source: "plus-memorandum",
        status: "contacted",
        jvInterest: "investor",
        siteId: site?.id,
      },
    });
  }

  await db.leadAnswer.create({
    data: { leadId: lead.id, question: "Accredited investor?", answer: ACCREDITED[accredited] },
  }).catch(() => null);

  // Notify the founder. Delivery failure must not block the download.
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;color:#8a93a6;font-size:13px;width:160px">${k}</td>` +
    `<td style="padding:6px 0;color:#0f1115;font-size:14px;font-weight:600">${esc(v) || "—"}</td></tr>`;

  const html = `<!doctype html><html><body style="margin:0;background:#0b0e14;padding:24px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6e8ee">
    <div style="background:linear-gradient(120deg,#f3c969,#e0a13a);padding:20px 24px">
      <div style="color:#1a1406;font-weight:800;font-size:18px">The Plus Network</div>
      <div style="color:#1a1406;opacity:.8;font-size:13px;margin-top:2px">Memorandum downloaded</div>
    </div>
    <div style="padding:22px 24px">
      <table style="width:100%;border-collapse:collapse">
        ${row("Name", name)}
        ${row("Email", email)}
        ${row("Phone", phone)}
        ${row("Accredited investor", ACCREDITED[accredited])}
        ${row("Source", host || "1800medigap.biz/plus")}
        ${row("Received", new Date().toISOString())}
        ${row("Lead ID", lead.id)}
      </table>
    </div>
  </div></body></html>`;

  const text = [
    `The Plus Network — memorandum downloaded`,
    `Name:       ${name}`,
    `Email:      ${email}`,
    `Phone:      ${phone}`,
    `Accredited: ${ACCREDITED[accredited]}`,
    `Source:     ${host || "1800medigap.biz/plus"}`,
    `Lead ID:    ${lead.id}`,
  ].join("\n");

  const sent = await sendEmail(
    NOTIFY,
    `[Plus Network] ${name} — ${ACCREDITED[accredited]}`,
    html,
    "google_workspace",
    { text },
  ).catch(() => ({ ok: false as const, error: "send threw" }));

  if (!sent.ok) console.error("plus-access: notification failed —", sent.error);

  return NextResponse.json({ ok: true, id: lead.id, file: FILE, notified: sent.ok });
}

function esc(s: string) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
