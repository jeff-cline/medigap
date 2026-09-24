"use client";
import { useState } from "react";

const ORANGE = "#F5821F", INK = "#000000", MUT = "#6b7280", LINE = "#e6e6e6";
type CpcRow = { keyword: string; cpc: number; volume: number | null; source: string };
type JoinRes = { ok?: boolean; error?: string; email?: string; tempPassword?: string; baseCpc?: number; cpc?: { rows: CpcRow[]; base: number } };

const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "11px 13px", border: "1.5px solid #cbd2dc", borderRadius: 10, fontSize: 15, color: "#111", background: "#ffffff", outline: "none" };
const lab: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: MUT, marginBottom: 5, display: "block" };

function Field({ name, label, val, set, ph, req, half }: { name: string; label: string; val: string; set: (v: string) => void; ph?: string; req?: boolean; half?: boolean }) {
  return (
    <label style={{ gridColumn: half ? "span 1" : "1 / -1", display: "block" }}>
      <span style={lab}>{label}{req ? " *" : ""}</span>
      <input name={name} value={val} onChange={(e) => set(e.target.value)} placeholder={ph} style={inp} />
    </label>
  );
}

export default function JoinForm({ spotsLeft }: { spotsLeft: number }) {
  const [f, setF] = useState({ firstName: "", lastName: "", city: "", state: "", zip: "", business: "", website: "", moneyWord: "", adjacent: "", supporting: "", email: "", phone: "" });
  const s = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<JoinRes | null>(null);
  const [err, setErr] = useState("");
  const [cta, setCta] = useState<{ kind: "founding" | "fund"; msg: string } | null>(null);
  const [ctaBusy, setCtaBusy] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (loading) return;
    setErr(""); setLoading(true);
    try {
      const r = await fetch("/api/quuik/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j: JoinRes = await r.json();
      if (!r.ok || j.error) { setErr(j.error || "Something went wrong."); setLoading(false); return; }
      setRes(j); setCta(null);
      setTimeout(() => document.getElementById("cpc-reveal")?.scrollIntoView({ behavior: "smooth" }), 60);
    } catch { setErr("Network error — try again."); }
    setLoading(false);
  }

  async function becomeFounding() {
    setCtaBusy("founding");
    try {
      const r = await fetch("/api/quuik/founding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: f.email, business: f.business }) });
      const j = await r.json();
      if (j.checkoutUrl) { window.location.href = j.checkoutUrl; return; }
      setCta({ kind: "founding", msg: j.message || j.error || "You're on the founding-member list — we'll reach out to finalize." });
    } catch { setCta({ kind: "founding", msg: "We saved your interest — we'll reach out shortly." }); }
    setCtaBusy("");
  }
  async function fundNow() {
    setCtaBusy("fund");
    try {
      await fetch("/api/quuik/fund-intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: f.email, business: f.business, moneyWord: f.moneyWord, baseCpc: res?.baseCpc }) });
    } catch {}
    setCta({ kind: "fund", msg: "Got it — we emailed the team. Next: fund your account (prepay, $500 minimum, no refunds). The highest bid wins our premium spots. We'll send your funding link." });
    setCtaBusy("");
  }

  const base = res?.baseCpc ?? 0;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px" }}>
      {!res ? (
        <form onSubmit={submit} style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 20, padding: 26, boxShadow: "0 20px 50px -30px rgba(0,0,0,.3)" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: INK }}>Claim your money word</h2>
          <p style={{ margin: "0 0 18px", color: MUT, fontSize: 14 }}>The keyword you want to be found for across the network. We'll price it for you instantly.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
            <Field name="firstName" label="First name" val={f.firstName} set={s("firstName")} req half />
            <Field name="lastName" label="Last name" val={f.lastName} set={s("lastName")} req half />
            <Field name="business" label="Business" val={f.business} set={s("business")} req />
            <Field name="website" label="Website (we'll link to it)" val={f.website} set={s("website")} ph="https://…" />
            <Field name="city" label="City" val={f.city} set={s("city")} half />
            <Field name="state" label="State" val={f.state} set={s("state")} half />
            <Field name="zip" label="ZIP" val={f.zip} set={s("zip")} half />
            <Field name="phone" label="Phone" val={f.phone} set={s("phone")} half />
            <Field name="email" label="Email" val={f.email} set={s("email")} req />
            <div style={{ gridColumn: "1 / -1", height: 1, background: LINE, margin: "4px 0" }} />
            <Field name="moneyWord" label="⭐ Your money word (the keyword you want to win)" val={f.moneyWord} set={s("moneyWord")} ph="e.g. medicare supplement" req />
            <Field name="adjacent" label="Adjacent words (comma-separated) — related searches that should also trigger you" val={f.adjacent} set={s("adjacent")} ph="turning 65, plan g, enrollment" />
            <Field name="supporting" label="Supporting words (comma-separated)" val={f.supporting} set={s("supporting")} ph="premium, deductible, broker" />
          </div>
          {err && <div style={{ marginTop: 14, background: "#fdecea", color: "#b3261e", padding: "11px 14px", borderRadius: 10, fontSize: 14 }}>{err}</div>}
          <button type="submit" disabled={loading} style={{ marginTop: 18, width: "100%", background: ORANGE, color: "#fff", border: 0, borderRadius: 100, padding: "15px 0", fontSize: 17, fontWeight: 800, cursor: loading ? "default" : "pointer" }}>
            {loading ? "Pricing your keyword…" : "Show me my cost per click →"}
          </button>
        </form>
      ) : (
        <div id="cpc-reveal">
          {/* CPC REVEAL */}
          <div style={{ background: "#000000", color: "#fff", borderRadius: 20, padding: "30px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: ORANGE }}>Your base cost per click</div>
            <div style={{ fontSize: 62, fontWeight: 900, margin: "6px 0", lineHeight: 1 }}>${base.toFixed(2)}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245,130,31,.16)", color: "#ffb877", borderRadius: 100, padding: "6px 14px", fontSize: 14, fontWeight: 700 }}>▲ up 22% in the last twelve months</div>
            <p style={{ color: "#cbd2da", fontSize: 15, lineHeight: 1.6, maxWidth: 520, margin: "18px auto 0" }}>
              Paid advertising only gets more expensive. The best way to beat it is a proprietary network that collectively saves time, energy, effort, and money. Lock a flat rate as a founding member — or fund your account and bid.
            </p>
            {res.cpc && res.cpc.rows.length > 1 && (
              <div style={{ marginTop: 18, textAlign: "left", maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
                {res.cpc.rows.map((r) => (
                  <div key={r.keyword} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: "1px solid rgba(255,255,255,.1)", fontSize: 14 }}>
                    <span style={{ color: "#e5e7eb" }}>{r.keyword}{r.source === "estimate" ? <span style={{ color: "#8b94a0", fontSize: 11 }}> · est.</span> : ""}</span>
                    <b>${r.cpc.toFixed(2)}</b>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DUAL CTA */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18 }}>
            <div style={{ background: "#fff", border: `2px solid ${ORANGE}`, borderRadius: 18, padding: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: ORANGE, textTransform: "uppercase", letterSpacing: ".08em" }}>Founding member</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: INK, marginTop: 4 }}>$3,000<span style={{ fontSize: 15, fontWeight: 700, color: MUT }}>/mo</span></div>
              <p style={{ color: MUT, fontSize: 13.5, lineHeight: 1.5, marginTop: 6 }}>Lifetime flat rate. Your keywords and your ads are included across the network every month, as long as you're paying and in good standing.</p>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#b3261e", margin: "8px 0" }}>Only {spotsLeft} founding spots left</div>
              <button onClick={becomeFounding} disabled={ctaBusy === "founding"} style={{ width: "100%", background: ORANGE, color: "#fff", border: 0, borderRadius: 100, padding: "13px 0", fontSize: 15.5, fontWeight: 800, cursor: "pointer" }}>{ctaBusy === "founding" ? "One sec…" : "Become Founding Member"}</button>
            </div>
            <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 18, padding: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: INK, textTransform: "uppercase", letterSpacing: ".08em" }}>Pay as you go</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: INK, marginTop: 4 }}>Fund &amp; bid</div>
              <p style={{ color: MUT, fontSize: 13.5, lineHeight: 1.5, marginTop: 6 }}>Prepay your account (minimum $500, no refunds) and bid on your keyword. You can raise your bid at any time to move higher on the stack — the highest bid is the winning bid, then it steps down per bid.</p>
              <div style={{ fontSize: 13, color: MUT, margin: "8px 0" }}>Your rate: <b style={{ color: INK }}>${base.toFixed(2)}/click</b></div>
              <button onClick={fundNow} disabled={ctaBusy === "fund"} style={{ width: "100%", background: INK, color: "#fff", border: 0, borderRadius: 100, padding: "13px 0", fontSize: 15.5, fontWeight: 800, cursor: "pointer" }}>{ctaBusy === "fund" ? "One sec…" : "Get Started — Fund Account"}</button>
            </div>
          </div>

          {cta && <div style={{ marginTop: 16, background: "#f0f9f2", border: "1px solid #b7e3c4", color: "#166534", padding: "14px 16px", borderRadius: 12, fontSize: 14.5, lineHeight: 1.5 }}>✓ {cta.msg}</div>}

          <div style={{ marginTop: 18, background: "#faf9f7", border: `1px solid ${LINE}`, borderRadius: 12, padding: "14px 16px", fontSize: 13.5, color: MUT }}>
            ✓ You&apos;re in the network. Lock in your keyword above — become a founding member, or fund your account and bid. We&apos;ll follow up with your login so you can track your keywords, clicks, and network data.
          </div>
        </div>
      )}
    </div>
  );
}
