"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePassword() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2) { setError("Passwords don't match."); return; }
    setLoading(true); setError("");
    const r = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    const data = await r.json();
    setLoading(false);
    if (!r.ok) { setError(data.error || "Failed."); return; }
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={submit} className="card p-7 glow w-full max-w-md">
        <h1 className="text-lg font-semibold">Set a new password</h1>
        <p className="text-sm text-[var(--muted)] mt-1 mb-4">For security, you must change the temporary password before continuing.</p>
        {error && <div className="mb-4 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">{error}</div>}
        <input className="mb-3" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (8+ chars)" required />
        <input className="mb-5" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirm new password" required />
        <button disabled={loading} className="btn btn-brand w-full justify-center">{loading ? "Saving…" : "Save & continue →"}</button>
      </form>
    </main>
  );
}
