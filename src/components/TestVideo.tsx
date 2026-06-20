"use client";
import { useState } from "react";

type Brief = { headline: string; subhead: string; concept: string };
type RefAnalysis = { description: string; words: string[]; colors: string[] };
type Phase = "image" | "video" | "done" | "error" | "image-done";
type Fmt = {
  key: string; label: string; ratio: string; note: string;
  imageTask: string; promptText: string;
  imageUrl: string; videoTask: string; videoUrl: string;
  phase: Phase; error?: string;
};

const DEFAULT_PROMPT =
  "A warm, trustworthy ad for a free senior Medicare service — real, smiling older Americans, soft natural light, teal & blue brand. Emphasize 'talk to a licensed specialist, free.'";

export default function TestVideo() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [usedResearch, setUsedResearch] = useState(false);
  const [formats, setFormats] = useState<Fmt[]>([]);
  const [refUrl, setRefUrl] = useState("");
  const [refName, setRefName] = useState("");
  const [refUploading, setRefUploading] = useState(false);
  const [refAnalysis, setRefAnalysis] = useState<RefAnalysis | null>(null);
  const [drag, setDrag] = useState(false);

  function update(key: string, patch: Partial<Fmt>) {
    setFormats((cur) => cur.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }

  async function uploadRef(file: File) {
    if (!file.type.startsWith("image/")) { setErr("Drop an image (PNG/JPG/WebP). For a PDF, export a page as an image first."); return; }
    setRefUploading(true); setErr(""); setRefAnalysis(null);
    const fd = new FormData();
    fd.append("file", file); fd.append("label", "Campaign reference");
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    setRefUploading(false);
    if (d.url) { setRefUrl(d.url); setRefName(file.name); } else setErr(d.error || "Upload failed.");
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files?.[0]; if (f) uploadRef(f);
  }

  async function launch() {
    setBusy(true); setErr(""); setBrief(null); setFormats([]); setRefAnalysis(null);
    setStatus(refUrl ? "Reading your reference, researching & writing the brief…" : "Researching & writing the creative brief…");
    const r = await fetch("/api/runway/campaign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, referenceUrl: refUrl || undefined }) });
    const d = await r.json().catch(() => ({}));
    if (d.error || !d.ok) { setErr(d.error || "Campaign failed."); setBusy(false); setStatus(""); return; }
    setBrief(d.brief); setUsedResearch(!!d.usedResearch); setRefAnalysis(d.reference || null);
    const fmts: Fmt[] = (d.formats || []).map((f: Fmt) => ({
      ...f, imageUrl: "", videoTask: "", videoUrl: "",
      phase: f.imageTask ? "image" : "error", error: f.imageTask ? undefined : (f.error || "image task failed"),
    }));
    setFormats(fmts);
    setStatus("Rendering 3 packages — Facebook, Instagram, TV/digital…");
    // Drive every format independently.
    fmts.forEach((f) => { if (f.imageTask) drive(f); });
    setBusy(false);
  }

  async function drive(f: Fmt, n = 0) {
    if (n > 80) { update(f.key, { phase: "error", error: "Timed out — check RunwayML." }); return; }
    const r = await fetch("/api/runway/advance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ratio: f.ratio, promptText: f.promptText, imageTask: f.imageTask, imageUrl: f.imageUrl, videoTask: f.videoTask }),
    });
    const d = await r.json().catch(() => ({}));
    const next: Fmt = { ...f, imageUrl: d.imageUrl || f.imageUrl, videoTask: d.videoTask || f.videoTask, videoUrl: d.videoUrl || "", phase: d.phase || f.phase, error: d.error };
    update(f.key, { imageUrl: next.imageUrl, videoTask: next.videoTask, videoUrl: next.videoUrl, phase: next.phase, error: next.error });
    if (d.phase === "done" || d.phase === "error") return;
    setTimeout(() => drive(next, n + 1), 6000);
  }

  const phaseLabel: Record<Phase, string> = {
    image: "Rendering image…", "image-done": "Image ready — starting video…",
    video: "Rendering video (1-3 min)…", done: "Done ✓", error: "Failed",
  };

  return (
    <div className="card glow p-5">
      <div className="font-semibold mb-1">🎬 Video Marketing — God test</div>
      <p className="text-xs text-[var(--muted)] mb-3">
        Edit the prompt, then launch. Grok does deep research and writes an out-of-script, broadcast-grade concept, then
        RunwayML renders the <b>full image + full video</b> in three native packages: <b>Facebook</b> (1:1),{" "}
        <b>Instagram</b> (9:16 reel) and a <b>TV / digital</b> cut (16:9) for vibe.co &amp; Google.
      </p>

      <label className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Your prompt</label>
      <textarea className="text-sm mt-1" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />

      <label className="text-[10px] uppercase tracking-wide text-[var(--muted)] mt-3 block">Brand reference (optional) — drop a logo, flyer or screenshot; we read its image, words &amp; colors</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`mt-1 rounded-xl border border-dashed p-3 flex items-center gap-3 ${drag ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-[var(--border)] bg-[var(--panel2)]"}`}
      >
        {refUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={refUrl} alt={refName} className="h-12 w-12 object-cover rounded-lg border border-[var(--border)]" />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-[var(--panel)] grid place-items-center text-lg">📎</div>
        )}
        <div className="text-xs text-[var(--muted)] flex-1">
          {refUploading ? "Uploading…" : refUrl ? <span className="text-[var(--text)]">{refName} attached — Claude will read it on launch.</span> : "Drag an image here, or"}
          {!refUploading && (
            <label className="ml-2 underline cursor-pointer text-[var(--brand)]">
              {refUrl ? "replace" : "browse"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadRef(e.target.files[0])} />
            </label>
          )}
          {refUrl && <button type="button" onClick={() => { setRefUrl(""); setRefName(""); setRefAnalysis(null); }} className="ml-2 underline text-[var(--danger)]">remove</button>}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <button onClick={launch} disabled={busy || !prompt.trim()} className="btn btn-brand text-sm">{busy ? "Launching…" : "Deep-research & launch campaign →"}</button>
        {status && <span className="text-sm text-[var(--muted)]">{status}</span>}
      </div>
      {err && <p className="text-sm text-[var(--danger)] mt-2">{err}</p>}

      {refAnalysis && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--panel2)] p-4">
          <div className="text-[10px] uppercase tracking-wide text-[var(--muted)] mb-1">What we read from your reference</div>
          {refAnalysis.description && <p className="text-sm text-[var(--muted)]">{refAnalysis.description}</p>}
          {refAnalysis.words.length > 0 && <p className="text-xs mt-2"><span className="text-[var(--muted)]">Words: </span>{refAnalysis.words.join(" · ")}</p>}
          {refAnalysis.colors.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-[var(--muted)]">Colors:</span>
              {refAnalysis.colors.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 text-[11px] font-mono">
                  <span className="h-4 w-4 rounded border border-[var(--border)]" style={{ background: c }} />{c}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {brief && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--panel2)] p-4">
          <div className="text-[10px] uppercase tracking-wide text-[var(--muted)] mb-1">{usedResearch ? "AI creative brief (deep research)" : "Creative brief (connect xAI for deep research)"}</div>
          {brief.headline && <div className="text-lg font-bold">{brief.headline}</div>}
          {brief.subhead && <div className="text-sm text-[var(--brand)]">{brief.subhead}</div>}
          {brief.concept && <p className="text-sm text-[var(--muted)] mt-2">{brief.concept}</p>}
        </div>
      )}

      {formats.length > 0 && (
        <div className="grid gap-4 mt-5 md:grid-cols-3">
          {formats.map((f) => (
            <div key={f.key} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">{f.label}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${f.phase === "done" ? "bg-[var(--brand)]/20 text-[var(--brand)]" : f.phase === "error" ? "bg-[var(--danger)]/20 text-[var(--danger)]" : "bg-white/5 text-[var(--muted)]"}`}>
                  {f.phase === "error" ? (f.error || "failed") : phaseLabel[f.phase]}
                </span>
              </div>
              <div className="text-[10px] text-[var(--muted)] mb-2">{f.note} · {f.ratio}</div>
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {f.imageUrl && <img src={f.imageUrl} alt={`${f.label} still`} className="rounded-lg w-full" />}
                {f.videoUrl && <video src={f.videoUrl} controls className="rounded-lg w-full" />}
                {!f.imageUrl && f.phase !== "error" && <div className="aspect-square rounded-lg bg-[var(--panel2)] grid place-items-center text-xs text-[var(--muted)]">rendering…</div>}
              </div>
              {f.phase === "done" && (
                <div className="flex gap-2 mt-2">
                  {f.imageUrl && <a href={f.imageUrl} download target="_blank" rel="noreferrer" className="btn btn-ghost text-[11px] !py-1">Image ↓</a>}
                  {f.videoUrl && <a href={f.videoUrl} download target="_blank" rel="noreferrer" className="btn btn-ghost text-[11px] !py-1">Video ↓</a>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
