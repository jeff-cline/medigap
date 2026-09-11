import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const s = (v: unknown, n = 300) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const num = (v: unknown) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v));

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "god") return NextResponse.json({ error: "God only" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const name = s(b.name, 160);
  const zip = s(b.zip, 5).replace(/\D/g, "");
  if (!name) return NextResponse.json({ error: "Give the location a name." }, { status: 400 });
  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: "A five-digit ZIP is required — it is how visitors are matched." }, { status: 400 });
  }
  for (const [field, val] of [["calendar URL", s(b.calendarUrl, 500)], ["photo URL", s(b.imageUrl, 500)]] as const) {
    if (val && !/^https?:\/\//i.test(val)) {
      return NextResponse.json({ error: `The ${field} must start with http:// or https://` }, { status: 400 });
    }
  }

  const data = {
    name, title: s(b.title, 160), address1: s(b.address1, 200), city: s(b.city, 80),
    state: s(b.state, 2).toUpperCase(), zip, phone: s(b.phone, 40),
    calendarUrl: s(b.calendarUrl, 500), imageUrl: s(b.imageUrl, 500),
    serviceZips: (s(b.serviceZips, 2000).match(/\d{5}/g) ?? []).join(","),
    lat: num(b.lat), lng: num(b.lng), notes: s(b.notes, 300), hours: s(b.hours, 120),
    requiresOrder: b.requiresOrder === true, active: b.active !== false,
    sortOrder: Number(b.sortOrder) || 0,
  };

  if (b.id) await db.mammoLocation.update({ where: { id: String(b.id) }, data });
  else await db.mammoLocation.create({ data });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "god") return NextResponse.json({ error: "God only" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  // Bookings keep a name/address snapshot, so history survives this.
  await db.mammoLocation.delete({ where: { id: String(b.id ?? "") } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
