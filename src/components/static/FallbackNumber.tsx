"use client";
import { useEffect, useState } from "react";

export default function FallbackNumber() {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/static/settings").then((r) => r.json()).then((d) => setVal(d.healthFallbackNumber || "")).catch(() => {});
  }, []);

  const save = async () => {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/static/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ healthFallbackNumber: val }) });
      if (!r.ok) throw new Error();
      setMsg("Saved");
    } catch {
      setMsg("Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-end gap-2 text-sm">
      <div>
        <label className="block text-xs uppercase text-[var(--muted)] mb-1">Health-insurance fallback # (blank = route to PHI buyers)</label>
        <input className="rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1" value={val} onChange={(e) => setVal(e.target.value)} placeholder="+15551239999" />
      </div>
      <button className="btn" disabled={busy} onClick={save}>Save</button>
      {msg && <span className="text-[var(--muted)]">{msg}</span>}
    </div>
  );
}
