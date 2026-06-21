"use client";
import { useState } from "react";
import JvForm from "./JvForm";

// Sitewide "Book a call with founder" floating button → pops a form (we capture their
// info into the JV CRM under "Book a call", then route them to the founder's Calendly).
export default function FounderCTA() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 btn btn-brand shadow-lg text-sm"
        aria-label="Book a call with the founder"
      >
        📅 Book a call with founder
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-white font-semibold">Book a call with the founder</div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-xl leading-none">×</button>
            </div>
            <JvForm bookCall cta="Book my call" />
          </div>
        </div>
      )}
    </>
  );
}
