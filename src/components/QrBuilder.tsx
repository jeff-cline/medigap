"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { qrImage, trackingUrl } from "@/lib/qr";

const SOURCES = ["tv", "display", "print", "direct-mail", "social", "billboard", "other"];

export default function QrBuilder() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [targetUrl, setTargetUrl] = useState("https://1-800-medigap.com");
  const [source, setSource] = useState("tv");
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState<{ code: string } | null>(null);

  async function create() {
    if (!targetUrl.trim()) return;
    setBusy(true); setMade(null);
    const r = await fetch("/api/qr", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create", label, targetUrl, source }) }).then((x) => x.json()).catch(() => ({}));
    setBusy(false);
    if (r.ok) { setMade({ code: r.code }); setLabel(""); router.refresh(); }
    else alert(r.error || "Failed");
  }

  const track = made ? trackingUrl(made.code) : "";
  return (
    <div className="card p-5">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="block"><span className="text-xs uppercase tracking-wide text-[var(--muted)]">Label</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. CBS evening TV spot" className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm" /></label>
        <label className="block"><span className="text-xs uppercase tracking-wide text-[var(--muted)]">Destination URL</span>
          <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://1-800-medigap.com/medicare" className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm" /></label>
        <label className="block"><span className="text-xs uppercase tracking-wide text-[var(--muted)]">Source</span>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm">
            {SOURCES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select></label>
      </div>
      <button onClick={create} disabled={busy} className="btn btn-brand text-sm mt-3">{busy ? "Creating…" : "+ Create tracked QR"}</button>

      {made && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-[var(--brand)]/40 bg-[var(--brand)]/5 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrImage(track, 160)} alt="QR" className="h-40 w-40 rounded bg-white p-2" />
          <div className="min-w-0">
            <div className="text-sm font-medium mb-1">✅ Your tracked QR is ready</div>
            <div className="text-xs text-[var(--muted)] mb-2">Print/place this image. Every scan is counted and redirects to your destination.</div>
            <code className="text-xs text-[var(--brand2)] break-all">{track}</code>
            <div className="mt-2 flex gap-2">
              <a href={qrImage(track, 600)} download={`qr-${made.code}.png`} target="_blank" className="btn btn-ghost text-xs !py-1.5">⬇ Download PNG</a>
              <button onClick={() => navigator.clipboard?.writeText(track)} className="btn btn-ghost text-xs !py-1.5">Copy link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
