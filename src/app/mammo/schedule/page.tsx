import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getMammoSession } from "@/lib/mammo-auth";
import { activeLocations } from "@/lib/mammo-locations";
import { SITE } from "@/lib/mammo";
import { MammoHeader, MammoFooter } from "@/components/mammo/Chrome";
import LocationPicker, { type PickerLoc } from "@/components/mammo/LocationPicker";
import VisitorId from "@/components/mammo/VisitorId";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pick a Time — Mammo Express",
  description: "Choose a screening location near you and book a time. Create your account right here — no separate sign-up step.",
  alternates: { canonical: `${SITE}/schedule` },
};

// The scheduling page works signed OUT as well as in. Someone arriving here
// cold can pick a location, create an account inside the popup, and be handed
// to the clinic's calendar in one go — every extra page is somewhere to drop out.
export default async function Schedule() {
  const session = await getMammoSession().catch(() => null);

  const [locs, acct, past] = await Promise.all([
    activeLocations(),
    session ? db.mammoAccount.findUnique({ where: { id: session.id } }) : null,
    session
      ? db.mammoBooking.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" }, take: 6 })
      : [],
  ]);

  return (
    <>
      <VisitorId />
      <MammoHeader />
      <main className="bg-white text-[#2E1065] min-h-[70vh]">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              {acct?.firstName ? `Right then, ${acct.firstName}.` : "Pick a time"}
            </h1>
            {session && (
              <form action="/api/mammo/logout" method="post">
                <button className="text-sm font-bold text-[#2E1065]/60 hover:text-[#7C3AED] py-2">Sign out</button>
              </form>
            )}
          </div>
          <p className="text-xl text-[#2E1065]/70 max-w-2xl mb-10">
            {session
              ? "Choose a location near you. We hand you to their calendar and remember where you went so we can remind you next time."
              : "Enter your ZIP, pick a location, and create your account in the same step. We will take you straight to their calendar."}
          </p>

          {past.length > 0 && (
            <div className="rounded-2xl bg-white border-2 border-[#7C3AED]/35 p-5 mb-10 max-w-2xl">
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

          <LocationPicker
            locations={locs as unknown as PickerLoc[]}
            defaultZip={acct?.zip ?? ""}
            signedIn={Boolean(session)}
          />

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
