"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// God-only: spin up a Creator (tracked /c/<refCode> link) or Brand (Brand Studio) account.
export default function AddCreator({ role = "creator" }: { role?: "creator" | "brand" }) {
  const router = useRouter();
  const isBrand = role === "brand";
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ refCode: string; temp: string } | null>(null);
  const [err, setErr] = useState("");

  async function create() {
    if (!f.email.trim()) { setErr("Email is required."); return; }
    setBusy(true); setErr("");
    const r = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", email: f.email, name: f.name, role }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (d.ok) { setMsg({ refCode: d.refCode || "", temp: d.tempPassword }); setF({ name: "", email: "" }); router.refresh(); }
    else setErr(d.error || `Could not create ${role}.`);
  }

  if (!open) return <button onClick={() => setOpen(true)} className="btn btn-brand text-sm !py-1.5">+ Add {role}</button>;

  return (
    <div className="card !p-4 w-full max-w-md">
      {msg ? (
        <div className="text-sm">
          <div className="font-semibold text-[var(--brand)]">✓ {isBrand ? "Brand" : "Creator"} created</div>
          {!isBrand && msg.refCode && <div className="mt-2">Tracked link: <code className="text-[var(--brand2)]">https://doublewide.ai/c/{msg.refCode}</code></div>}
          <div className="mt-1">Login: their email · temp password <b>{msg.temp}</b> · portal: <code className="text-[var(--brand2)]">{isBrand ? "/brand" : "/creator"}</code> (resets on first login)</div>
          <button onClick={() => { setMsg(null); setOpen(false); }} className="btn btn-ghost text-xs mt-3">Done</button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="font-semibold text-sm">New {role}</div>
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
