"use client";
import { useState } from "react";

export type Field = { name: string; label: string; placeholder?: string; type?: string };
export type IntegrationMeta = {
  key: string;
  label: string;
  blurb: string;
  steps: string[];
  fields: Field[];
};

export default function IntegrationCard({ meta, initial, initialConnected }: { meta: IntegrationMeta; initial: Record<string, string>; initialConnected: boolean }) {
  const [values, setValues] = useState<Record<string, string>>(initial || {});
  const [connected, setConnected] = useState(initialConnected);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true); setSaved(false);
    const filled = Object.values(values).some((v) => v && v.trim());
    await fetch("/api/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: meta.key, config: values, connected: filled }) });
    setConnected(filled); setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{meta.label}</span>
            {connected ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-2 py-0.5 text-[11px] text-[var(--brand)]">● Connected</span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)]">○ Not connected</span>
            )}
          </div>
          <p className="text-sm text-[var(--muted)] mt-1">{meta.blurb}</p>
        </div>
        <button onClick={() => setOpen(!open)} className="btn btn-ghost text-xs !py-1.5 shrink-0">{open ? "Hide" : "Setup"}</button>
      </div>

      {open && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <ol className="mb-4 space-y-1.5 text-sm text-[var(--muted)] list-decimal list-inside">
            {meta.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          <div className="grid gap-3 sm:grid-cols-2">
            {meta.fields.map((f) => (
              <div key={f.name} className={meta.fields.length % 2 && f === meta.fields[meta.fields.length - 1] ? "sm:col-span-2" : ""}>
                <label className="text-xs text-[var(--muted)]">{f.label}</label>
                <input className="mt-1" type={f.type || "text"} placeholder={f.placeholder} value={values[f.name] || ""} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={save} disabled={saving} className="btn btn-brand text-sm !py-1.5">{saving ? "Saving…" : "Save keys"}</button>
            {saved && <span className="text-sm text-[var(--brand)]">✓ Saved</span>}
          </div>
        </div>
      )}
    </div>
  );
}
