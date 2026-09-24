"use client";

import { useState } from "react";

export default function SignInForm() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/equity/signin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: f.get("email") }),
      });
      const j = await r.json().catch(() => ({}));
      if (!j.ok) {
        setError(j.error || "That did not work. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("That did not work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="eq-form-card">
        <div className="eq-success">
          <h3>Check your email.</h3>
          <p>
            If that address has an account with us, a sign-in link is on its way.
            It is good for 24 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="eq-form-card">
      <div className="eq-form-body" style={{ paddingTop: 24 }}>
        <div className="eq-field">
          <label htmlFor="s-email">Email</label>
          <input id="s-email" name="email" type="email" autoComplete="email" required />
        </div>
        {error && <p className="eq-error">{error}</p>}
        <button className="eq-btn" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
          {busy ? "Sending…" : "Email me a sign-in link"}
        </button>
      </div>
    </form>
  );
}
