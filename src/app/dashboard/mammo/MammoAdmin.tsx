"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Loc = {
  id: string; name: string; title: string; address1: string; city: string; state: string;
  zip: string; phone: string; calendarUrl: string; imageUrl: string; serviceZips: string;
  lat: number | null; lng: number | null; notes: string; hours: string;
  requiresOrder: boolean; active: boolean; sortOrder: number;
};
type Booking = {
  id: string; name: string; email: string; phone: string;
  locationName: string; locationAddr: string; status: string;
  remindAt: string | null; createdAt: string;
};

const input = "w-full rounded-lg border px-3 py-2 text-sm";

export default function MammoAdmin({
  locations, bookings, stats,
}: { locations: Loc[]; bookings: Booking[]; stats: { accounts: number; visitors: number; bookings: number } }) {
  const router = useRouter();
  const [tab, setTab] = useState<"locations" | "bookings">("locations");
  const [draft, setDraft] = useState<Partial<Loc> | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("");

  async function save() {
    setBusy(true); setErr("");
    const r = await fetch("/api/mammo/locations", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error ?? "Could not save."); return; }
    setDraft(null); router.refresh();
  }

  async function remove(id: string) {
    setBusy(true);
    await fetch("/api/mammo/locations", {
      method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }),
    });
    setBusy(false); router.refresh();
  }

  const shown = locations.filter((l) =>
    !filter || `${l.name} ${l.city} ${l.state} ${l.zip}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <>
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        {[["Locations", locations.length], ["Bookings", stats.bookings],
          ["Accounts", stats.accounts], ["Visitors, 30d", stats.visitors]].map(([l, v]) => (
          <div key={String(l)} className="rounded-lg border border-[var(--line)] p-4">
            <div className="text-2xl font-semibold tabular-nums">{v as number}</div>
            <div className="text-xs text-[var(--muted)]">{l as string}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        {(["locations", "bookings"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold border ${tab === t ? "bg-[var(--brand)] text-white" : "border-[var(--line)]"}`}>
            {t === "locations" ? `Locations (${locations.length})` : `Bookings (${bookings.length})`}
          </button>
        ))}
      </div>

      {err && <p className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm font-semibold">{err}</p>}

      {tab === "locations" && (
        <>
          <div className="flex justify-between items-center gap-3 flex-wrap mb-4">
            <input value={filter} onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name, city, ZIP" className="rounded-lg border px-3 py-2 text-sm max-w-xs" />
            <button onClick={() => setDraft({ active: true, requiresOrder: false, sortOrder: locations.length })}
              className="btn btn-brand text-sm !py-2">Add a location</button>
          </div>

          {draft && (
            <div className="rounded-lg border-2 border-[var(--brand)] p-5 mb-6 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">Location name *</label>
                  <input className={input} value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Dallas Breast Imaging Center" />
                </div>
                <div>
                  <label className="text-xs font-semibold">Title / strapline (shown in the popup)</label>
                  <input className={input} value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Accredited Breast Imaging Center" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold">Street address</label>
                <input className={input} value={draft.address1 ?? ""} onChange={(e) => setDraft({ ...draft, address1: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold">City</label>
                  <input className={input} value={draft.city ?? ""} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold">State</label>
                  <input className={input} maxLength={2} value={draft.state ?? ""} onChange={(e) => setDraft({ ...draft, state: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <label className="text-xs font-semibold">ZIP *</label>
                  <input className={input} maxLength={5} value={draft.zip ?? ""} onChange={(e) => setDraft({ ...draft, zip: e.target.value.replace(/\D/g, "") })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">Phone</label>
                  <input className={input} value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold">Opening hours (shown in the popup)</label>
                  <input className={input} value={draft.hours ?? ""} onChange={(e) => setDraft({ ...draft, hours: e.target.value })}
                    placeholder="Mon–Fri 8–5, Sat 9–1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold">Booking calendar URL * — where &ldquo;Book now&rdquo; sends them</label>
                <input className={input} value={draft.calendarUrl ?? ""} onChange={(e) => setDraft({ ...draft, calendarUrl: e.target.value })}
                  placeholder="https://… the facility's own booking page" />
              </div>
              <div>
                <label className="text-xs font-semibold">Photo of the clinic (URL) — shown in the popup</label>
                <input className={input} value={draft.imageUrl ?? ""} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                  placeholder="https://…/clinic.jpg" />
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold">Other ZIPs served</label>
                  <input className={input} value={draft.serviceZips ?? ""} onChange={(e) => setDraft({ ...draft, serviceZips: e.target.value })}
                    placeholder="75202, 75203" />
                </div>
                <div>
                  <label className="text-xs font-semibold">Latitude (puts it on the map)</label>
                  <input className={input} value={draft.lat ?? ""} onChange={(e) => setDraft({ ...draft, lat: e.target.value === "" ? null : Number(e.target.value) })} placeholder="32.7767" />
                </div>
                <div>
                  <label className="text-xs font-semibold">Longitude</label>
                  <input className={input} value={draft.lng ?? ""} onChange={(e) => setDraft({ ...draft, lng: e.target.value === "" ? null : Number(e.target.value) })} placeholder="-96.7970" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold">Note shown to the visitor</label>
                <input className={input} value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  placeholder="Saturday appointments available" />
              </div>
              <div className="flex flex-wrap gap-5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                  <input type="checkbox" checked={draft.active !== false} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="w-4 h-4" />
                  Live on the site
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                  <input type="checkbox" checked={draft.requiresOrder === true} onChange={(e) => setDraft({ ...draft, requiresOrder: e.target.checked })} className="w-4 h-4" />
                  This state requires a written order (e.g. New York)
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button disabled={busy} onClick={save} className="btn btn-brand text-sm !py-2">{busy ? "Saving…" : "Save location"}</button>
                <button onClick={() => setDraft(null)} className="btn btn-ghost text-sm !py-2">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {shown.length === 0 && !draft && <p className="text-sm text-[var(--muted)]">No locations yet. Add the first one.</p>}
            {shown.map((l) => (
              <div key={l.id} className="rounded-lg border border-[var(--line)] p-4 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex gap-3 min-w-0">
                  {l.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold">
                      {l.name} {!l.active && <span className="text-xs text-[var(--muted)]">(hidden)</span>}
                      {l.requiresOrder && <span className="ml-2 text-[10px] font-bold uppercase bg-amber-100 text-amber-800 rounded px-2 py-0.5">order required</span>}
                    </div>
                    <div className="text-sm text-[var(--muted)]">
                      {[l.address1, l.city, [l.state, l.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                    </div>
                    <div className="text-xs mt-1">
                      {l.calendarUrl
                        ? <span className="text-emerald-700 font-semibold">calendar set</span>
                        : <span className="text-red-600 font-semibold">NO CALENDAR URL — Book now will not work</span>}
                      {l.lat != null && l.lng != null ? " · on the map" : " · not on the map"}
                      {l.imageUrl ? " · has photo" : ""}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setDraft(l)} className="btn btn-ghost text-xs !py-1.5">Edit</button>
                  <button disabled={busy} onClick={() => remove(l.id)} className="btn btn-ghost text-xs !py-1.5 text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "bookings" && (
        bookings.length === 0 ? <p className="text-sm text-[var(--muted)]">Nobody has picked a location yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr><th className="py-2 pr-4">When</th><th className="py-2 pr-4">Person</th><th className="py-2 pr-4">Contact</th><th className="py-2 pr-4">Location picked</th><th className="py-2">Next due</th></tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-[var(--line)] align-top">
                    <td className="py-2 pr-4 whitespace-nowrap text-[var(--muted)]">{new Date(b.createdAt).toLocaleDateString("en-US")}</td>
                    <td className="py-2 pr-4 font-semibold">{b.name || "—"}</td>
                    <td className="py-2 pr-4 text-[var(--muted)]"><div className="break-all">{b.email}</div>{b.phone && <div className="text-xs">{b.phone}</div>}</td>
                    <td className="py-2 pr-4"><div className="font-semibold">{b.locationName}</div><div className="text-xs text-[var(--muted)]">{b.locationAddr}</div></td>
                    <td className="py-2 whitespace-nowrap text-[var(--muted)]">{b.remindAt ? new Date(b.remindAt).toLocaleDateString("en-US") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </>
  );
}
