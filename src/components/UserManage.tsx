"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = ["agent", "advertiser", "investor", "marketing", "accounting", "moneywords", "risk", "god"];

export default function UserManage({ user }: { user: { id: string; name: string; phone: string; role: string; status: string } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const [amt, setAmt] = useState("100");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function call(body: object) {
    setBusy(true); setNote("");
    const r = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setBusy(false); if (d.error) setNote(d.error); else router.refresh();
    return d;
  }
  async function impersonate() {
    const r = await fetch("/api/impersonate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) });
    if (r.ok) window.location.href = "/dashboard"; else setNote("Impersonate failed");
  }
  async function save() { const d = await call({ id: user.id, action: "update", name, phone, role, status }); if (!d.error) { setNote("Saved"); setOpen(false); } }
  async function deposit() { const d = await call({ id: user.id, action: "deposit", amount: Number(amt) }); if (!d.error) setNote(`+$${amt}`); }
  async function reset() { const d = await call({ id: user.id, action: "reset" }); if (d.tempPassword) setNote(`Temp pw: ${d.tempPassword}`); }

  return (
    <div className="text-right">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button onClick={impersonate} disabled={busy} className="btn btn-brand text-xs !py-1 !px-2.5">Impersonate</button>
        <button onClick={() => setOpen(!open)} disabled={busy} className="btn btn-ghost text-xs !py-1 !px-2.5">{open ? "Close" : "Edit"}</button>
        {user.status === "pending" && <button onClick={() => call({ id: user.id, action: "approve" })} disabled={busy} className="btn btn-ghost text-xs !py-1 !px-2.5">Approve</button>}
        <button onClick={reset} disabled={busy} className="btn btn-ghost text-xs !py-1 !px-2.5">Reset PW</button>
      </div>
      {open && (
        <div className="mt-3 grid gap-2 text-left bg-[var(--panel2)] border border-[var(--border)] rounded-xl p-3">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px] uppercase text-[var(--muted)]">Name</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><label className="text-[10px] uppercase text-[var(--muted)]">Phone (for call routing)</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 972 555 0123" /></div>
            <div><label className="text-[10px] uppercase text-[var(--muted)]">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
            <div><label className="text-[10px] uppercase text-[var(--muted)]">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="active">active</option><option value="paused">paused</option><option value="pending">pending</option></select></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={busy} className="btn btn-brand text-xs !py-1.5">Save changes</button>
            <span className="text-[var(--border)]">|</span>
            <span className="text-[10px] uppercase text-[var(--muted)]">Add funds $</span>
            <input className="!w-20" value={amt} onChange={(e) => setAmt(e.target.value)} />
            <button onClick={deposit} disabled={busy} className="btn btn-ghost text-xs !py-1.5">Deposit</button>
          </div>
        </div>
      )}
      {note && <div className="text-[11px] text-[var(--muted)] mt-1">{note}</div>}
    </div>
  );
}
