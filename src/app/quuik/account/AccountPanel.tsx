"use client";
import { useState } from "react";
const ORANGE = "#F5821F", LINE = "#e6e6e6";

export default function AccountPanel(props: { mode: "logout" | "edit"; moneyWord?: string; adjacent?: string; supporting?: string; bidDollars?: string }) {
  if (props.mode === "logout") {
    return <button onClick={async () => { try { await fetch("/api/auth/logout", { method: "POST" }); } catch {} window.location.href = "/"; }} style={{ background: "transparent", border: `1px solid ${LINE}`, borderRadius: 100, padding: "7px 15px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#1c2128" }}>Log out</button>;
  }
  const [adjacent, setAdjacent] = useState(props.adjacent || "");
  const [supporting, setSupporting] = useState(props.supporting || "");
  const [bid, setBid] = useState(props.bidDollars || "");
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [err, setErr] = useState("");
  const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1.5px solid #cbd2dc", borderRadius: 9, fontSize: 14, color: "#111", background: "#ffffff", outline: "none" };
  const lab: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#6b7280", margin: "0 0 5px", display: "block" };
  async function save() {
    setBusy(true); setErr(""); setDone(false);
    try {
      const r = await fetch("/api/quuik/account/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adjacent, supporting, bidCents: Math.round(parseFloat(bid || "0") * 100) }) });
      const j = await r.json();
      if (!r.ok || j.error) { setErr(j.error || "Could not save."); } else { setDone(true); setTimeout(() => setDone(false), 2000); }
    } catch { setErr("Network error."); }
    setBusy(false);
  }
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label><span style={lab}>Adjacent words (comma-separated)</span><input value={adjacent} onChange={(e) => setAdjacent(e.target.value)} style={inp} placeholder="turning 65, plan g" /></label>
        <label><span style={lab}>Supporting words</span><input value={supporting} onChange={(e) => setSupporting(e.target.value)} style={inp} placeholder="premium, broker" /></label>
      </div>
      <label style={{ maxWidth: 220 }}><span style={lab}>Your bid ($ / click)</span><input value={bid} onChange={(e) => setBid(e.target.value)} inputMode="decimal" style={inp} /></label>
      {err && <div style={{ color: "#b3261e", fontSize: 13 }}>{err}</div>}
      <div><button onClick={save} disabled={busy} style={{ background: done ? "#12a150" : ORANGE, color: "#fff", border: 0, borderRadius: 100, padding: "11px 24px", fontSize: 14.5, fontWeight: 800, cursor: "pointer" }}>{busy ? "Saving…" : done ? "✓ Saved" : "Save changes"}</button></div>
    </div>
  );
}
