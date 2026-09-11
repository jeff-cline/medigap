import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getManagerSession } from "@/lib/mammo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** RFC4180 quoting, and a guard against spreadsheet formula injection. */
function cell(v: unknown): string {
  let s = v == null ? "" : String(v);
  // A leading =, +, - or @ makes Excel treat the cell as a formula. Leads come
  // from a public form, so that is an injection vector, not a curiosity.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

// God or a manager. Managers exist to reconcile, and reconciling means a
// spreadsheet.
export async function GET() {
  const [god, mgr] = await Promise.all([getSession(), getManagerSession()]);
  const isGod = god?.role === "god";
  if (!isGod && !mgr) return new Response("Unauthorized", { status: 401 });

  const rows = await db.mammoBooking.findMany({ orderBy: { createdAt: "desc" }, take: 50_000 });

  const header = [
    "booking_id", "created_at", "status", "name", "email", "phone",
    "zip", "location", "location_address", "next_due",
  ];
  const body = rows.map((r) => [
    r.id,
    r.createdAt.toISOString(),
    r.status,
    r.name,
    r.email,
    r.phone,
    r.zip,
    r.locationName,
    r.locationAddr,
    r.remindAt ? r.remindAt.toISOString().slice(0, 10) : "",
  ].map(cell).join(","));

  const csv = [header.map(cell).join(","), ...body].join("\r\n") + "\r\n";
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="mammo-express-leads-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
