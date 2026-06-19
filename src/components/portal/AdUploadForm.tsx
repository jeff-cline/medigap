"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls =
  "w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";

export default function AdUploadForm() {
  const router = useRouter();
  const [kind, setKind] = useState("text");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [placement, setPlacement] = useState("inline");
  const [cpc, setCpc] = useState(2.5); // dollars
  const [assetUrl, setAssetUrl] = useState("");

  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsImage = kind === "banner" || kind === "display";
  const step = (d: number) => setCpc((c) => Math.max(0.05, Math.round((c + d) * 100) / 100));

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("label", headline || "ad creative");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error || "Upload failed.");
        return;
      }
      setAssetUrl(data.url);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!headline.trim()) {
      setError("Add a headline.");
      return;
    }
    if (needsImage && !assetUrl) {
      setError("Upload an image for banner/display ads.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/advertiser/ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          headline: headline.trim(),
          body: body.trim(),
          targetUrl: targetUrl.trim(),
          assetUrl: needsImage ? assetUrl : "",
          bidCents: Math.round(cpc * 100),
          placement,
          active: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      // reset
      setHeadline("");
      setBody("");
      setTargetUrl("");
      setAssetUrl("");
      setCpc(2.5);
      setKind("text");
      setPlacement("inline");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 grid gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Ad type</label>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
          <option value="text">Text</option>
          <option value="banner">Banner</option>
          <option value="display">Display</option>
        </select>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Placement</label>
        <select value={placement} onChange={(e) => setPlacement(e.target.value)} className={inputCls}>
          <option value="inline">Inline</option>
          <option value="sidebar">Sidebar</option>
          <option value="footer">Footer</option>
          <option value="exit">Exit</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Headline</label>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Compare Medigap plans in 60 seconds"
          className={inputCls}
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Licensed agents. No spam. Free quote."
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Target URL</label>
        <input
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          placeholder="https://example.com/quote"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">CPC bid</label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => step(-0.05)} className="btn btn-ghost !py-1.5 !px-3">−</button>
          <div className="flex-1 text-center rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm font-bold">
            ${cpc.toFixed(2)}/click
          </div>
          <button type="button" onClick={() => step(0.05)} className="btn btn-ghost !py-1.5 !px-3">+</button>
        </div>
      </div>

      {needsImage && (
        <div className="sm:col-span-2">
          <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Creative image</label>
          <input type="file" accept="image/*" onChange={onFile} className={`${inputCls} file:mr-3 file:rounded file:border-0 file:bg-[var(--brand)]/20 file:px-3 file:py-1 file:text-[var(--brand)]`} />
          {uploading && <p className="text-xs text-[var(--muted)] mt-1">Uploading…</p>}
          {assetUrl && (
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl} alt="creative preview" className="h-12 rounded border border-[var(--border)]" />
              <span className="text-xs text-[var(--brand)]">Uploaded</span>
            </div>
          )}
        </div>
      )}

      {error && <p className="sm:col-span-2 text-xs text-[var(--danger)]">{error}</p>}

      <div className="sm:col-span-2 flex justify-end">
        <button type="submit" disabled={busy || uploading} className="btn btn-brand disabled:opacity-60">
          {busy ? "Saving…" : "Upload new ad"}
        </button>
      </div>
    </form>
  );
}
