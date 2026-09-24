import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ZIP -> coordinates, cached in the database after the first lookup.
//
// Geocoding on every keystroke would hammer Nominatim and get us blocked; a
// ZIP's centroid never moves, so one lookup per ZIP is all that is ever needed.
export async function GET(req: Request) {
  const zip = (new URL(req.url).searchParams.get("z") ?? "").replace(/\D/g, "").slice(0, 5);
  if (!/^\d{5}$/.test(zip)) return NextResponse.json({ error: "Five digits, please." }, { status: 400 });

  const cached = await db.mammoZip.findUnique({ where: { zip } }).catch(() => null);
  if (cached) {
    return NextResponse.json({ zip, lat: cached.lat, lng: cached.lng, city: cached.city, state: cached.state });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&postalcode=${zip}`,
      { headers: { "User-Agent": "MammoExpress/1.0 (scheduling directory; jeff.cline@me.com)" },
        signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return NextResponse.json({ error: "lookup-failed" }, { status: 502 });
    const j = await res.json();
    if (!j?.[0]) return NextResponse.json({ error: "unknown-zip" }, { status: 404 });

    const lat = Number(j[0].lat), lng = Number(j[0].lon);
    const parts = String(j[0].display_name ?? "").split(",").map((x: string) => x.trim());
    const city = parts[0] ?? "";
    const state = parts.length > 2 ? parts[parts.length - 3] : "";

    await db.mammoZip.create({ data: { zip, lat, lng, city, state } }).catch(() => {});
    return NextResponse.json({ zip, lat, lng, city, state });
  } catch {
    return NextResponse.json({ error: "lookup-failed" }, { status: 502 });
  }
}
