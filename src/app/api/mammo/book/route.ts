import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMammoSession } from "@/lib/mammo-auth";
import { fullAddress } from "@/lib/mammo-locations";
import { guardForm } from "@/lib/form-guard";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOTIFY = "jeff.cline@me.com";

// Records the hand-off to a location's own calendar: who, which location, when.
// No clinical detail — this is a scheduling front door, not a medical record.
export async function POST(req: NextRequest) {
  const s = await getMammoSession();
  if (!s) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const gate = await guardForm(req, "mammo_book", b, { email: s.email });
  if (gate.blocked) return gate.response;

  const loc = await db.mammoLocation.findUnique({ where: { id: String(b.locationId ?? "") } });
  if (!loc || !loc.active) {
    return NextResponse.json({ error: "That location is not available." }, { status: 400 });
  }

  const acct = await db.mammoAccount.findUnique({ where: { id: s.id } });
  const name = [acct?.firstName, acct?.lastName].filter(Boolean).join(" ") || s.email;
  const addr = fullAddress(loc);
  const months = Number(b.remindMonths) === 24 ? 24 : 12;
  const remindAt = new Date();
  remindAt.setMonth(remindAt.getMonth() + months);

  const booking = await db.mammoBooking.create({
    data: {
      userId: s.id, locationId: loc.id,
      locationName: loc.name, locationAddr: addr,
      name, email: s.email, phone: acct?.phone ?? "",
      zip: String(b.zip ?? "").slice(0, 10),
      remindAt,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
      userAgent: (req.headers.get("user-agent") ?? "").slice(0, 300),
    },
  });

  // Google Workspace rather than the Zapmail pool: this is a transactional
  // notification to the owner and needs to land in an inbox, not a cold-outreach
  // mailbox that trains spam filters.
  await db.mammoLead.updateMany({ where: { email: s.email }, data: { stage: "booked" } }).catch(() => {});

  sendEmail(
    NOTIFY,
    "Mammo Express — someone picked a location",
    [
      `<b>${name}</b> — ${s.email}${acct?.phone ? ` · ${acct.phone}` : ""}`,
      `Location: <b>${loc.name}</b>`,
      `Address: ${addr}`,
      `Reminder set for ${months} months`,
    ].join("<br>"),
  ).catch(() => {});

  return NextResponse.json({
    ok: true,
    bookingId: booking.id,
    calendarUrl: loc.calendarUrl || null,
    requiresOrder: loc.requiresOrder,
  });
}
