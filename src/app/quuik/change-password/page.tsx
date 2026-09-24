"use client";
import { useState } from "react";
const ORANGE = "#F5821F", INK = "#1c2128";
export default function QuuikChangePw() {
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setErr("");
    if (pw.length < 8) { setErr("Use at least 8 characters."); return; }
    if (pw !== pw2) { setErr("Passwords don't match."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
      const j = await r.json();
      if (!r.ok || j.error) { setErr(j.error || "Could not update."); setBusy(false); return; }
      const nx = new URLSearchParams(location.search).get("next") || "/account";
      window.location.href = nx.startsWith("/") ? nx : "/account";
    } catch { setErr("Network error — try again."); setBusy(false); }
  }
  const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1.5px solid #cbd2dc", borderRadius: 10, fontSize: 15, color: "#111", background: "#ffffff", marginTop: 10, outline: "none" };
  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "grid", placeItems: "center", fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", padding: 20 }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 380 }}>
        <a href="/" style={{ display: "block", textAlign: "center", marginBottom: 18 }}><img src="/quuik-assets/logo.png" alt="Quuik" style={{ height: 56 }} /></a>
        <h1 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, color: INK, margin: "0 0 4px" }}>Set your password</h1>
        <p style={{ textAlign: "center", color: "#6b7280", fontSize: 13.5, margin: 0 }}>Choose a new password to secure your account.</p>
        <input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} style={inp} autoFocus />
        <input type="password" placeholder="Confirm password" value={pw2} onChange={(e) => setPw2(e.target.value)} style={inp} />
        {err && <div style={{ marginTop: 10, color: "#b3261e", fontSize: 14 }}>{err}</div>}
        <button type="submit" disabled={busy} style={{ width: "100%", marginTop: 14, background: ORANGE, color: "#fff", border: 0, borderRadius: 100, padding: "13px 0", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>{busy ? "Saving…" : "Save & continue"}</button>
      </form>
    </div>
  );
}
