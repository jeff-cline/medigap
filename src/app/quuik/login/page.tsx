"use client";
import { useState } from "react";
const ORANGE = "#F5821F", INK = "#1c2128";
export default function QuuikLogin() {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pw }) });
      const j = await r.json();
      if (!r.ok || j.error) { setErr(j.error || "Login failed."); setBusy(false); return; }
      window.location.href = j.mustChangePassword ? "/change-password" : "/account";
    } catch { setErr("Network error — try again."); setBusy(false); }
  }
  const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1.5px solid #cbd2dc", borderRadius: 10, fontSize: 15, color: "#111", background: "#ffffff", marginTop: 10, outline: "none" };
  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "grid", placeItems: "center", fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", padding: 20 }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 380 }}>
        <a href="/" style={{ display: "block", textAlign: "center", marginBottom: 18 }}><img src="/quuik-assets/logo.png" alt="Quuik" style={{ height: 56 }} /></a>
        <h1 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, color: INK, margin: "0 0 4px" }}>Advertiser sign in</h1>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} autoFocus />
        <input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} style={inp} />
        {err && <div style={{ marginTop: 10, color: "#b3261e", fontSize: 14 }}>{err}</div>}
        <button type="submit" disabled={busy} style={{ width: "100%", marginTop: 14, background: ORANGE, color: "#fff", border: 0, borderRadius: 100, padding: "13px 0", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>{busy ? "Signing in…" : "Sign in"}</button>
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 13.5, color: "#6b7280" }}>New here? <a href="/join" style={{ color: ORANGE, fontWeight: 700 }}>Join the network →</a></div>
      </form>
    </div>
  );
}
