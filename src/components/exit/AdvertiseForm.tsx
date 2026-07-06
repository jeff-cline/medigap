"use client";
import { useState } from "react";
import { EXIT } from "@/lib/exit";

const O = EXIT.colors.orange;
const F = [
  ["firstName", "First name"], ["lastName", "Last name"], ["email", "Email"], ["phone", "Phone"],
  ["city", "City"], ["state", "State"], ["businessName", "Business name"],
  ["yearsUntilExit", "Years until exit"], ["exitGoal", "Estimated exit goal"], ["employees", "How many employees"], ["ebitda", "Current EBITDA"],
] as const;

export default function AdvertiseForm() {
  const [v, setV] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const inp = "w-full rounded-md border bg-black/30 px-3 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-[color:var(--orange)]";

  async function submit() {
    if (!v.firstName?.trim() || !v.email?.trim()) { setErr("First name and email are required."); return; }
    setBusy(true); setErr("");
    await fetch("/api/exit/advertise", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(v) }).catch(() => {});
    setBusy(false); setOk(true);
    // pop the pre-formatted email
    const body = [
      `First name: ${v.firstName || ""}`, `Last name: ${v.lastName || ""}`, `City: ${v.city || ""}`, `State: ${v.state || ""}`,
      `Business name: ${v.businessName || ""}`, `Years until exit: ${v.yearsUntilExit || ""}`, `Estimated exit goal: ${v.exitGoal || ""}`,
      `How many employees: ${v.employees || ""}`, `Current EBITDA: ${v.ebitda || ""}`,
    ].join("\n");
    window.location.href = `mailto:jeff.cline@me.com?subject=${encodeURIComponent("Business Exit Optimization")}&body=${encodeURIComponent(body)}`;
  }

  if (ok) return <div className="rounded-xl border p-6 text-center" style={{ borderColor: EXIT.colors.border }}><div className="text-3xl">✅</div><div className="mt-2 text-lg font-bold text-white">Thanks — your email is opening.</div><p className="text-slate-400 mt-1">If it didn't, email us at <a href="mailto:jeff.cline@me.com" className="underline" style={{ color: EXIT.colors.orange3 }}>jeff.cline@me.com</a>.</p></div>;

  return (
    <div className="rounded-2xl border p-6" style={{ borderColor: EXIT.colors.border, background: EXIT.colors.panel, ["--orange" as string]: O }}>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {F.map(([k, label]) => <div key={k} className={k === "businessName" ? "sm:col-span-2" : ""}><label className="text-xs text-slate-400">{label}</label><input value={v[k] || ""} onChange={(e) => setV({ ...v, [k]: e.target.value })} className={inp} /></div>)}
      </div>
      {err && <div className="mt-2 text-sm text-red-400">{err}</div>}
      <button onClick={submit} disabled={busy} className="mt-4 w-full rounded-md px-5 py-3 font-bold" style={{ background: O, color: EXIT.colors.bg }}>{busy ? "Sending…" : "Submit & email us →"}</button>
    </div>
  );
}
