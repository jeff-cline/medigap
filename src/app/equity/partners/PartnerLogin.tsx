"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PartnerLogin() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/equity/partner-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: f.get("email"), password: f.get("password") }),
      });
      const j = await r.json().catch(() => ({}));
      if (!j.ok) {
        setError(j.error || "Those details do not match an active account.");
        return;
      }
      router.push("/partners/referrals");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="eq-form-card">
      <div className="eq-form-body" style={{ paddingTop: 24 }}>
        <div className="eq-field">
          <label htmlFor="p-email">Email</label>
          <input id="p-email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="eq-field">
          <label htmlFor="p-pass">Password</label>
          <input id="p-pass" name="password" type="password"
                 autoComplete="current-password" required />
        </div>
        {error && <p className="eq-error">{error}</p>}
        <button className="eq-btn" disabled={busy}
                style={{ width: "100%", justifyContent: "center" }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </form>
  );
}
