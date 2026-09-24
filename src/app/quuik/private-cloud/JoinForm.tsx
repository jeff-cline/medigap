"use client";
import { useState } from "react";

const ORANGE = "#F5821F";
const INK = "#0e1524";
const MUT = "#5b6472";
const LINE = "#dde2ea";

const CATEGORIES = [
  "Professional services", "Health & wellness", "Real estate", "Financial services / insurance",
  "E-commerce / retail", "Hospitality / travel", "Marketing / advertising", "Technology / SaaS",
  "Construction / trades", "Automotive", "Legal", "Education", "Manufacturing / logistics",
  "Media / entertainment", "Non-profit", "Other",
];

const GOALS = [
  "Reduce customer acquisition cost", "Scale", "Reduce operational strain", "Mitigate risk",
  "Leverage R0cketShip", "Profit optimization", "Other",
];

const input: React.CSSProperties = {
  width: "100%", padding: "13px 15px", border: `1px solid ${LINE}`, borderRadius: 12, fontSize: 15.5, background: "#fff",
};
const label: React.CSSProperties = { display: "block", fontWeight: 700, fontSize: 13.5, margin: "0 0 6px", color: INK };

export default function JoinForm() {
  const [step, setStep] = useState(1);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [category, setCategory] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [optIn, setOptIn] = useState(true); // auto-checked
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const toggleGoal = (g: string) => setGoals((xs) => (xs.includes(g) ? xs.filter((x) => x !== g) : [...xs, g]));

  function next() {
    setErr("");
    if (!first.trim() || !last.trim() || !email.trim() || !phone.trim()) return setErr("Please complete every field.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr("Please enter a valid email.");
    setStep(2);
  }

  async function submit() {
    setErr("");
    if (!category) return setErr("Please choose your business category.");
    if (!optIn) return setErr("Network participation is required to create a Private Cloud account.");
    setBusy(true);
    try {
      const r = await fetch("/api/quuik/private-cloud/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first, last, phone, email, company, category, goals, optIn }),
      });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || "Something went wrong. Please try again."); setBusy(false); return; }
      setDone(true);
    } catch {
      setErr("Network error. Please try again.");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 30, textAlign: "center", background: "#fff" }}>
        <div style={{ fontSize: 46 }}>🔐</div>
        <h3 style={{ fontSize: 23, margin: "6px 0 4px" }}>Your account is ready</h3>
        <p style={{ color: MUT, fontSize: 15.5, lineHeight: 1.6, margin: "0 auto", maxWidth: 420 }}>
          Log in with your email (<b>{email}</b>) and the temporary password <b>TEMP!234</b>. You'll set your own
          password on first login, then choose one of your three plans.
        </p>
        <a href="/login" style={{ display: "inline-block", marginTop: 18, background: ORANGE, color: "#fff", fontWeight: 800, textDecoration: "none", padding: "13px 30px", borderRadius: 100 }}>Log in →</a>
      </div>
    );
  }

  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 26, background: "#fff" }}>
      {/* step indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[1, 2].map((n) => (
          <div key={n} style={{ flex: 1, height: 5, borderRadius: 100, background: step >= n ? ORANGE : LINE }} />
        ))}
      </div>

      {step === 1 && (
        <>
          <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 14 }}>1 · Your details</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}><label style={label}>First name</label><input style={input} value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" /></div>
            <div style={{ flex: 1 }}><label style={label}>Last name</label><input style={input} value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" /></div>
          </div>
          <div style={{ marginBottom: 14 }}><label style={label}>Phone</label><input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></div>
          <div style={{ marginBottom: 6 }}><label style={label}>Email (this becomes your username)</label><input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
          <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={company} onChange={(e) => setCompany(e.target.value)} style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }} />
          {err && <p style={{ color: "#c0392b", fontSize: 14, margin: "10px 0 0" }}>{err}</p>}
          <button onClick={next} style={cta}>Continue →</button>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 14 }}>2 · About your business</div>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>What best describes your business?</label>
            <select style={input} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>What are you looking for? (select all that apply)</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8 }}>
              {GOALS.map((g) => (
                <label key={g} style={{ display: "flex", alignItems: "center", gap: 9, border: `1px solid ${goals.includes(g) ? ORANGE : LINE}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, cursor: "pointer", background: goals.includes(g) ? "#fff8f1" : "#fff" }}>
                  <input type="checkbox" checked={goals.includes(g)} onChange={() => toggleGoal(g)} style={{ accentColor: ORANGE }} />
                  {g}
                </label>
              ))}
            </div>
          </div>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#f7f9fc", border: `1px solid ${LINE}`, borderRadius: 12, padding: "13px 15px", fontSize: 13.5, color: MUT, lineHeight: 1.5 }}>
            <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} style={{ accentColor: ORANGE, marginTop: 2 }} />
            <span>
              I agree to join the network — a "rising tide lifts all boats" program that leverages predictive data
              across all platforms to help scale my business — and I accept the{" "}
              <a href="/private-cloud/terms" target="_blank" style={{ color: ORANGE, fontWeight: 700 }}>Terms of Use</a> and{" "}
              <a href="/private-cloud/privacy" target="_blank" style={{ color: ORANGE, fontWeight: 700 }}>Privacy Policy</a>{" "}
              (<a href="/private-cloud/terms.txt" style={{ color: ORANGE }}>download terms</a> ·{" "}
              <a href="/private-cloud/privacy.txt" style={{ color: ORANGE }}>download privacy</a>).
            </span>
          </label>
          {err && <p style={{ color: "#c0392b", fontSize: 14, margin: "10px 0 0" }}>{err}</p>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => setStep(1)} style={{ ...cta, background: "#fff", color: INK, border: `1px solid ${LINE}`, flex: "0 0 auto" }}>← Back</button>
            <button onClick={submit} disabled={busy} style={{ ...cta, flex: 1, opacity: busy ? 0.6 : 1 }}>{busy ? "Creating…" : "Create my account →"}</button>
          </div>
        </>
      )}
    </div>
  );
}

const cta: React.CSSProperties = {
  width: "100%", marginTop: 16, background: ORANGE, color: "#fff", fontWeight: 800, fontSize: 15.5,
  border: 0, borderRadius: 100, padding: "14px 0", cursor: "pointer",
};
