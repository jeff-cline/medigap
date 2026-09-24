import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardForm } from "@/lib/form-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Step one of signup. Recorded immediately so an abandoned form is still a
// lead — we know who they are and where they are even if they never set a
// password. Upsert by email so going back and forth does not duplicate them.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const s = (v: unknown, n = 120) => (typeof v === "string" ? v.trim().slice(0, n) : "");

  const gate = await guardForm(req, "mammo_lead", b, {
    names: [s(b.firstName), s(b.lastName)],
    email: s(b.email, 160), phone: s(b.phone, 40),
  });
  if (gate.blocked) return gate.response;

  const email = s(b.email, 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const data = {
    firstName: s(b.firstName), lastName: s(b.lastName),
    phone: s(b.phone, 40), zip: s(b.zip, 5).replace(/\D/g, ""),
    outOfArea: b.outOfArea === true,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
  };

  await db.mammoLead.upsert({
    where: { email },
    // Never downgrade the stage — someone who already booked and comes back to
    // the form is still a booked lead.
    update: data,
    create: { email, ...data },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
