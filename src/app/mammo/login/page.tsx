"use client";

import { useState } from "react";
import Link from "next/link";
import { MammoHeader, MammoFooter } from "@/components/mammo/Chrome";

export default function MammoLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const res = await fetch("/api/mammo/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(d?.error ?? "Invalid email or password."); return; }
    window.location.assign("/account");
  }

  const input = "w-full rounded-xl border-2 border-[#7C3AED]/30 px-4 py-3 text-[#2E1065] focus:outline-none focus:border-[#7C3AED]";

  return (
    <>
      <MammoHeader />
      <main className="bg-white text-[#2E1065] min-h-[70vh]">
        <div className="max-w-md mx-auto px-4 py-14 md:py-20">

          <h1 className="text-4xl font-black tracking-tight mb-2">Sign in</h1>
          <p className="text-lg text-[#2E1065]/70 mb-8">Welcome back.</p>
          <form onSubmit={submit} className="space-y-5">
            {err && <p className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-bold">{err}</p>}
            <div>
              <label className="block text-sm font-black mb-1.5" htmlFor="em">Email</label>
              <input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-black mb-1.5" htmlFor="pw">Password</label>
              <input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={input} autoComplete="current-password" />
            </div>
            <button type="submit" disabled={busy}
              className="w-full rounded-2xl bg-[#7C3AED] hover:bg-[#5B21B6] disabled:opacity-60 text-white font-black py-4 text-lg transition-colors">
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-center text-sm text-[#2E1065]/70">
              No account yet? <Link href="/signup" className="font-bold text-[#6D28D9] hover:underline">Create one</Link>
            </p>
          </form>
        </div>
      </main>
      <MammoFooter />
    </>
  );
}
