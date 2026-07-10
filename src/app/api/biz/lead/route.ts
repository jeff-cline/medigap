import { NextRequest, NextResponse } from "next/server";
import { upsertJvLead } from "@/lib/jv";
import { appendLeadBackground } from "@/lib/predictivedata";
import { sendEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/sms";
import { INTERESTS, INVESTOR_TYPES, BIZ } from "@/lib/biz";

export const dynamic = "force-dynamic";

// Map the biz form's "select all that apply" to the founder's JV interest keys (primary = highest priority).
const PRIMARY: [string, string][] = [
  ["investing", "investor"], ["brand_takeover", "nationwide_takeover"], ["sponsor_state", "state_sponsorship"],
  ["advertiser", "advertising"], ["bid_calls", "hot_transfer_moneywords"],
];

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim();
  const company = String(b.company || "").trim();
  const website = String(b.website || "").trim();
  const rawPhone = String(b.phone || "").trim();
  const phone = normalizePhone(rawPhone) || rawPhone.replace(/\D/g, "").slice(0, 15);
  const email = String(b.email || "").trim();
  const interests: string[] = Array.isArray(b.interests) ? b.interests.map(String) : [];
  const investorType = INVESTOR_TYPES.includes(b.investorType) ? String(b.investorType) : "";
  if (!name && !phone && !email) return NextResponse.json({ error: "Tell us how to reach you." }, { status: 400 });

  const primary = PRIMARY.find(([k]) => interests.includes(k));
  const jvInterest = primary ? primary[1] : (interests[0] || "");
  const interestLabels = interests.map((k) => INTERESTS.find((i) => i.key === k)?.label || k);

  const notesLines = [
    company && `Company: ${company}`,
    website && `Website: ${website}`,
    interestLabels.length && `Interested in:\n • ${interestLabels.join("\n • ")}`,
    investorType && `Investor type: ${investorType}`,
    b.role && `Entry point: ${String(b.role)}`,
  ].filter(Boolean);
  const notes = notesLines.join("\n");

  const lead = await upsertJvLead({ name, phone, email, jvInterest, source: BIZ.domain, notes });
  appendLeadBackground(lead.id);

  const subject = `1-800-MEDIGAP.biz — ${investorType ? "INVESTOR" : "New"} inquiry: ${name || company || email || "unknown"}`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">
    <h2 style="margin:0 0 8px">🚀 New 1800medigap.biz inquiry</h2>
    <p><b>${name || "(no name)"}</b>${company ? ` · ${company}` : ""}</p>
    <p>${website ? `Website: <a href="${website.startsWith("http") ? website : "https://" + website}">${website}</a><br>` : ""}
    Phone: ${phone || "—"}<br>Email: ${email || "—"}</p>
    <p><b>Interested in:</b><br>${interestLabels.map((l) => "• " + l).join("<br>") || "—"}</p>
    ${investorType ? `<p><b>Investor type:</b> ${investorType}</p>` : ""}
    ${b.role ? `<p>Entry point: ${String(b.role)}</p>` : ""}
    <p style="margin-top:14px">Manage in your JV CRM: <a href="https://medigap.plus/dashboard/jv/${lead.id}">open this deal →</a> (label it 🔥 if hot)</p>
    <p style="color:#888;font-size:13px">Data-append is running in the background to enrich this contact.</p>
  </div>`;
  // Alert both the founder and Darlin (for outreach) via Zapmail — never the consumer inbox.
  sendEmail(`${BIZ.founder}, ${BIZ.partner}`, subject, html, "zapmail").catch(() => {});

  return NextResponse.json({ ok: true, id: lead.id, book: "/book" });
}
