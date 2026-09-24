"use client";

import { useEffect, useState, useCallback } from "react";
import QualifyForm from "./QualifyForm";

// Opens the qualification form in a dialog.
//
// Why this exists: the CTA used to be an anchor to #qualify. On a desktop the
// form is already on screen beside the headline, so clicking the button
// scrolled by zero pixels and appeared to do nothing at all. A button that
// visibly does nothing is worse than no button.
//
// Any element with [data-qualify] opens it, so the header CTA, the hero button
// and anything added later all work without wiring each one up.
export default function QualifyModal({ slug = "", reason = "" }: { slug?: string; reason?: string }) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    // Delegated click handling, captured at the document so it also covers
    // markup rendered by server components.
    function onClick(e: MouseEvent) {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-qualify]");
      if (!el) return;
      e.preventDefault();
      setOpen(true);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Stop the page scrolling behind the dialog.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="eq-modal" role="dialog" aria-modal="true" aria-label="See what you qualify for"
         onClick={close}>
      <div className="eq-modal-inner" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="eq-modal-close" onClick={close} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
        <QualifyForm slug={slug} reason={reason} autoFocus onDone={close} />
      </div>
    </div>
  );
}
