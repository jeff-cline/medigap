import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getMammoSession } from "@/lib/mammo-auth";
import { activeLocations } from "@/lib/mammo-locations";
import { MammoHeader, MammoFooter } from "@/components/mammo/Chrome";
import LocationPicker, { type PickerLoc } from "@/components/mammo/LocationPicker";

export const dynamic = "force-dynamic";

export default async function Account() {
  const s = await getMammoSession();
  if (!s) redirect("/login");

  const [acct, locs, past] = await Promise.all([
    db.mammoAccount.findUnique({ where: { id: s.id } }),
    activeLocations(),
    db.mammoBooking.findMany({ where: { userId: s.id }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  return (
    <>
      <MammoHeader />
      <main className="bg-white text-[#2E1065] min-h-[70vh]">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              {acct?.firstName ? `Right then, ${acct.firstName}.` : "Pick a time"}
            </h1>
            <form action="/api/mammo/logout" method="post">
              <button className="text-sm font-bold text-[#2E1065]/60 hover:text-[#7C3AED] py-2">Sign out</button>
            </form>
          </div>
          <p className="text-xl text-[#2E1065]/70 max-w-2xl mb-10">
            Choose a location near you. We hand you to their calendar and remember where you went so
            we can remind you next time.
          </p>

          {past.length > 0 && (
            <div className="rounded-2xl bg-[#F3EEFF] p-5 mb-10 max-w-2xl">
              <div className="text-xs font-black uppercase tracking-widest text-[#6D28D9] mb-3">Your history</div>
              <ul className="space-y-2">
                {past.map((b) => (
                  <li key={b.id} className="text-sm flex justify-between gap-4 flex-wrap">
                    <span><strong>{b.locationName}</strong> <span className="text-[#2E1065]/55">{b.locationAddr}</span></span>
                    <span className="text-[#2E1065]/50 whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleDateString("en-US")}
                      {b.remindAt ? ` · next due ${new Date(b.remindAt).toLocaleDateString("en-US")}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <LocationPicker locations={locs as unknown as PickerLoc[]} defaultZip={acct?.zip ?? ""} signedIn />

          <p className="mt-10 text-sm text-[#2E1065]/55 max-w-3xl">
            Not ready yet? <Link href="/prepare" className="font-bold text-[#6D28D9] underline">Read how to prepare</Link> —
            it takes two minutes and makes the appointment quicker.
          </p>
        </div>
      </main>
      <MammoFooter />
    </>
  );
}
