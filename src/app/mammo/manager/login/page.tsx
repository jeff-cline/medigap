"use client";

import { useState } from "react";
import { MammoHeader, MammoFooter } from "@/components/mammo/Chrome";

export default function ManagerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const res = await fetch("/api/mammo/manager-login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(d?.error ?? "Invalid email or password."); return; }
    window.location.assign("/manager");
  }

  return (
    <>
      <MammoHeader />
      <main className="bg-white text-[#2E1065] min-h-[70vh]">
        <div className="max-w-md mx-auto px-4 py-14 md:py-20">

          <p className="text-xs font-black uppercase tracking-widest text-[#7C3AED] mb-2">Manager access</p>
          <h1 className="text-3xl font-black mb-2">Sign in</h1>
          <p className="text-[#2E1065]/70 mb-8">Review leads and download the reconciliation file.</p>
          <form onSubmit={submit} className="space-y-4">
            {err && <p className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-bold">{err}</p>}
            <div>
              <label className="block text-sm font-black mb-1.5" htmlFor="em">Email</label>
              <input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-black mb-1.5" htmlFor="pw">Password</label>
              <input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <button type="submit" disabled={busy}
              className="w-full rounded-2xl bg-[#7C3AED] hover:bg-[#5B21B6] disabled:opacity-60 text-white font-black py-4 text-lg transition-colors">
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </main>
      <MammoFooter />
    </>
  );
}
