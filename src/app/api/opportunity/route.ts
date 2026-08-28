import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Business / partnership inquiries from the 1-800-MEDIGAP welcome popover.
// Every submission alerts the founder + Darlin Brown (Zapmail).
const NOTIFY = "jeff.cline@me.com, Darlin_Brown@outlook.com";

const PERSONAS: Record<string, string> = {
  agent: "Agent",
  carrier: "Carrier",
  investor: "Investor",
  network: "Network / Platform",
  strategic: "Strategic Partner",
  advertiser: "Advertiser",
};

const esc = (s: string) => String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));

  // Honeypot — real users never fill "website". Silently accept + drop bots.
  if (String(b.website || "").trim()) return NextResponse.json({ ok: true });

  const persona = String(b.persona || "").toLowerCase();
  const label = PERSONAS[persona];
  if (!label) return NextResponse.json({ error: "Unknown opportunity." }, { status: 400 });

  const step = String(b.step || "1"); // "1" (contact captured) | "final" (full detail)
  const firstName = String(b.firstName || "").trim().slice(0, 80);
  const lastName = String(b.lastName || "").trim().slice(0, 80);
  const phone = String(b.phone || "").trim().slice(0, 40);
  const email = String(b.email || "").trim().slice(0, 160);
  const name = `${firstName} ${lastName}`.trim();

  if (!firstName || !lastName) return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });

  // Step 2/3 detail (only present on the final submit)
  const company = String(b.company || "").trim().slice(0, 160);
  const interests: string[] = Array.isArray(b.interests) ? b.interests.map((x: unknown) => String(x).slice(0, 60)).slice(0, 12) : [];
  const smidStates = String(b.smidStates || "").trim().slice(0, 200);
  const hasSmid = Boolean(b.hasSmid);
  const budget = String(b.budget || "").trim().slice(0, 40);
  const startDate = String(b.startDate || "").trim().slice(0, 40);

  // Best-effort CRM capture (never blocks the flow).
  db.lead.create({
    data: {
      name, email, phone, vertical: "opportunity", source: "opportunity",
      jvInterest: persona,
      tags: JSON.stringify([
        "opportunity", `persona:${persona}`,
        ...(company ? [`company:${company}`] : []),
        ...interests.map((i) => `interest:${i}`),
        ...(budget ? [`budget:${budget}`] : []),
        ...(hasSmid ? ["smid:yes"] : []),
        ...(smidStates ? [`states:${smidStates}`] : []),
        ...(startDate ? [`start:${startDate}`] : []),
      ]),
    },
  }).catch(() => {});

  const detail = step === "final";
  const rows: string[] = [
    `<tr><td style="padding:4px 10px;color:#667"><b>Opportunity</b></td><td style="padding:4px 10px">${esc(label)}</td></tr>`,
    `<tr><td style="padding:4px 10px;color:#667"><b>Name</b></td><td style="padding:4px 10px">${esc(name)}</td></tr>`,
    `<tr><td style="padding:4px 10px;color:#667"><b>Email</b></td><td style="padding:4px 10px"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>`,
    `<tr><td style="padding:4px 10px;color:#667"><b>Phone</b></td><td style="padding:4px 10px">${esc(phone) || "—"}</td></tr>`,
  ];
  if (detail) {
    rows.push(
      `<tr><td style="padding:4px 10px;color:#667"><b>Company</b></td><td style="padding:4px 10px">${esc(company) || "—"}</td></tr>`,
      `<tr><td style="padding:4px 10px;color:#667"><b>Interested in</b></td><td style="padding:4px 10px">${interests.length ? interests.map(esc).join(", ") : "—"}</td></tr>`,
      `<tr><td style="padding:4px 10px;color:#667"><b>Approved SMID</b></td><td style="padding:4px 10px">${hasSmid ? "Yes" : "No"}${smidStates ? ` — ${esc(smidStates)}` : ""}</td></tr>`,
      `<tr><td style="padding:4px 10px;color:#667"><b>Budget</b></td><td style="padding:4px 10px">${esc(budget) || "—"}</td></tr>`,
      `<tr><td style="padding:4px 10px;color:#667"><b>Wants to start</b></td><td style="padding:4px 10px">${esc(startDate) || "—"}</td></tr>`,
    );
  }
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#0f1720">
    <h2 style="margin:0 0 4px">🤝 1-800-MEDIGAP ${esc(label)} inquiry${detail ? " — complete" : " — new contact"}</h2>
    <p style="margin:0 0 12px;color:#667">${detail ? "Full submission below." : "Contact captured (steps 2–3 may still be in progress)."}</p>
    <table style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px">${rows.join("")}</table>
  </div>`;
  const subject = `1-800-MEDIGAP ${label} inquiry${detail ? " (complete)" : ""} — ${name}`;
  const text = `1-800-MEDIGAP ${label} inquiry | ${name} | ${email} | ${phone || "no phone"}` +
    (detail ? ` | company:${company} | interests:${interests.join("/")} | smid:${hasSmid ? "yes" : "no"} ${smidStates} | budget:${budget} | start:${startDate}` : "");

  const send = sendEmail(NOTIFY, subject, html, "zapmail", { text });
  if (b._test) { const r = await send; return NextResponse.json({ ok: true, notify: r }); }
  send.catch(() => {});
  return NextResponse.json({ ok: true });
}
