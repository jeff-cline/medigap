"use client";
import { useState } from "react";

export type Field = { name: string; label: string; placeholder?: string; type?: string };
export type IntegrationMeta = {
  key: string;
  label: string;
  blurb: string;
  steps: string[];
  fields: Field[];
  oauth?: boolean; // supports real-time OAuth "Connect" button
  dataFlow?: string; // what live data this brings into the dashboard
};

type Status = "unconfigured" | "saved" | "verified" | "failed";

const DOT: Record<Status, { color: string; label: string }> = {
  verified: { color: "var(--brand)", label: "Connected & verified" },
  saved: { color: "var(--gold)", label: "Keys saved — test it" },
  failed: { color: "var(--danger)", label: "Not working" },
  unconfigured: { color: "var(--danger)", label: "Not connected" },
};

export default function IntegrationCard({
  meta, step, initial, initialStatus, initialError,
}: {
  meta: IntegrationMeta;
  step: number;
  initial: Record<string, string>;
  initialStatus: Status;
  initialError: string;
}) {
  const [values, setValues] = useState<Record<string, string>>(initial || {});
  const [status, setStatus] = useState<Status>(initialStatus);
  const [error, setError] = useState(initialError || "");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(initialStatus === "failed" || initialStatus === "unconfigured" ? false : false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const dot = DOT[status];

  async function save() {
    setSaving(true); setMessage("");
    const filled = Object.values(values).some((v) => v && v.trim());
    await fetch("/api/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: meta.key, config: values, connected: filled }) });
    setStatus(filled ? "saved" : "unconfigured");
    setSaving(false); setMessage(filled ? "Saved. Now click Test connection." : "");
  }

  async function test() {
    setTesting(true); setMessage("");
    const r = await fetch(`/api/integrations/${meta.key}/test`, { method: "POST" });
    const data = await r.json().catch(() => ({}));
    setStatus(data.status || (data.ok ? "verified" : "failed"));
    setError(data.ok ? "" : data.message || "Test failed");
    setMessage(data.message || "");
    setTesting(false);
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-xs font-bold text-[var(--muted)]">{step}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="relative flex h-2.5 w-2.5">
                {status === "verified" && <span className="absolute inline-flex h-full w-full rounded-full opacity-60 live-dot" style={{ background: dot.color }} />}
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: dot.color }} />
              </span>
              <span className="font-semibold">{meta.label}</span>
              <span className="text-[11px]" style={{ color: dot.color }}>{dot.label}</span>
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">{meta.blurb}</p>
            {meta.dataFlow && <p className="text-xs text-[var(--brand2)] mt-1">↳ Feeds the dashboard: {meta.dataFlow}</p>}
            {status === "failed" && error && <p className="text-xs text-[var(--danger)] mt-1">⚠ {error}</p>}
          </div>
        </div>
        <button onClick={() => setOpen(!open)} className="btn btn-ghost text-xs !py-1.5 shrink-0">{open ? "Hide" : "Setup"}</button>
      </div>

      {open && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          {meta.oauth && (
            <div className="mb-4 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm"><b>One-click connect.</b> Save your app&apos;s Client ID &amp; Secret below, then authorize with your own login — no token copying.</div>
                <a href={`/api/oauth/${meta.key}/start`} className="btn btn-brand text-sm !py-1.5 shrink-0">Connect →</a>
              </div>
            </div>
          )}
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
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <button onClick={save} disabled={saving} className="btn btn-ghost text-sm !py-1.5">{saving ? "Saving…" : "Save keys"}</button>
            <button onClick={test} disabled={testing} className="btn btn-brand text-sm !py-1.5">{testing ? "Testing…" : "Test connection"}</button>
            {message && <span className="text-sm" style={{ color: status === "failed" ? "var(--danger)" : "var(--brand)" }}>{message}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
