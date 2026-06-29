"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { fmtCents } from "@/lib/tv-cost";

type Spot = {
  id: string; title: string; subtitle: string; script: string; seconds: number;
  sourceUrl: string; videoUrl: string; voiceUrl: string; posterUrl: string;
  clipStart: number; clipDuration: number;
  cropEnabled: boolean; cropX: number; cropY: number; cropW: number; cropH: number;
  lookPrompt: string; status: string; featured: boolean;
  renderStatus: string; renderStage: string; lastError: string;
  costCents: number; costJson: string;
  baseUrl?: string; screen1?: string; screen2?: string; screen3?: string; screen4?: string;
};

// Recommended upload size per hanging monitor (left→right), matching src/lib/tv-screens.ts.
const SCREEN_SIZES = ["320×220", "96×184", "258×182"];
type Props = { isGod: boolean; hasVoice: boolean; hasKey: boolean; hasSync: boolean; hasRunway: boolean; defaultScript: string; spots: Spot[] };

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData(); fd.append("file", file);
  const r = await fetch("/api/tv/upload", { method: "POST", body: fd }).then((x) => x.json()).catch(() => ({}));
  if (!r.ok) throw new Error(r.error || "Upload failed");
  return r.url as string;
}
async function api(body: Record<string, unknown>) {
  return fetch("/api/tv", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((x) => x.json()).catch(() => ({}));
}

const STAGE_LABEL: Record<string, string> = { voice: "🎙️ generating voice…", look: "🎨 restyling look (Runway)…", lipsync: "👄 lip-syncing (Sync.so)…", starting: "starting…" };

export default function TvStudio({ isGod, hasVoice, hasKey, hasSync, hasRunway, defaultScript, spots }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("America's Trusted Toll-Free Number");
  const [script, setScript] = useState(defaultScript);
  const [seconds, setSeconds] = useState(15);
  const [lookPrompt, setLookPrompt] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const srcRef = useRef<HTMLInputElement>(null);
  const [prog, setProg] = useState<Record<string, { status: string; stage?: string; error?: string }>>({});
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  function setP(id: string, v: { status: string; stage?: string; error?: string }) { setProg((p) => ({ ...p, [id]: v })); }

  async function create() {
    if (!title.trim()) { setMsg("Add a title."); return; }
    setBusy("create"); setMsg("");
    try {
      let sourceUrl = "";
      const f = srcRef.current?.files?.[0];
      if (f) { setMsg("Uploading source clip…"); sourceUrl = await uploadFile(f); }
      const r = await api({ action: "create", title, subtitle, script, seconds, sourceUrl, lookPrompt });
      if (!r.ok) throw new Error(r.error || "Create failed");
      setTitle(""); setLookPrompt(""); if (srcRef.current) srcRef.current.value = "";
      setMsg("✅ Spot created — open it below, tighten the framing, and Render."); router.refresh();
    } catch (e) { setMsg(`⚠️ ${(e as Error).message}`); }
    setBusy("");
  }

  function poll(id: string) {
    clearInterval(timers.current[id]);
    timers.current[id] = setInterval(async () => {
      const r = await fetch(`/api/tv/render/status?id=${id}`).then((x) => x.json()).catch(() => ({}));
      setP(id, { status: r.status, stage: r.stage, error: r.error });
      if (r.status === "done" || r.status === "failed" || !r.ok) { clearInterval(timers.current[id]); router.refresh(); }
    }, 5000);
  }

  async function render(id: string) {
    setP(id, { status: "rendering", stage: "starting" });
    const r = await fetch("/api/tv/render", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }).then((x) => x.json()).catch(() => ({}));
    if (!r.ok) { setP(id, { status: "failed", error: r.error }); return; }
    setP(id, { status: "rendering", stage: r.stage }); poll(id);
  }

  const ready = hasVoice && hasSync;

  return (
    <div className="mt-6 space-y-6">
      {/* setup status */}
      <div className="card p-4 text-sm grid gap-1 sm:grid-cols-2">
        <div>{hasKey ? "✅" : "⬜"} ElevenLabs key · {hasVoice ? "✅ voice cloned" : "⬜ clone on /voice"}</div>
        <div>{hasSync ? "✅" : "⬜"} Sync.so (lip-sync) · {hasRunway ? "✅ Runway look prompt" : "⬜ Runway (look prompt) — add key on Integrations"}</div>
        {!ready && <div className="sm:col-span-2 text-[var(--gold)]">Rendering needs the cloned voice + Sync.so. {hasRunway ? "" : "The look-prompt stage stays off until Runway is connected (footage still renders without it)."}</div>}
      </div>

      {/* create */}
      <div className="card p-5 space-y-3">
        <div className="font-semibold">➕ New commercial</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Wink — Game Show 30" className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm" /></label>
          <label className="text-sm">Subtitle<input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm" /></label>
        </div>
        <label className="text-sm block">Script<textarea value={script} onChange={(e) => setScript(e.target.value)} rows={4} className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm leading-relaxed" /></label>
        <label className="text-sm block">Look / background prompt <span className="text-[var(--muted)]">(optional — restyles the footage)</span>
          <input value={lookPrompt} onChange={(e) => setLookPrompt(e.target.value)} placeholder="warm sunset living room, golden light, cinematic" className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm" />
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm flex items-center gap-2">Fit to<input type="number" value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} className="w-20 rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1 text-sm" />sec</label>
          <label className="text-sm">Source face clip <input ref={srcRef} type="file" accept="video/*" className="text-xs" /></label>
          <button onClick={create} disabled={!!busy} className="btn btn-brand text-sm ml-auto">{busy === "create" ? "Saving…" : "Create"}</button>
        </div>
        {msg && <p className="text-xs text-[var(--muted)]">{msg}</p>}
      </div>

      {/* spots */}
      <div className="space-y-4">
        <div className="font-semibold">Your commercials ({spots.length})</div>
        {spots.length === 0 && <div className="card p-4 text-sm text-[var(--muted)]">None yet — create one above.</div>}
        {spots.map((sp) => (
          <SpotCard key={sp.id} sp={sp} isGod={isGod} hasRunway={hasRunway} ready={ready}
            prog={prog[sp.id]} onRender={() => render(sp.id)} onRefresh={() => router.refresh()} />
        ))}
      </div>
    </div>
  );
}

