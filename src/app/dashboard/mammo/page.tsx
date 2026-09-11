import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { allLocations } from "@/lib/mammo-locations";
import MammoAdmin from "./MammoAdmin";

export const dynamic = "force-dynamic";

// Mammo Express back office. God only — it shows consumer contact details.
export default async function MammoDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "god") redirect("/dashboard");

  const since = (d: number) => new Date(Date.now() - d * 864e5);

  const [locations, bookings, leads, attempts, leads30, attempts30, visitors30] = await Promise.all([
    allLocations(),
    db.mammoBooking.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
    // A LEAD is an account created. An APPOINTMENT ATTEMPTED is a click
    // through to a location's scheduler — the moment we hand them over.
    db.mammoAccount.count(),
    db.mammoBooking.count(),
    db.mammoAccount.count({ where: { createdAt: { gte: since(30) } } }),
    db.mammoBooking.count({ where: { createdAt: { gte: since(30) } } }),
    db.mammoVisitor.findMany({
      where: { createdAt: { gte: since(30) } },
      select: { visitorId: true }, distinct: ["visitorId"],
    }).then((r) => r.length).catch(() => 0),
  ]);

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-semibold">Mammo Express</h1>
      <p className="text-sm text-[var(--muted)] mt-1 mb-6">
        Screening locations and their booking calendars, and every hand-off the site has made.
        Add as many locations as you need — the site matches them to each visitor&rsquo;s ZIP.
      </p>
      <MammoAdmin
        locations={JSON.parse(JSON.stringify(locations))}
        bookings={JSON.parse(JSON.stringify(bookings))}
        stats={{ leads, attempts, leads30, attempts30, visitors30 }}
      />
    </div>
  );
}
