import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getManagerSession } from "@/lib/mammo-auth";
import { MammoHeader, MammoFooter } from "@/components/mammo/Chrome";

export const dynamic = "force-dynamic";

const since = (d: number) => new Date(Date.now() - d * 864e5);
const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "—");

// Manager view: every lead, the funnel, and a CSV to reconcile against.
// Deliberately read-only — a manager reviews, they do not edit locations or
// touch anyone's account.
export default async function ManagerDashboard() {
  const m = await getManagerSession();
  if (!m) redirect("/manager/login");

  const [bookings, leads, leads30, attempts30] = await Promise.all([
    db.mammoBooking.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    db.mammoAccount.count(),
    db.mammoAccount.count({ where: { createdAt: { gte: since(30) } } }),
    db.mammoBooking.count({ where: { createdAt: { gte: since(30) } } }),
  ]);

  return (
    <>
      <MammoHeader />
      <main className="bg-white text-[#2E1065] min-h-[70vh]">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#7C3AED] mb-1">Manager</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Leads</h1>
              <p className="text-[#2E1065]/60 mt-1 text-sm">Signed in as {m.email}</p>
            </div>
            <div className="flex gap-2">
              <a href="/api/mammo/leads.csv"
                className="rounded-xl bg-[#7C3AED] hover:bg-[#5B21B6] text-white font-black text-sm px-5 py-3 transition-colors">
                Download CSV ↓
              </a>
              <form action="/manager/logout" method="get">
                <button className="rounded-xl border-2 border-[#7C3AED]/30 hover:bg-[#F3EEFF] font-bold text-sm px-4 py-3">
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-4 mb-10">
            {[
              ["Leads, all time", String(leads)],
              ["Booked appointments", String(bookings.length)],
              ["Leads, 30 days", String(leads30)],
              ["Conversion, 30 days", pct(attempts30, leads30)],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-white border-2 border-[#7C3AED]/30 p-5">
                <div className="text-3xl font-black tabular-nums">{v}</div>
                <div className="text-xs text-[#2E1065]/60 mt-1">{l}</div>
              </div>
            ))}
          </div>

          {bookings.length === 0 ? (
            <p className="text-[#2E1065]/60">No leads yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border-2 border-[#7C3AED]/30">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-[#2E1065]/55 bg-[#F3EEFF]">
                  <tr>
                    <th className="py-3 px-4">When</th><th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Contact</th><th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Status</th><th className="py-3 px-4">Next due</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-t border-[#7C3AED]/15 align-top">
                      <td className="py-3 px-4 whitespace-nowrap text-[#2E1065]/60">{new Date(b.createdAt).toLocaleDateString("en-US")}</td>
                      <td className="py-3 px-4 font-bold">{b.name || "—"}</td>
                      <td className="py-3 px-4 text-[#2E1065]/70"><div className="break-all">{b.email}</div>{b.phone && <div className="text-xs">{b.phone}</div>}</td>
                      <td className="py-3 px-4"><div className="font-bold">{b.locationName}</div><div className="text-xs text-[#2E1065]/55">{b.locationAddr}</div></td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-xs font-black rounded-full px-2.5 py-1 bg-[#F3EEFF] text-[#5B21B6]">
                          {b.status === "appointment_attempted" ? "booked appointment" : b.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[#2E1065]/60">{b.remindAt ? new Date(b.remindAt).toLocaleDateString("en-US") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-6 text-xs text-[#2E1065]/55 max-w-3xl">
            A booked appointment is recorded when someone is handed to a clinic&rsquo;s scheduler.
            The appointment itself completes on the clinic&rsquo;s own system, so reconcile this
            against their records — that is what the CSV is for.
          </p>
        </div>
      </main>
      <MammoFooter />
    </>
  );
}
