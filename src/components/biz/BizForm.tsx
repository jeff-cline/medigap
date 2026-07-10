"use client";
import { useEffect, useState } from "react";
import { INTERESTS, INVESTOR_TYPES, FOOTER_ROLES, BIZ } from "@/lib/biz";

const C = BIZ.colors;

export default function BizForm() {
  const [form, setForm] = useState({ name: "", company: "", website: "", phone: "", email: "" });
  const [interests, setInterests] = useState<string[]>([]);
  const [investorType, setInvestorType] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Footer links / deep links pre-select the right interest (?role=investor|carrier|agent|…).
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("role") || "";
    const fr = FOOTER_ROLES.find((x) => x.role === r);
    if (fr) { setRole(r); setInterests([fr.preselect]); if (fr.investorType) setInvestorType(fr.investorType); }
  }, []);

  const toggle = (k: string) => setInterests((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  const investing = interests.includes("investing");

  const inp = { width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.panel2, color: C.ink, fontSize: 16 } as React.CSSProperties;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name && !form.phone && !form.email) { setErr("Please add at least a name, phone, or email."); return; }
    if (!interests.length) { setErr("Select at least one option so we route you correctly."); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/biz/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, interests, investorType: investing ? investorType : "", role }) });
      const d = await r.json();
      if (d.ok) { window.location.href = "/book"; return; }
      setErr(d.error || "Something went wrong. Please try again."); setBusy(false);
    } catch { setErr("Network error. Please try again."); setBusy(false); }
  }

  return (
    <form onSubmit={submit} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 18, padding: 24 }}>
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input style={inp} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input style={inp} placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </div>
        <input style={inp} placeholder="Company website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input style={inp} type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input style={inp} type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
      </div>

      <div style={{ marginTop: 18, fontSize: 13, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.gold }}>Select all that apply</div>
      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
        {INTERESTS.map((it) => (
          <label key={it.key} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 13px", borderRadius: 10, border: `1px solid ${interests.includes(it.key) ? C.gold : C.line}`, background: interests.includes(it.key) ? "rgba(227,178,60,.08)" : C.panel2, cursor: "pointer" }}>
            <input type="checkbox" checked={interests.includes(it.key)} onChange={() => toggle(it.key)} style={{ marginTop: 3, width: 18, height: 18, accentColor: C.gold }} />
            <span style={{ fontSize: 14.5, color: C.ink }}>{it.label}</span>
          </label>
        ))}
      </div>

      {investing && (
        <div style={{ marginTop: 14, padding: 16, borderRadius: 12, border: `1px solid ${C.gold}`, background: "rgba(227,178,60,.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.goldSoft }}>To route you to the right desk, which best describes you?</div>
          <div style={{ marginTop: 10, display: "grid", gap: 7 }}>
            {INVESTOR_TYPES.map((t) => (
              <label key={t} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14.5, color: C.ink, cursor: "pointer" }}>
                <input type="radio" name="investorType" checked={investorType === t} onChange={() => setInvestorType(t)} style={{ width: 17, height: 17, accentColor: C.gold }} />
                {t}
              </label>
            ))}
          </div>
        </div>
      )}

      {err && <div style={{ marginTop: 12, color: "#ff7a7a", fontSize: 14 }}>{err}</div>}

      <button disabled={busy} style={{ marginTop: 18, width: "100%", padding: "16px", border: 0, borderRadius: 12, fontSize: 19, fontWeight: 900, letterSpacing: ".02em", color: "#1a0b00", cursor: "pointer", background: `linear-gradient(90deg, ${C.disrupt2}, ${C.disrupt})`, boxShadow: "0 8px 30px rgba(255,90,31,.35)" }}>
        {busy ? "Submitting…" : "DISRUPT NOW →"}
      </button>
      <div style={{ marginTop: 8, fontSize: 12, color: C.muted, textAlign: "center" }}>Confidential. Routes directly to the founder — you'll be invited to book a private conversation.</div>
    </form>
  );
}
