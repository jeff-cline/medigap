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
    // The founder lands straight in his Unified Communications inbox; everyone else → dashboard.
    const dest = data.mustChangePassword ? "/change-password" : (email.trim().toLowerCase() === "jeff.cline@me.com" ? "/unified" : "/dashboard");
    router.push(dest);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 overflow-hidden">
      <style>{`
        @keyframes launch { 0%{transform:translateY(0) rotate(-45deg);opacity:.0} 12%{opacity:1} 100%{transform:translateY(-46vh) rotate(-45deg);opacity:1} }
        @keyframes trail { 0%{transform:scaleY(.2);opacity:0} 20%{opacity:.7} 100%{transform:scaleY(1);opacity:0} }
        .rocket{position:absolute;left:50%;bottom:8%;font-size:42px;animation:launch 4.5s ease-in infinite}
        .rocket::after{content:"";position:absolute;left:50%;top:100%;width:6px;height:60px;margin-left:-3px;border-radius:3px;
          background:linear-gradient(to bottom,rgba(255,180,80,.9),rgba(255,90,40,.2),transparent);transform-origin:top;animation:trail 4.5s ease-in infinite}
      `}</style>
      <div className="rocket" aria-hidden>🚀</div>
      <div className="w-full max-w-md relative z-10">
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
