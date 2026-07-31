"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EngineToggle({ current }: { current: "fluid" | "static" }) {
  const router = useRouter();
  const [engine, setEngine] = useState(current);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const flip = async (next: "fluid" | "static") => {
    if (busy || next === engine) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/static/engine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ engine: next }) });
      if (!res.ok) throw new Error(`Engine switch failed (${res.status})`);
      setEngine(next);
      router.push(next === "static" ? "/dashboard/static" : "/dashboard/u65");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] text-sm">
      <span className="text-[var(--muted)] uppercase text-xs tracking-wide">Active engine</span>
      <div className="inline-flex rounded-full border border-[var(--border)] overflow-hidden">
        <button disabled={busy} onClick={() => flip("fluid")} className={`px-3 py-1 ${engine === "fluid" ? "bg-[var(--gold)] text-black font-semibold" : ""}`}>Fluid</button>
        <button disabled={busy} onClick={() => flip("static")} className={`px-3 py-1 ${engine === "static" ? "bg-[var(--gold)] text-black font-semibold" : ""}`}>Static</button>
      </div>
      <span className="text-[10px] text-[var(--muted)]">(controls live call routing)</span>
      {err && <span className="text-[10px] text-[var(--danger)]">{err}</span>}
    </div>
  );
}
