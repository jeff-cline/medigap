"use client";
import { useState } from "react";
import { EXIT } from "@/lib/exit";
import { EXIT_MONEY, exitGroups } from "@/lib/exit-taxonomy";

// Sticky top nav: clickable logo (home from every page) + group dropdowns + booking CTA.
export default function ExitNav() {
  const [open, setOpen] = useState("");
  const [mobile, setMobile] = useState(false);
  const groups = exitGroups();
  const O = EXIT.colors.orange;

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur" style={{ borderColor: EXIT.colors.border, background: "rgba(2,6,23,0.85)" }}>
      <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
        {/* LOGO — clickable to home */}
        <a href="/" className="text-lg font-black tracking-tight text-white shrink-0">Exit<span style={{ color: O }}>Optimization</span></a>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {groups.map((g) => (
            <div key={g} className="relative">
              <button onClick={() => setOpen(open === g ? "" : g)} className="px-3 py-2 font-semibold text-slate-200 hover:text-white rounded-md">{g} <span className="text-slate-500">▾</span></button>
              {open === g && (
                <div className="absolute left-0 mt-1 w-64 rounded-lg border p-1.5 shadow-2xl" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel2 }}>
                  {EXIT_MONEY.filter((m) => m.group === g).map((m) => (
                    <a key={m.slug} href={`/${m.slug}`} className="block rounded-md px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5">{m.name}</a>
                  ))}
                </div>
              )}
            </div>
          ))}
          <a href="/how-we-work" className="px-3 py-2 font-semibold text-slate-200 hover:text-white">How we work</a>
          <a href="/faq" className="px-3 py-2 font-semibold text-slate-200 hover:text-white">FAQ</a>
          <a href="/login" className="px-3 py-2 font-semibold text-slate-200 hover:text-white">Log in</a>
        </nav>

        <div className="flex items-center gap-2">
          <a href="/business-valuation-calculators" className="hidden lg:inline-flex rounded-md border px-3.5 py-2 text-sm font-bold" style={{ borderColor: O, color: EXIT.colors.orange3 }}>Access business calculators</a>
          <a href="/book" className="hidden sm:inline-flex rounded-md px-4 py-2 text-sm font-bold" style={{ background: O, color: EXIT.colors.bg }}>Book a free consultation</a>
          <button onClick={() => setMobile(!mobile)} className="md:hidden text-white px-2 py-1 border rounded-md" style={{ borderColor: EXIT.colors.border }} aria-label="Menu">☰</button>
        </div>
      </div>

      {/* click-away to close dropdowns */}
      {open && <div className="fixed inset-0 z-[-1]" onClick={() => setOpen("")} />}

      {/* MOBILE MENU */}
      {mobile && (
        <div className="md:hidden border-t px-5 py-3 space-y-3" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.bg }}>
          {groups.map((g) => (
            <div key={g}>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: EXIT.colors.orange3 }}>{g}</div>
              <div className="grid grid-cols-1 gap-0.5">
                {EXIT_MONEY.filter((m) => m.group === g).map((m) => <a key={m.slug} href={`/${m.slug}`} className="text-sm text-slate-300 py-1">{m.name}</a>)}
              </div>
            </div>
          ))}
          <div className="flex gap-3 pt-1"><a href="/how-we-work" className="text-slate-200 text-sm">How we work</a><a href="/faq" className="text-slate-200 text-sm">FAQ</a><a href="/login" className="text-slate-200 text-sm">Log in</a></div>
          <a href="/business-valuation-calculators" className="block text-center rounded-md border px-4 py-2.5 text-sm font-bold" style={{ borderColor: O, color: EXIT.colors.orange3 }}>Access business calculators</a>
          <a href="/book" className="block text-center rounded-md px-4 py-2.5 text-sm font-bold" style={{ background: O, color: EXIT.colors.bg }}>Book a free consultation</a>
        </div>
      )}
    </header>
  );
}
