"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Small per-row active toggle that POSTs {id, action:"toggle"} to a CRUD endpoint.
export function ToggleActive({
  endpoint,
  id,
  active,
}: {
  endpoint: string;
  id: string;
  active: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "toggle" }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="btn btn-ghost text-xs !py-1 !px-2.5"
    >
      {active ? "Pause" : "Activate"}
    </button>
  );
}

export type CrudField = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
};

export default function CrudForm({
  endpoint,
  fields,
  submitLabel = "Add",
  successNote = "Created.",
}: {
  endpoint: string;
  fields: CrudField[];
  submitLabel?: string;
  successNote?: string;
}) {
  const router = useRouter();
  const blank = Object.fromEntries(fields.map((f) => [f.name, ""])) as Record<string, string>;
  const [values, setValues] = useState<Record<string, string>>(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  function set(name: string, v: string) {
    setValues((prev) => ({ ...prev, [name]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...values }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not create.");
        return;
      }
      setNote(successNote);
      setValues(blank);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
          <label className="text-xs uppercase tracking-wide text-[var(--muted)]">{f.label}</label>
          {f.type === "textarea" ? (
            <textarea
              rows={2}
              value={values[f.name]}
              required={f.required}
              placeholder={f.placeholder}
              onChange={(e) => set(f.name, e.target.value)}
              className={inputCls}
            />
          ) : f.type === "select" ? (
            <select
              value={values[f.name]}
              onChange={(e) => set(f.name, e.target.value)}
              className={inputCls}
            >
              {(f.options || []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.type === "number" ? "number" : "text"}
              value={values[f.name]}
              required={f.required}
              placeholder={f.placeholder}
              onChange={(e) => set(f.name, e.target.value)}
              className={inputCls}
            />
          )}
        </div>
      ))}
      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={busy} className="btn btn-brand text-sm">
          {busy ? "Saving…" : submitLabel}
        </button>
        {note && !error && <span className="text-sm text-[var(--brand)]">{note}</span>}
        {error && <span className="text-sm text-[var(--danger)]">{error}</span>}
      </div>
    </form>
  );
}
