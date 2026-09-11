"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type PickerLoc = {
  id: string; name: string; title: string; address1: string; city: string; state: string;
  zip: string; phone: string; imageUrl: string; serviceZips: string; hours: string;
  notes: string; requiresOrder: boolean; lat: number | null; lng: number | null;
};

const full = (l: PickerLoc) =>
  [l.address1, l.city, [l.state, l.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");

function rank(locs: PickerLoc[], zip: string): PickerLoc[] {
  const z = zip.replace(/\D/g, "").slice(0, 5);
  if (!z) return locs;
  const score = (l: PickerLoc) => {
    if (l.zip === z) return 0;
    if ((l.serviceZips || "").match(/\d{5}/g)?.includes(z)) return 1;
    let shared = 0;
    for (let i = 0; i < 5 && l.zip[i] === z[i]; i++) shared++;
    return 10 - shared;
  };
  return [...locs].sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name));
}

export default function LocationPicker({
  locations, defaultZip = "", signedIn,
}: { locations: PickerLoc[]; defaultZip?: string; signedIn: boolean }) {
  const [zip, setZip] = useState(defaultZip);
  const [open, setOpen] = useState<PickerLoc | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [signup, setSignup] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markers = useRef<Record<string, unknown>>({});

  const ordered = useMemo(() => rank(locations, zip), [locations, zip]);
  const mappable = useMemo(() => locations.filter((l) => l.lat != null && l.lng != null), [locations]);

  // Leaflet + OpenStreetMap: free, no API key, no usage terms to breach. The
  // list below is a complete fallback if the CDN fails, so the map is an
  // enhancement rather than a dependency.
  useEffect(() => {
    if (!mappable.length || !mapEl.current || mapRef.current) return;
    let cancelled = false;
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    js.async = true;
    js.onload = () => {
      if (cancelled || !mapEl.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      if (!L) return;
      const map = L.map(mapEl.current, { scrollWheelZoom: false });
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors", maxZoom: 18,
      }).addTo(map);
      const ms = mappable.map((l) => {
        const m = L.marker([l.lat as number, l.lng as number]).addTo(map);
        m.on("click", () => setOpen(l));           // pin opens the same popup
        markers.current[l.id] = m;
        return m;
      });
      map.fitBounds(L.featureGroup(ms).getBounds().pad(0.25));
    };
    document.head.appendChild(js);
    return () => { cancelled = true; };
  }, [mappable]);

  // Close on Escape — a modal that traps you is worse than no modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  async function book(l: PickerLoc) {
    const res = await fetch("/api/mammo/book", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ locationId: l.id, zip }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); setErr(j.error ?? "Something went wrong. Please try again."); return; }
    if (!j.calendarUrl) {
      setBusy(false);
      setErr("That location has not published its calendar yet — please call them, or pick another.");
      return;
    }
    // Booking is recorded before we hand over, so a lead that reaches the
    // clinic's portal is always counted even if they never come back.
    window.location.href = j.calendarUrl;
  }

  /** Create the account, then book, then hand off — one submit, no detour. */
  async function signUpAndBook(l: PickerLoc) {
    setBusy(true); setErr("");
    const res = await fetch("/api/mammo/register", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...signup, zip, emailOptIn, smsOptIn }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setErr(j.existing
        ? "That email already has an account — sign in and we will take you straight there."
        : (j.error ?? "Could not create your account."));
      return;
    }
    await book(l);
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1.15fr] gap-8 items-start">
      <div>
        <label htmlFor="zip" className="block text-sm font-black mb-2 text-[#2E1065]">Your ZIP code</label>
        <input id="zip" inputMode="numeric" maxLength={5} value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
          placeholder="75201"
          className="w-full rounded-2xl border-2 border-[#7C3AED]/30 focus:border-[#7C3AED] focus:outline-none px-5 py-4 text-lg font-bold tabular-nums text-[#2E1065]" />
        <p className="text-xs text-[#2E1065]/55 mt-2">Closest first. You can pick any of them.</p>

        {ordered.length === 0 ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-[#2E1065]/15 p-8 text-center">
            <p className="font-bold text-[#2E1065]/70">No locations yet.</p>
            <p className="text-sm text-[#2E1065]/55 mt-1">
              Create an account and we will tell you the moment one opens near you.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {ordered.map((l) => (
              <li key={l.id}>
                <button type="button" onClick={() => setOpen(l)}
                  className="w-full text-left rounded-2xl border-2 border-[#7C3AED]/30 hover:border-[#7C3AED]/60 hover:shadow-md bg-white p-4 transition-all flex gap-4">
                  {l.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-black text-[#2E1065] leading-tight">{l.name}</span>
                    {l.title && <span className="block text-xs font-bold text-[#7C3AED] mt-0.5">{l.title}</span>}
                    <span className="block text-sm text-[#2E1065]/65 mt-1">{full(l)}</span>
                    {l.requiresOrder && (
                      <span className="inline-block mt-2 text-[10px] font-black uppercase bg-[#F3EEFF] text-[#5B21B6] rounded px-2 py-0.5">
                        written order required
                      </span>
                    )}
                  </span>
                  <span className="self-center text-[#7C3AED] font-black shrink-0">›</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="lg:sticky lg:top-24">
        {mappable.length > 0 ? (
          <div ref={mapEl} className="w-full h-[520px] rounded-3xl overflow-hidden border-2 border-[#7C3AED]/30 bg-[#F3EEFF]"
            role="application" aria-label="Map of screening locations" />
        ) : (
          <div className="w-full rounded-3xl border-2 border-dashed border-[#2E1065]/15 bg-[#F3EEFF] p-10 text-center">
            <p className="font-bold text-[#2E1065]/70">Map appears once locations have coordinates.</p>
          </div>
        )}
      </div>

      {/* ---------------- the popup ---------------- */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          role="dialog" aria-modal="true" aria-labelledby="loc-title">
          <div className="absolute inset-0 bg-[#2E1065]/60 backdrop-blur-sm" onClick={() => setOpen(null)} />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <button onClick={() => setOpen(null)} aria-label="Close"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#2E1065] font-black grid place-items-center shadow">
              ✕
            </button>

            {open.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={open.imageUrl} alt={open.name} className="w-full h-52 object-cover rounded-t-3xl" />
            ) : (
              <div className="w-full h-32 rounded-t-3xl bg-gradient-to-br from-[#7C3AED] to-[#2E1065]" />
            )}

            <div className="p-6 sm:p-7">
              {open.title && (
                <p className="text-xs font-black uppercase tracking-widest text-[#7C3AED] mb-1">{open.title}</p>
              )}
              <h2 id="loc-title" className="text-2xl font-black text-[#2E1065] leading-tight mb-3">{open.name}</h2>

              <p className="text-[#2E1065]/75 mb-1">{full(open)}</p>
              {open.phone && (
                <a href={`tel:${open.phone}`} className="font-bold text-[#6D28D9] hover:underline">{open.phone}</a>
              )}
              {open.hours && <p className="text-sm text-[#2E1065]/60 mt-2">{open.hours}</p>}
              {open.notes && <p className="text-sm text-[#2E1065]/70 mt-3">{open.notes}</p>}

              {open.lat != null && open.lng != null && (
                <a href={`https://www.openstreetmap.org/?mlat=${open.lat}&mlon=${open.lng}#map=16/${open.lat}/${open.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-4 text-sm font-bold text-[#6D28D9] underline">
                  See it on the map ↗
                </a>
              )}

              {open.requiresOrder && (
                <p className="mt-5 rounded-xl bg-white border-2 border-[#7C3AED]/50 px-4 py-3 text-sm font-bold text-[#5B21B6]">
                  This state requires a written order even for screening. Call ahead — the facility’s
                  radiologist can often write it.
                </p>
              )}

              {err && <p className="mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-bold">{err}</p>}

              <div className="mt-6">
                {signedIn ? (
                  <button onClick={() => book(open)} disabled={busy}
                    className="w-full rounded-2xl bg-[#7C3AED] hover:bg-[#5B21B6] disabled:opacity-60 text-white font-black py-4 text-lg transition-colors">
                    {busy ? "One moment…" : "Book now →"}
                  </button>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); signUpAndBook(open); }} className="space-y-3">
                    <p className="text-sm font-black text-[#2E1065]">
                      Create your account and we will take you straight to their calendar.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <input required placeholder="First name" autoComplete="given-name"
                        value={signup.firstName} onChange={(e) => setSignup({ ...signup, firstName: e.target.value })} />
                      <input required placeholder="Last name" autoComplete="family-name"
                        value={signup.lastName} onChange={(e) => setSignup({ ...signup, lastName: e.target.value })} />
                    </div>
                    <input required type="email" placeholder="Email" autoComplete="email"
                      value={signup.email} onChange={(e) => setSignup({ ...signup, email: e.target.value })} />
                    <input placeholder="Mobile number" autoComplete="tel"
                      value={signup.phone} onChange={(e) => setSignup({ ...signup, phone: e.target.value })} />
                    <input required type="password" minLength={9} placeholder="Password (9+ characters)" autoComplete="new-password"
                      value={signup.password} onChange={(e) => setSignup({ ...signup, password: e.target.value })} />

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={emailOptIn} onChange={(e) => setEmailOptIn(e.target.checked)} />
                      <span className="text-xs text-[#2E1065]/80">Email me when my next screening is due.</span>
                    </label>
                    {/* Unticked and separate: consent has to be express and unbundled. */}
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} />
                      <span className="text-xs text-[#2E1065]/80">
                        Text me reminders too. Reply STOP to cancel. Message and data rates may apply.
                      </span>
                    </label>

                    <button type="submit" disabled={busy}
                      className="w-full rounded-2xl bg-[#7C3AED] hover:bg-[#5B21B6] disabled:opacity-60 text-white font-black py-4 text-lg transition-colors">
                      {busy ? "One moment…" : "Create account & book →"}
                    </button>
                    <p className="text-center text-xs text-[#2E1065]/60">
                      Already have an account? <a href="/login" className="font-bold text-[#6D28D9] underline">Sign in</a>
                    </p>
                  </form>
                )}
                <p className="text-xs text-[#2E1065]/50 mt-3 text-center">
                  Takes you to this location’s own calendar to choose your time.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
