"use client";
import { useEffect, useState } from "react";
import { MEDIGAP } from "@/lib/medigap-brand";

// Site-wide welcome popover for 1-800-MEDIGAP. Shows once per browser session on entry, routes the
// visitor by age. Suppressed on the medigap.plus app (this is the senior-brand front door only).
export default function WelcomePopover() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.location.hostname.includes("medigap.plus")) return;
      if (!sessionStorage.getItem("mg_welcome")) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    try { sessionStorage.setItem("mg_welcome", "1"); } catch {}
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-label="Welcome to 1-800-MEDIGAP">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 md:p-9 text-center shadow-2xl" style={{ color: MEDIGAP.colors.ink }}>
        <button onClick={dismiss} aria-label="Close" className="float-right -mt-3 -mr-2 text-3xl leading-none" style={{ color: MEDIGAP.colors.muted }}>×</button>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Welcome to 1-800-<span style={{ color: MEDIGAP.colors.gold }}>MEDIGAP</span>
        </h2>
        <a href={`tel:${MEDIGAP.tel}`} onClick={dismiss} className="mt-3 inline-flex items-center gap-2 text-2xl md:text-3xl font-extrabold" style={{ color: MEDIGAP.colors.brand }}>
          📞 {MEDIGAP.telDisplay}
        </a>
        <p className="mt-3 text-sm" style={{ color: MEDIGAP.colors.muted }}>How may we serve you best?</p>
        <div className="mt-7 grid gap-3">
          <a href="/private-health-insurance" onClick={dismiss} className="block rounded-2xl px-6 py-6 text-2xl font-extrabold text-white shadow-lg" style={{ background: "#ea580c" }}>
            I am Under 64
          </a>
          <a href="https://www.sunfirematrix.com/app/consumer/emp/7837904/#/" onClick={dismiss} className="block rounded-2xl px-6 py-6 text-2xl font-extrabold text-white shadow-lg" style={{ background: MEDIGAP.colors.brand }}>
            I am 64+
          </a>
        </div>
      </div>
    </div>
  );
}
