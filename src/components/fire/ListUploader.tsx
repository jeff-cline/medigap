"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ListUploader() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function upload() {
    if (!file) return;
    setBusy(true); setMsg("Parsing & importing…");
    const fd = new FormData();
    fd.append("file", file);
    if (name) fd.append("name", name);
    const res = await fetch("/api/fire/lists", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(data.error || "Upload failed."); return; }
    setMsg(`Imported ${data.total} contacts — ${data.business} with a business email, ${data.personal} with a personal email.`);
    setFile(null); setName("");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
      <div className="text-sm font-semibold mb-2">Upload a list (Predictive Data CSV)</div>
      <div className="flex flex-wrap items-center gap-2">
        <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm text-[var(--muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--panel2)] file:px-3 file:py-1.5 file:text-[var(--text)]" />
        <input placeholder="list name (optional)" value={name} onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--panel2)] px-3 py-1.5 text-sm" />
        <button disabled={!file || busy} onClick={upload}
          className="rounded-lg bg-gradient-to-r from-[#34c5c5] to-[#2d8888] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Importing…" : "Import"}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-[var(--muted)]">{msg}</p>}
      <p className="mt-2 text-[11px] text-[var(--muted)]">Same query_run format each time. Deduped by person. Re-usable across campaigns.</p>
    </div>
  );
}
