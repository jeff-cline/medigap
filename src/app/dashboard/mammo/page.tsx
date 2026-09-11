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

  const [locations, bookings, accounts, visitors] = await Promise.all([
    allLocations(),
    db.mammoBooking.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
    db.mammoAccount.count(),
    db.mammoVisitor.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 864e5) } },
      select: { visitorId: true },
      distinct: ["visitorId"],
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
        stats={{ accounts, visitors, bookings: bookings.length }}
      />
    </div>
  );
}
