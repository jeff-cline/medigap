import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { upsertJvLead } from "@/lib/jv";
import { sendEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FOUNDER_EMAIL = "jeff.cline@me.com";
const seeOther = (p: string) => new NextResponse(null, { status: 303, headers: { Location: p } });

// R0cketShip order form → save to the JV file (JV_TAG lead + note) and email the founder directly.
export async function POST(req: NextRequest) {
  const fd = await req.formData().catch(() => new FormData());
  const g = (k: string) => String(fd.get(k) || "").trim();
  if (g("website")) return seeOther("/rocketship/thanks"); // honeypot

  const first = g("firstName"), last = g("lastName");
  const name = `${first} ${last}`.trim();
  const phone = normalizePhone(g("phone")) || g("phone");
  const d = {
    service: g("service"), business: g("business"), city: g("city"), state: g("state"), zip: g("zip"),
    timeframe: g("timeframe"), annualSpend: g("annualSpend"), cpa: g("cpa"),
    currentCustomers: g("currentCustomers"), scaleTo: g("scaleTo"),
  };

  const jvInterest = `R0cketShip order — ${d.service || "service"}${d.business ? ` · ${d.business}` : ""}`.slice(0, 190);
  const lead = await upsertJvLead({ name, phone, zip: d.zip, state: d.state, jvInterest }).catch(() => null);

  const rows = [
    ["Service requested", d.service], ["Name", name], ["Business", d.business],
    ["Phone", phone], ["Location", [d.city, d.state, d.zip].filter(Boolean).join(", ")],
    ["Timeframe to start", d.timeframe], ["Est. annual marketing spend", d.annualSpend],
    ["Cost per new customer (avg)", d.cpa], ["Current customers", d.currentCustomers], ["Wants to scale to", d.scaleTo],
  ];
  if (lead && (lead as { id?: string }).id) {
    await db.leadNote.create({ data: { leadId: (lead as { id: string }).id, authorName: "R0cketShip order", body: "🚀 R0cketShip order form\n" + rows.map(([k, v]) => `${k}: ${v || "—"}`).join("\n") } }).catch(() => {});
  }

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111">
    <h2 style="margin:0 0 6px;color:#0a0a0a">🚀 New R0cketShip order</h2>
    <table style="border-collapse:collapse;margin-top:8px">${rows.map(([k, v]) =>
      `<tr><td style="padding:6px 14px 6px 0;color:#6b7280;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:6px 0;font-weight:600">${(v || "—").replace(/</g, "&lt;")}</td></tr>`).join("")}
    </table>
    <p style="color:#6b7280;font-size:12px;margin-top:14px">Saved to your JV file${lead && (lead as { id?: string }).id ? ` (lead ${(lead as { id: string }).id})` : ""}.</p>
  </div>`;
  sendEmail(FOUNDER_EMAIL, `🚀 R0cketShip order — ${name || phone} · ${d.service || "service"}`, html, "google_workspace").catch(() => {});

  return seeOther("/rocketship/thanks");
}
