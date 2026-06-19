"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await r.json();
    setLoading(false);
    if (!r.ok) { setError(data.error || "Login failed."); return; }
    router.push(data.mustChangePassword ? "/change-password" : "/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center text-2xl font-bold text-gradient mb-2">medigap.plus</Link>
        <p className="text-center text-sm text-[var(--muted)] mb-6">Unified portal — God, agents, advertisers, investors &amp; staff.</p>
        <form onSubmit={submit} className="card p-7 glow">
          <h1 className="text-lg font-semibold mb-4">Sign in</h1>
          {error && <div className="mb-4 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">{error}</div>}
          <label className="text-xs text-[var(--muted)]">Email</label>
          <input className="mb-3 mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
          <label className="text-xs text-[var(--muted)]">Password</label>
          <input className="mb-5 mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          <button disabled={loading} className="btn btn-brand w-full justify-center">{loading ? "Signing in…" : "Sign in →"}</button>
        </form>
        <p className="text-center text-xs text-[var(--muted)] mt-4">
          New partner? <Link href="/advertise" className="text-[var(--brand)]">Advertise</Link> · <Link href="/agents" className="text-[var(--brand)]">Take calls</Link> · <Link href="/investors" className="text-[var(--brand)]">Invest</Link>
        </p>
      </div>
    </main>
  );
}
