"use client";

import { useState } from "react";

export default function InviteForm({ token, email, name: initialName }: { token: string; email: string; name: string }) {
  const [name, setName] = useState(initialName);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const res = await fetch("/api/mammo/invite", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, name, password }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(d?.error ?? "Could not set your password."); return; }
    window.location.assign("/manager");
  }

  return (
    <>
      <h1 className="text-3xl font-black mb-2">Set your password</h1>
      <p className="text-[#2E1065]/70 mb-8">
        You are setting up manager access for <strong>{email}</strong>.
      </p>
      <form onSubmit={submit} className="space-y-4">
        {err && <p className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-bold">{err}</p>}
        <div>
          <label className="block text-sm font-black mb-1.5" htmlFor="nm">Your name</label>
          <input id="nm" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
        <div>
          <label className="block text-sm font-black mb-1.5" htmlFor="pw">Choose a password</label>
          <input id="pw" type="password" required minLength={9} value={password}
            onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <p className="mt-1.5 text-xs text-[#2E1065]/55">At least 9 characters.</p>
        </div>
        <button type="submit" disabled={busy}
          className="w-full rounded-2xl bg-[#7C3AED] hover:bg-[#5B21B6] disabled:opacity-60 text-white font-black py-4 text-lg transition-colors">
          {busy ? "Setting up…" : "Set password & sign in →"}
        </button>
      </form>
    </>
  );
}
