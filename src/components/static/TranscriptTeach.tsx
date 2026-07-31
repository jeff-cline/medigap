"use client";
import { useState } from "react";

// Wraps transcript content: highlight any phrase → a floating button to teach the agent a
// response for it (opens Agent Training with the phrase prefilled as a trigger).
export default function TranscriptTeach({ children }: { children: React.ReactNode }) {
  const [sel, setSel] = useState("");

  const capture = () => {
    const raw = typeof window !== "undefined" ? window.getSelection()?.toString() ?? "" : "";
    setSel(raw.replace(/\s+/g, " ").trim().slice(0, 80));
  };

  return (
    <div onMouseUp={capture} className="relative">
      {children}
      {sel && (
        <div className="sticky bottom-3 z-10 flex justify-center mt-3">
          <a
            href={`/dashboard/static/training?trigger=${encodeURIComponent(sel)}`}
            className="rounded-full bg-[color:#1f6feb] hover:bg-[color:#388bfd] text-white text-sm font-semibold px-4 py-2 shadow-lg"
          >
            🎓 Teach a response for “{sel.length > 32 ? sel.slice(0, 32) + "…" : sel}”
          </a>
        </div>
      )}
    </div>
  );
}