function SpotCard({ sp, isGod, hasRunway, ready, prog, onRender, onRefresh }: {
  sp: Spot; isGod: boolean; hasRunway: boolean; ready: boolean;
  prog?: { status: string; stage?: string; error?: string }; onRender: () => void; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ script: sp.script, seconds: sp.seconds, clipStart: sp.clipStart, clipDuration: sp.clipDuration, cropEnabled: sp.cropEnabled, cropX: sp.cropX, cropY: sp.cropY, cropW: sp.cropW, cropH: sp.cropH, lookPrompt: sp.lookPrompt });
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState("");
  const replaceRef = useRef<HTMLInputElement>(null);
  const [screens, setScreens] = useState<{ type: string; text?: string; url?: string }[]>(() =>
    [sp.screen1, sp.screen2, sp.screen3, sp.screen4].map((s) => { try { return JSON.parse(s || '{"type":"black"}'); } catch { return { type: "black" }; } })
  );
  const [composing, setComposing] = useState(false);
  const [composeMsg, setComposeMsg] = useState("");
  const isTemplate = !!sp.baseUrl;

  function setScreen(i: number, patch: Record<string, unknown>) { setScreens((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s))); }
  async function uploadScreen(i: number, file: File) {
    setComposeMsg(`Uploading to Screen ${i + 1}…`);
    try { const url = await uploadFile(file); setScreen(i, { url }); setComposeMsg(`Screen ${i + 1} media set — Render to see it.`); }
    catch (e) { setComposeMsg(`⚠️ ${(e as Error).message}`); }
  }
  async function renderScreens() {
    setComposing(true); setComposeMsg("Compositing screens onto the spot…");
    await api({ action: "update", id: sp.id, screen1: JSON.stringify(screens[0]), screen2: JSON.stringify(screens[1]), screen3: JSON.stringify(screens[2]), screen4: JSON.stringify(screens[3]) });
    const r = await fetch("/api/tv/compose", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: sp.id }) }).then((x) => x.json()).catch(() => ({}));
    setComposing(false);
    setComposeMsg(r.ok ? "✅ Rendered — playing below." : `⚠️ ${r.error || "render failed"}`);
    onRefresh();
  }

  const rendering = prog?.status === "rendering" || sp.renderStatus === "rendering";
  const stage = prog?.stage || sp.renderStage;
  let cost: { total?: number; voice?: number; lipsync?: number; look?: number; chars?: number; lipsyncSec?: number } = {};
  try { cost = JSON.parse(sp.costJson || "{}"); } catch {}

  async function save() {
    setSaving(true);
    let sourceUrl: string | undefined;
    const rf = replaceRef.current?.files?.[0];
    if (rf) { try { sourceUrl = await uploadFile(rf); } catch {} }
    await api({ action: "update", id: sp.id, ...f, ...(sourceUrl ? { sourceUrl } : {}) });
    setSaving(false); if (replaceRef.current) replaceRef.current.value = ""; onRefresh();
  }
  async function act(action: string, body: Record<string, unknown> = {}) { setActing(action); await api({ action, id: sp.id, ...body }); setActing(""); onRefresh(); }

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-80 max-w-full shrink-0">
          {sp.videoUrl ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video key={sp.videoUrl} src={sp.videoUrl} poster={sp.posterUrl || undefined} controls preload="metadata" playsInline className="w-80 max-w-full rounded bg-black aspect-video object-contain" />
          ) : (
            <div className="w-80 max-w-full aspect-video rounded bg-black/80 grid place-items-center text-white/50 text-[11px]">{sp.sourceUrl ? "source ready" : "no source"}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">{sp.title} {sp.featured && <span className="text-[var(--gold)] text-xs">★</span>}</div>
          <div className="text-xs text-[var(--muted)]">{sp.subtitle}</div>
          <div className="mt-1 flex flex-wrap gap-1.5 items-center text-[10px]">
            <span className={`rounded-full px-2 py-0.5 font-semibold ${sp.status === "approved" ? "bg-[var(--brand2)]/15 text-[var(--brand2)]" : "bg-[var(--gold)]/15 text-[var(--gold)]"}`}>{sp.status === "approved" ? "● LIVE" : "draft"}</span>
            {rendering && <span className="rounded-full px-2 py-0.5 bg-[var(--brand)]/15 text-[var(--brand)] animate-pulse">{STAGE_LABEL[stage || ""] || "rendering…"}</span>}
            {sp.renderStatus === "done" && !rendering && <span className="rounded-full px-2 py-0.5 bg-[var(--brand2)]/15 text-[var(--brand2)]">✓ rendered</span>}
            {(prog?.status === "failed" || sp.renderStatus === "failed") && <span className="rounded-full px-2 py-0.5 bg-[var(--danger)]/15 text-[var(--danger)]" title={prog?.error || sp.lastError}>render failed</span>}
            {isGod && sp.costCents > 0 && <span className="rounded-full px-2 py-0.5 bg-[var(--panel2)]" title={`voice ${fmtCents(cost.voice || 0)} · lip-sync ${fmtCents(cost.lipsync || 0)} · look ${fmtCents(cost.look || 0)}`}>💵 {fmtCents(sp.costCents)}/spot</span>}
          </div>
          {(prog?.error || (sp.lastError && sp.renderStatus === "failed")) && <div className="text-[11px] text-[var(--danger)] mt-1">{prog?.error || sp.lastError}</div>}

          <div className="mt-3 flex flex-wrap gap-2">
            {isTemplate
              ? <button onClick={() => { setOpen(true); renderScreens(); }} disabled={composing} className="btn btn-brand text-xs">{composing ? "Rendering…" : sp.videoUrl ? "↻ Render screens" : "🖥 Render screens"}</button>
              : <button onClick={onRender} disabled={rendering || !ready || !sp.sourceUrl} className="btn btn-brand text-xs">{rendering ? "Rendering…" : sp.videoUrl ? "↻ Re-render" : "🎬 Render"}</button>}
            <button onClick={() => act("duplicate")} disabled={acting === "duplicate"} className="btn btn-ghost text-xs" title="Clone this spot as a new draft, then assign new screen content">{acting === "duplicate" ? "Duplicating…" : "⧉ Duplicate"}</button>
            <button onClick={() => setOpen((o) => !o)} className="btn btn-ghost text-xs">{open ? "Hide settings" : "⚙ Settings"}</button>
            <button onClick={() => act("approve", { approved: sp.status !== "approved" })} disabled={acting === "approve" || (!sp.videoUrl && sp.status !== "approved")} className={`btn text-xs ${sp.status === "approved" ? "btn-ghost" : "btn-brand"}`} title={!sp.videoUrl ? "Render first" : ""}>{sp.status === "approved" ? "Take down" : "🚀 Go Live"}</button>
            <button onClick={() => act("feature", { featured: !sp.featured })} className="btn btn-ghost text-xs">{sp.featured ? "Unstar" : "★ Star"}</button>
            {sp.videoUrl && <a href={sp.videoUrl} download={`1-800-MEDIGAP-${sp.id}.mp4`} className="btn btn-ghost text-xs">⬇ Download</a>}
            <button onClick={() => { if (confirm("Delete this spot?")) act("delete"); }} className="btn btn-ghost text-xs text-[var(--danger)] ml-auto">Delete</button>
          </div>
        </div>
      </div>

      {open && isTemplate && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">🖥 The 4 hanging screens (left → right) — assign content, then Render screens</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {screens.slice(0, 3).map((sc, i) => (
              <div key={i} className="rounded-lg border border-[var(--border)] p-3 bg-[var(--panel2)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">SCREEN {i + 1}</span>
                  <span className="text-[10px] text-[var(--muted)]">{SCREEN_SIZES[i]} px</span>
                </div>
                <select value={sc.type} onChange={(e) => setScreen(i, { type: e.target.value })} className="w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-xs mb-2">
                  <option value="black">Black (labeled)</option>
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
                {sc.type === "text" && <textarea value={sc.text || ""} onChange={(e) => setScreen(i, { text: e.target.value })} rows={3} placeholder="On-screen text…" className="w-full rounded border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-xs" />}
                {(sc.type === "image" || sc.type === "video") && (
                  <div>
                    <input type="file" accept={sc.type === "image" ? "image/*" : "video/*"} onChange={(e) => { const f0 = e.target.files?.[0]; if (f0) uploadScreen(i, f0); }} className="text-[10px] w-full" />
                    {sc.url && <div className="text-[10px] text-[var(--brand2)] truncate mt-1">✓ {sc.url.split("/").pop()}</div>}
                    <div className="text-[10px] text-[var(--muted)] mt-1">Make it {SCREEN_SIZES[i]} px so it fills the screen cleanly.</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={renderScreens} disabled={composing} className="btn btn-brand text-sm">{composing ? "Rendering…" : "🎬 Render screens"}</button>
            {composeMsg && <span className="text-xs text-[var(--muted)]">{composeMsg}</span>}
          </div>
        </div>
      )}

      {open && !isTemplate && (
        <div className="mt-4 border-t border-[var(--border)] pt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs sm:col-span-2">Script<textarea value={f.script} onChange={(e) => setF({ ...f, script: e.target.value })} rows={3} className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1.5 text-sm" /></label>
          <label className="text-xs">Fit to seconds<input type="number" value={f.seconds} onChange={(e) => setF({ ...f, seconds: Number(e.target.value) })} className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1 text-sm" /></label>
          <label className="text-xs">Replace source clip<input ref={replaceRef} type="file" accept="video/*" className="mt-1 block text-xs" /></label>
          <div className="sm:col-span-2 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mt-1">Tighten framing (manual)</div>
          <label className="text-xs">Trim start (sec)<input type="number" step="0.1" value={f.clipStart} onChange={(e) => setF({ ...f, clipStart: Number(e.target.value) })} className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1 text-sm" /></label>
          <label className="text-xs">Clip length (sec, 0=auto)<input type="number" step="0.1" value={f.clipDuration} onChange={(e) => setF({ ...f, clipDuration: Number(e.target.value) })} className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1 text-sm" /></label>
          <label className="text-xs sm:col-span-2 flex items-center gap-2"><input type="checkbox" checked={f.cropEnabled} onChange={(e) => setF({ ...f, cropEnabled: e.target.checked })} /> Crop to tighten on the face (zoom in)</label>
          {f.cropEnabled && (["cropX", "cropY", "cropW", "cropH"] as const).map((k) => (
            <label key={k} className="text-xs">{k.replace("crop", "")} %<input type="number" value={f[k]} onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })} className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1 text-sm" /></label>
          ))}
          <label className="text-xs sm:col-span-2">Look / background prompt {hasRunway ? "" : <span className="text-[var(--gold)]">(needs Runway key)</span>}
            <input value={f.lookPrompt} onChange={(e) => setF({ ...f, lookPrompt: e.target.value })} placeholder="cinematic golden-hour living room" className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1 text-sm" />
          </label>
          <div className="sm:col-span-2"><button onClick={save} disabled={saving} className="btn btn-brand text-xs">{saving ? "Saving…" : "Save settings"}</button></div>
        </div>
      )}
    </div>
  );
}
