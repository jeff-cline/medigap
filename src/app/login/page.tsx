"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Show the site the visitor is actually on (exitoptimization.com, medigap.plus, …).
  const [host, setHost] = useState("");
  useEffect(() => setHost(window.location.hostname.replace(/^www\./, "")), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await r.json();
    setLoading(false);
    if (!r.ok) { setError(data.error || "Login failed."); return; }
    // Route by role: partners/customers → their account; founder → inbox; staff → dashboard.
    const dest = data.mustChangePassword ? "/change-password"
      : (data.role === "owner" || data.role === "adpartner") ? "/account"
      : data.role === "marketing_partner" ? "/dashboard/leads"
      : (data.role === "god" || email.trim().toLowerCase() === "jeff.cline@me.com") ? "/unified"
      : "/dashboard";
    router.push(dest);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 overflow-hidden">
      <style>{`
        @keyframes launch { 0%{transform:translateY(0) rotate(-45deg);opacity:0} 6%{opacity:1} 94%{opacity:1} 100%{transform:translateY(-112vh) rotate(-45deg);opacity:.9} }
        @keyframes trail { 0%{transform:scaleY(.2);opacity:0} 15%{opacity:.7} 100%{transform:scaleY(1);opacity:0} }
        .rocket{position:fixed;left:50%;bottom:-40px;font-size:42px;animation:launch 5s ease-in infinite;z-index:0}
        .rocket::after{content:"";position:absolute;left:50%;top:100%;width:6px;height:90px;margin-left:-3px;border-radius:3px;
          background:linear-gradient(to bottom,rgba(255,180,80,.9),rgba(255,90,40,.2),transparent);transform-origin:top;animation:trail 5s ease-in infinite}
      `}</style>
      <div className="rocket" aria-hidden>🚀</div>
      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="block text-center text-2xl font-bold text-gradient mb-6">{host || " "}</Link>
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
