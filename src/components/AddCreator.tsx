"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// God-only: spin up a Creator account (role=creator) with a tracked /c/<refCode> link.
export default function AddCreator() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", payoutMode: "activation" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ refCode: string; temp: string } | null>(null);
  const [err, setErr] = useState("");

  async function create() {
    if (!f.email.trim()) { setErr("Email is required."); return; }
    setBusy(true); setErr("");
    const r = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", email: f.email, name: f.name, role: "creator" }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (d.ok) { setMsg({ refCode: d.refCode, temp: d.tempPassword }); setF({ name: "", email: "", payoutMode: "activation" }); router.refresh(); }
    else setErr(d.error || "Could not create creator.");
  }

  if (!open) return <button onClick={() => setOpen(true)} className="btn btn-brand text-sm !py-1.5">+ Add creator</button>;

  return (
    <div className="card !p-4 w-full max-w-md">
      {msg ? (
        <div className="text-sm">
          <div className="font-semibold text-[var(--brand)]">✓ Creator created</div>
          <div className="mt-2">Tracked link: <code className="text-[var(--brand2)]">https://doublewide.ai/c/{msg.refCode}</code></div>
          <div className="mt-1">Login: their email · temp password <b>{msg.temp}</b> (they reset on first login)</div>
          <button onClick={() => { setMsg(null); setOpen(false); }} className="btn btn-ghost text-xs mt-3">Done</button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="font-semibold text-sm">New creator</div>
          <input placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input placeholder="Email *" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          {err && <p className="text-xs text-[var(--danger)]">{err}</p>}
          <div className="flex gap-2">
            <button onClick={create} disabled={busy} className="btn btn-brand text-sm">{busy ? "Creating…" : "Create creator"}</button>
            <button onClick={() => setOpen(false)} className="btn btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
