"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type BriefPage = { slug: string; title: string; intent: string; keywords: string[] };
type Brief = { audience: string; brandColor: string; heroHeadline: string; tagline: string; pages: BriefPage[]; faqs: { q: string }[]; blog: BriefPage[]; sponsorPhone: string };
type Progress = { done?: number; total?: number; current?: string; error?: string };

type Phase = "idle" | "engineering" | "review" | "building" | "done" | "error";

export default function EngineerSiteButton({ id, hostname, name, goal }: { id: string; hostname: string; name: string; goal: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [prompt, setPrompt] = useState(goal || "");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [error, setError] = useState("");
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (poll.current) clearInterval(poll.current); }, []);

  async function engineer() {
    setPhase("engineering"); setError("");
    const r = await fetch("/api/sites/engineer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, prompt }) });
    const d = await r.json().catch(() => ({}));
    if (d.ok && d.brief) { setBrief(d.brief); setPhase("review"); }
    else { setError(d.error || "Could not engineer the brief."); setPhase("idle"); }
  }

  async function build() {
    if (!brief) return;
    setPhase("building"); setError("");
    const r = await fetch("/api/sites/build", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, brief }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.error) { setError(d.error || "Build failed to start."); setPhase("review"); return; }
    poll.current = setInterval(async () => {
      const s = await fetch(`/api/sites/${id}/build-status`, { cache: "no-store" }).then((x) => x.json()).catch(() => null);
      if (!s) return;
      setProgress(s.progress || {});
      if (s.buildStatus === "complete") { stopPoll(); setPhase("done"); router.refresh(); }
      else if (s.buildStatus === "error") { stopPoll(); setError(s.progress?.error || "Build error."); setPhase("error"); }
    }, 2500);
  }
  function stopPoll() { if (poll.current) { clearInterval(poll.current); poll.current = null; } }

  function close() { stopPoll(); setOpen(false); setPhase("idle"); setBrief(null); setProgress({}); setError(""); }

  const pct = progress.total ? Math.round(((progress.done || 0) / progress.total) * 100) : 0;

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-ghost text-xs !py-1.5 !px-3 text-[var(--gold)]" title="Use Claude to research & build this whole site from a prompt">⚙ Engineer new prompt</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4" onClick={close}>
          <div className="card w-full max-w-2xl my-8 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Engineer site — <span className="text-[var(--brand)]">{hostname}</span></h2>
              <button onClick={close} className="text-[var(--muted)] hover:text-[var(--text)]">✕</button>
            </div>

            {/* PROMPT */}
            {(phase === "idle" || phase === "engineering") && (
              <>
                <p className="text-sm text-[var(--muted)] mb-2">Describe the site you want. Claude will research the niche, plan the pages, FAQ and blog, then build it in one shot — styled to match {name}&apos;s homepage.</p>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={7} className="w-full" placeholder="e.g. A resource hub for adult children caring for aging parents: senior housing, memory care, Medicare help… include a 20-question FAQ and a blog." />
                {error && <p className="text-sm text-[var(--danger)] mt-2">{error}</p>}
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={close} className="btn btn-ghost text-sm">Cancel</button>
                  <button onClick={engineer} disabled={phase === "engineering" || prompt.trim().length < 10} className="btn btn-brand text-sm">{phase === "engineering" ? "Engineering brief…" : "Engineer brief →"}</button>
                </div>
              </>
            )}

            {/* REVIEW BRIEF */}
            {phase === "review" && brief && (
              <>
                <div className="space-y-3 text-sm max-h-[55vh] overflow-y-auto pr-1">
                  <div className="rounded-lg bg-[var(--panel2)] p-3">
                    <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Hero headline</div>
                    <input value={brief.heroHeadline} onChange={(e) => setBrief({ ...brief, heroHeadline: e.target.value })} className="mt-1" />
                    <div className="text-xs uppercase tracking-wide text-[var(--muted)] mt-2">Tagline</div>
                    <input value={brief.tagline} onChange={(e) => setBrief({ ...brief, tagline: e.target.value })} className="mt-1" />
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-[var(--muted)]">Brand color</span>
                      <input type="color" value={brief.brandColor} onChange={(e) => setBrief({ ...brief, brandColor: e.target.value })} className="!w-10 !h-7 !p-0" />
                      <span className="text-xs text-[var(--muted)]">{brief.brandColor}</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Resource pages ({brief.pages.length})</div>
                    <ul className="list-disc list-inside text-[var(--muted)] space-y-0.5">{brief.pages.map((p) => <li key={p.slug}>{p.title}</li>)}</ul>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Blog posts ({brief.blog.length})</div>
                    <ul className="list-disc list-inside text-[var(--muted)] space-y-0.5">{brief.blog.map((p) => <li key={p.slug}>{p.title}</li>)}</ul>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">FAQ ({brief.faqs.length} questions)</div>
                    <ul className="list-disc list-inside text-[var(--muted)] space-y-0.5">{brief.faqs.slice(0, 5).map((f, i) => <li key={i}>{f.q}</li>)}{brief.faqs.length > 5 && <li>…and {brief.faqs.length - 5} more</li>}</ul>
                  </div>
                </div>
                {error && <p className="text-sm text-[var(--danger)] mt-2">{error}</p>}
                <div className="mt-4 flex justify-between gap-2">
                  <button onClick={() => setPhase("idle")} className="btn btn-ghost text-sm">← Edit prompt</button>
                  <button onClick={build} className="btn btn-brand text-sm">⚡ Build {brief.pages.length + brief.blog.length + 2} pages</button>
                </div>
              </>
            )}

            {/* BUILDING */}
            {phase === "building" && (
              <div className="py-4">
                <div className="text-sm mb-2">Building… <span className="text-[var(--muted)]">{progress.current || "starting"}</span></div>
                <div className="h-2 rounded-full bg-[var(--panel2)] overflow-hidden"><div className="h-full bg-[var(--brand)] transition-all" style={{ width: `${pct}%` }} /></div>
                <div className="text-xs text-[var(--muted)] mt-2">{progress.done || 0} / {progress.total || "?"} pages · this can take a few minutes. You can leave this open.</div>
              </div>
            )}

            {/* DONE */}
            {phase === "done" && (
              <div className="py-4 text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="font-semibold">Site built — {progress.done} pages live.</div>
                <a href={`https://${hostname}`} target="_blank" rel="noopener" className="btn btn-brand text-sm mt-4">View {hostname} →</a>
                <button onClick={close} className="btn btn-ghost text-sm mt-2 block mx-auto">Close</button>
              </div>
            )}

            {phase === "error" && (
              <div className="py-4">
                <p className="text-sm text-[var(--danger)]">{error}</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setPhase(brief ? "review" : "idle")} className="btn btn-ghost text-sm">Back</button>
                  <button onClick={close} className="btn btn-ghost text-sm">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
