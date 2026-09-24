"use client";
// Public face of the investor data room: Login · Request access (accredited only) · Forgot password.
import { useState } from "react";

const INK = "#111", MUT = "#555", LINE = "#d9d9d9", GOLD = "#8a6d1f";
const serif = "Georgia, 'Times New Roman', serif";
const TYPES = ["Accredited investor", "Fund", "Private equity group", "Family office"];

const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "11px 13px", border: `1px solid ${LINE}`, borderRadius: 2, fontSize: 15, color: INK, background: "#fff", outline: "none", fontFamily: "Arial,sans-serif" };
const label: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: MUT, marginBottom: 5, display: "block" };
const btn: React.CSSProperties = { width: "100%", background: INK, color: "#fff", border: 0, borderRadius: 2, padding: "13px 0", fontSize: 14, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", cursor: "pointer" };

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json().catch(() => ({}));
}

export default function InvestorGate() {
  const [tab, setTab] = useState<"login" | "request" | "forgot">("login");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // login
  const [le, setLe] = useState(""); const [lp, setLp] = useState("");
  async function doLogin() {
    setErr(""); setBusy(true);
    const r = await post("/api/auth/login", { email: le, password: lp });
    setBusy(false);
    if (r.ok) location.href = r.mustChangePassword ? "/change-password?next=/investor" : "/investor";
    else setErr(r.error || "Incorrect email or password.");
  }

  // forgot
  const [fe, setFe] = useState("");
  async function doForgot() {
    setErr(""); setBusy(true);
    await post("/api/quuik/investor/reset", { email: fe });
    setBusy(false); setMsg("If that email is registered, a temporary password is on its way.");
  }

  // request access
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ first: "", last: "", city: "", state: "", zip: "", email: "", phone: "", investorType: "", accredited: false, password: "", password2: "", company: "" });
  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const [done, setDone] = useState(false);
  function toStep2() {
    setErr("");
    if (!f.first || !f.last || !f.city || !f.state || !f.zip) { setErr("Please complete name and location."); return; }
    setStep(2);
  }
  async function submitRequest() {
    setErr("");
    if (!f.email || !f.phone) { setErr("Email and phone are required."); return; }
    if (!f.investorType) { setErr("Please select your investor category."); return; }
    if (f.password.length < 8) { setErr("Choose a password of at least 8 characters."); return; }
    if (f.password !== f.password2) { setErr("Passwords don't match."); return; }
    if (!f.accredited) { setErr("This offering is for accredited investors only — please confirm."); return; }
    setBusy(true);
    const r = await post("/api/quuik/investor/request", f);
    setBusy(false);
    if (r.ok) { location.href = "/investor"; } else { setBusy(false); setErr(r.error || "Could not submit. Please try again."); }
  }

  const wrap: React.CSSProperties = { maxWidth: 460, margin: "0 auto" };
  return (
    <div style={{ fontFamily: "Arial,sans-serif", color: INK }}>
      {/* tabs */}
      {!done && (
        <div style={{ ...wrap, display: "flex", borderBottom: `1px solid ${LINE}`, marginBottom: 26 }}>
          {[["login", "Investor login"], ["request", "Request access"]].map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k as "login" | "request"); setErr(""); setMsg(""); }}
              style={{ flex: 1, background: "transparent", border: 0, borderBottom: `2px solid ${tab === k ? INK : "transparent"}`, padding: "12px 0", fontSize: 13.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: tab === k ? INK : MUT, cursor: "pointer", marginBottom: -1 }}>{l}</button>
          ))}
        </div>
      )}

      {err && !(tab === "request" && step === 2) && <div style={{ ...wrap, background: "#fdecea", border: "1px solid #f0a9a0", color: "#9a1b0e", fontSize: 13.5, fontWeight: 600, padding: "11px 13px", borderRadius: 3, marginBottom: 14, lineHeight: 1.45 }}>⚠ {err}</div>}
      {msg && <div style={{ ...wrap, background: "#e8f6ee", border: "1px solid #a9d9bd", color: "#1a5", fontSize: 13.5, padding: "11px 13px", borderRadius: 3, marginBottom: 14 }}>{msg}</div>}

      {/* LOGIN */}
      {tab === "login" && !done && (
        <div style={wrap}>
          <div style={{ marginBottom: 14 }}><label style={label}>Email</label><input style={field} value={le} onChange={(e) => setLe(e.target.value)} autoComplete="username" /></div>
          <div style={{ marginBottom: 18 }}><label style={label}>Password</label><input style={field} type="password" value={lp} onChange={(e) => setLp(e.target.value)} autoComplete="current-password" onKeyDown={(e) => e.key === "Enter" && doLogin()} /></div>
          <button style={{ ...btn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={doLogin}>{busy ? "Signing in…" : "Enter data room →"}</button>
          <button onClick={() => { setTab("forgot"); setErr(""); }} style={{ background: "none", border: 0, color: MUT, fontSize: 12.5, marginTop: 14, cursor: "pointer", textDecoration: "underline" }}>Forgot your password?</button>
        </div>
      )}

      {/* FORGOT */}
      {tab === "forgot" && !done && (
        <div style={wrap}>
          <p style={{ color: MUT, fontSize: 13.5, marginTop: 0 }}>Enter your email and we&rsquo;ll send a temporary password.</p>
          <div style={{ marginBottom: 16 }}><label style={label}>Email</label><input style={field} value={fe} onChange={(e) => setFe(e.target.value)} /></div>
          <button style={{ ...btn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={doForgot}>{busy ? "Sending…" : "Send reset"}</button>
          <button onClick={() => { setTab("login"); setErr(""); setMsg(""); }} style={{ background: "none", border: 0, color: MUT, fontSize: 12.5, marginTop: 14, cursor: "pointer", textDecoration: "underline" }}>← Back to login</button>
        </div>
      )}

      {/* REQUEST ACCESS — step 1 */}
      {tab === "request" && !done && step === 1 && (
        <div style={wrap}>
          <input type="text" name="company" value={f.company} onChange={(e) => set("company", e.target.value)} style={{ position: "absolute", left: "-9999px" }} tabIndex={-1} autoComplete="off" aria-hidden />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={label}>First name</label><input style={field} value={f.first} onChange={(e) => set("first", e.target.value)} /></div>
            <div><label style={label}>Last name</label><input style={field} value={f.last} onChange={(e) => set("last", e.target.value)} /></div>
          </div>
          <div style={{ marginTop: 12 }}><label style={label}>City</label><input style={field} value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div><label style={label}>State</label><input style={field} value={f.state} onChange={(e) => set("state", e.target.value)} /></div>
            <div><label style={label}>Zip</label><input style={field} value={f.zip} onChange={(e) => set("zip", e.target.value)} /></div>
          </div>
          <button style={{ ...btn, marginTop: 20 }} onClick={toStep2}>Continue →</button>
        </div>
      )}

      {/* REQUEST ACCESS — step 2 modal */}
      {tab === "request" && !done && step === 2 && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }} onClick={() => setStep(1)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 3, maxWidth: 440, width: "100%", padding: "26px 26px 24px", fontFamily: "Arial,sans-serif", boxShadow: "0 24px 60px rgba(0,0,0,.4)" }}>
            <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 700, color: INK }}>Accredited investor verification</div>
            <p style={{ color: MUT, fontSize: 13, margin: "6px 0 16px" }}>This offering is available to accredited investors only.</p>
            {err && <div style={{ background: "#fdecea", border: "1px solid #f0a9a0", color: "#9a1b0e", fontSize: 13.5, fontWeight: 600, padding: "11px 13px", borderRadius: 3, marginBottom: 14, lineHeight: 1.45 }}>⚠ {err}</div>}
            <div style={{ marginBottom: 12 }}><label style={label}>Email address</label><input style={field} value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div style={{ marginBottom: 12 }}><label style={label}>Phone number</label><input style={field} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>I am a…</label>
              <select style={{ ...field, appearance: "auto" }} value={f.investorType} onChange={(e) => set("investorType", e.target.value)}>
                <option value="">Select one…</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}><label style={label}>Create a password</label><input style={field} type="password" value={f.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" /></div>
            <div style={{ marginBottom: 14 }}><label style={label}>Confirm password</label><input style={field} type="password" value={f.password2} onChange={(e) => set("password2", e.target.value)} autoComplete="new-password" /></div>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: INK, cursor: "pointer", marginBottom: 14, lineHeight: 1.45, background: f.accredited ? "#eef7f0" : "#fbf6ee", border: `1.5px solid ${f.accredited ? "#8fcaa8" : "#e6c98f"}`, borderRadius: 4, padding: "12px 13px" }}>
              <input type="checkbox" checked={f.accredited} onChange={(e) => set("accredited", e.target.checked)} style={{ marginTop: 1, width: 17, height: 17, flex: "0 0 auto" }} />
              <span><b>Required —</b> I confirm that I am an <b>accredited investor</b> as defined under Rule 501 of Regulation D, and I consent to receive this confidential material.</span>
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ ...btn, background: "#fff", color: INK, border: `1px solid ${LINE}`, flex: "0 0 40%" }}>← Back</button>
              <button onClick={submitRequest} disabled={busy || !f.accredited} style={{ ...btn, flex: 1, opacity: (busy || !f.accredited) ? 0.5 : 1, cursor: (busy || !f.accredited) ? "not-allowed" : "pointer" }}>{busy ? "Submitting…" : "Request access →"}</button>
            </div>
            {!f.accredited && <div style={{ fontSize: 12, color: MUT, marginTop: 9, textAlign: "center" }}>Check the accreditation box above to enable access.</div>}
          </div>
        </div>
      )}

      {/* DONE */}
      {done && (
        <div style={{ ...wrap, textAlign: "center", padding: "10px 0" }}>
          <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: INK }}>Request received</div>
          <p style={{ color: MUT, fontSize: 14.5, lineHeight: 1.6, marginTop: 12 }}>Thank you. We&rsquo;ve emailed your login and a temporary password to <b style={{ color: INK }}>{f.email}</b>. You&rsquo;ll set your own password on first sign-in. This material is strictly confidential.</p>
          <button onClick={() => { setDone(false); setTab("login"); }} style={{ ...btn, marginTop: 18, width: "auto", padding: "12px 28px", display: "inline-block" }}>Go to login →</button>
          <div style={{ marginTop: 14, fontSize: 12, color: GOLD, fontStyle: "italic", fontFamily: serif }}>R0cketShip Holdings</div>
        </div>
      )}
    </div>
  );
}
