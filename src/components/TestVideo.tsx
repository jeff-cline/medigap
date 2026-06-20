"use client";
import { useState } from "react";

export default function TestVideo() {
  const [prompt, setPrompt] = useState("A warm, trustworthy 9:16 ad for a senior Medicare service — smiling older couple, soft light, bold headline space, teal & blue brand.");
  const [busy, setBusy] = useState(false);
  const [img, setImg] = useState("");
  const [video, setVideo] = useState("");
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");

  async function run() {
    setBusy(true); setErr(""); setImg(""); setVideo(""); setStatus("Generating image…");
    const r = await fetch("/api/runway/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
    const d = await r.json().catch(() => ({}));
    if (d.error) { setErr(d.error); setBusy(false); setStatus(""); return; }
    if (d.imageUrl) setImg(d.imageUrl);
    if (d.videoTask) { setStatus("Rendering video (1-3 min)…"); poll(d.videoTask); }
    else { setStatus("Image rendering — try again in a moment."); setBusy(false); }
  }
  async function poll(taskId: string, n = 0) {
    if (n > 30) { setStatus("Still rendering — check RunwayML."); setBusy(false); return; }
    const r = await fetch(`/api/runway/task/${taskId}`);
    const d = await r.json().catch(() => ({}));
    if (d.status === "SUCCEEDED" && d.urls?.[0]) { setVideo(d.urls[0]); setStatus("Done ✓"); setBusy(false); return; }
    if (d.status === "FAILED") { setErr("Video generation failed."); setBusy(false); setStatus(""); return; }
    setTimeout(() => poll(taskId, n + 1), 6000);
  }

  return (
    <div className="card glow p-5">
      <div className="font-semibold mb-1">🎬 Test video marketing capacity</div>
      <p className="text-xs text-[var(--muted)] mb-3">Drop a prompt → get a high-quality vertical (9:16) image + a Facebook/Instagram-ready video via RunwayML.</p>
      <textarea className="text-sm" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button onClick={run} disabled={busy} className="btn btn-brand text-sm mt-3">{busy ? "Working…" : "Generate test video →"}</button>
      {status && <span className="ml-3 text-sm text-[var(--muted)]">{status}</span>}
      {err && <p className="text-sm text-[var(--danger)] mt-2">{err}</p>}
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        {img && <div><div className="text-xs text-[var(--muted)] mb-1">Image</div>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={img} alt="generated" className="rounded-xl w-full max-w-[260px]" /></div>}
        {video && <div><div className="text-xs text-[var(--muted)] mb-1">Video</div><video src={video} controls className="rounded-xl w-full max-w-[260px]" /></div>}
      </div>
    </div>
  );
}
