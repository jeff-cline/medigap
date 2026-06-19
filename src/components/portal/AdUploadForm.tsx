"use client";
import { useState } from "react";

export default function AdUploadForm() {
  const [kind, setKind] = useState("text");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");
  const [cpc, setCpc] = useState(2.5);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="card p-5 grid gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Ad type</label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        >
          <option value="text">Text</option>
          <option value="banner">Banner</option>
          <option value="display">Display</option>
        </select>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">CPC bid</label>
        <input
          type="number"
          step="0.05"
          min={0.05}
          value={cpc}
          onChange={(e) => setCpc(Math.max(0.05, Number(e.target.value) || 0.05))}
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Headline</label>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Compare Medigap plans in 60 seconds"
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Licensed agents. No spam. Free quote."
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Target URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/quote"
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--muted)] mb-1">
          Image URL {kind === "text" ? "(banner/display only)" : ""}
        </label>
        <input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          disabled={kind === "text"}
          placeholder="https://cdn.example.com/ad.png"
          className="w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)] disabled:opacity-40"
        />
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <button type="submit" className="btn btn-brand">Upload new ad</button>
      </div>
    </form>
  );
}
