import { NextRequest, NextResponse } from "next/server";
import { upsertJvLead, FOUNDER, interestLabel } from "@/lib/jv";
import { sendEmail } from "@/lib/email";

// Public intake for ALL 1-800-MEDIGAP partner/opportunity CTAs. Every lead lands in
// the founder's personal JV CRM (tagged jv-pe-vc-op). "Book a call" also emails the
// founder via Zapmail and hands back the Calendly link to redirect to.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim();
  const phone = String(b.phone || "").trim();
  const email = String(b.email || "").trim();
  const interest = String(b.interest || b.jvInterest || "").trim();
  if (!name && !phone && !email) return NextResponse.json({ error: "Tell us how to reach you." }, { status: 400 });

  const lead = await upsertJvLead({
    name, phone, email,
    zip: String(b.zip || "").trim(), state: String(b.state || "").trim(),
    jvInterest: interest, source: "1-800-MEDIGAP", notes: String(b.notes || "").trim(),
  });

  const isBooking = interest === "book_call" || b.bookCall === true;

  // Alert the founder of every new opportunity (Zapmail, so it never touches the consumer transactional inbox).
  const subject = isBooking ? "1-800-MEDIGAP Calander Booked" : `1-800-MEDIGAP New ${interestLabel(interest)} lead`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5">
    <h2 style="margin:0 0 8px">${isBooking ? "📅 Call booking" : "🤝 New JV lead"}</h2>
    <p><b>${name || "(no name)"}</b></p>
    <p>Interest: <b>${interestLabel(interest)}</b><br>
    Phone: ${phone || "—"}<br>Email: ${email || "—"}<br>
    ${b.zip ? `ZIP: ${b.zip}<br>` : ""}${b.state ? `State: ${b.state}<br>` : ""}
    ${b.notes ? `Notes: ${String(b.notes)}<br>` : ""}</p>
    <p>Open in your JV CRM: <a href="https://medigap.plus/dashboard/jv/${lead.id}">manage this deal →</a></p>
    ${isBooking ? `<p>They're being sent to your Calendly: ${FOUNDER.calendly}</p>` : ""}
  </div>`;
  sendEmail(FOUNDER.email, subject, html, "zapmail").catch(() => {});

  return NextResponse.json({ ok: true, id: lead.id, calendly: isBooking ? FOUNDER.calendly : null });
}
