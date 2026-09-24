"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password") ?? "");
    if (password !== String(f.get("confirm") ?? "")) {
      setError("Those two passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/equity/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!j.ok) {
        setError(j.error || "That did not work. Please try again.");
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
          <label htmlFor="i-pass">Password</label>
          <input id="i-pass" name="password" type="password" minLength={12}
                 autoComplete="new-password" required />
          <p className="eq-disclosure" style={{ marginTop: 6 }}>At least 12 characters.</p>
        </div>
        <div className="eq-field">
          <label htmlFor="i-confirm">Confirm password</label>
          <input id="i-confirm" name="confirm" type="password" minLength={12}
                 autoComplete="new-password" required />
        </div>
        {error && <p className="eq-error">{error}</p>}
        <button className="eq-btn" disabled={busy}
                style={{ width: "100%", justifyContent: "center" }}>
          {busy ? "Setting up…" : "Set password and continue"}
        </button>
      </div>
    </form>
  );
}
