import { NextRequest, NextResponse } from "next/server";
import { isSpamSubmission } from "@/lib/spam-guard";
import { db } from "@/lib/db";
import { upsertJvLead } from "@/lib/jv";
import { sendEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const CORS: Record<string, string> = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const esc = (s: string) => String(s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c));
export function OPTIONS() { return new NextResponse(null, { headers: CORS }); }

// r0cketship.com/launch — "Join The Movement" → JV lead in the founder's CRM + email. CORS-enabled.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({} as Record<string, string>));
  const firstName = String(b.firstName || "").trim();
  const lastName = String(b.lastName || "").trim();
  const city = String(b.city || "").trim();
  const state = String(b.state || "").trim();
  const zip = String(b.zip || "").trim();
  const businessName = String(b.businessName || "").trim();
  const location = String(b.location || "").trim();
  const phone = normalizePhone(String(b.phone || "")) || String(b.phone || "").trim();
  const comments = String(b.comments || "").trim();
  const agreed = b.agreed === true || b.agreed === "true";
  const name = `${firstName} ${lastName}`.trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400, headers: CORS });

  const jvInterest = `Join The Movement · r0cketship.com/launch${businessName ? ` — ${businessName}` : ""}`.slice(0, 190);
  const lead = await upsertJvLead({ name, phone, jvInterest }).catch(() => null);
  const rows: [string, string][] = [
    ["Name", name],
    ["Business", businessName || "—"],
    ["Location", location || "—"],
    ["City / State / Zip", [city, state, zip].filter(Boolean).join(", ") || "—"],
    ["Phone", phone || "—"],
    ["Why a great fit", comments || "—"],
    ["Agreed", agreed ? "Yes — rising tide, data over ego" : "No"],
    ["Source", "r0cketship.com/launch — Join The Movement"],
  ];
  const lid = (lead as { id?: string } | null)?.id;
  if (lid) await db.leadNote.create({ data: { leadId: lid, authorName: "R0cketShip · Join The Movement", body: "🚀 Join The Movement\n" + rows.map(([k, v]) => `${k}: ${v}`).join("\n") } }).catch(() => {});
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111"><h2 style="color:#F5821F;margin:0 0 8px">🚀 Join The Movement — a business wants in</h2><table style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:5px 14px 5px 0;color:#666;vertical-align:top">${k}</td><td style="font-weight:600">${esc(v)}</td></tr>`).join("")}</table><p style="color:#999;font-size:12px;margin-top:12px">Forwarded on to quuik.com/join after submitting.${lid ? ` (lead ${lid})` : ""}</p></div>`;
  sendEmail("jeff.cline@me.com", `🚀 Join The Movement: ${name}${businessName ? " — " + businessName : ""}`, html, "zapmail").catch(() => {});
  return NextResponse.json({ ok: true }, { headers: CORS });
}
