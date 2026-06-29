"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Result = { audioBase64: string; duration: number; speed: number; fit: boolean; target: number; suggestion?: string };

export default function VoiceStudio({ hasKey, hasVoice, defaultScript }: { hasKey: boolean; hasVoice: boolean; defaultScript: string }) {
  const router = useRouter();
  const [text, setText] = useState(defaultScript);
  const [seconds, setSeconds] = useState(30);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState("");
  const [cloning, setCloning] = useState(false);
  const [cloneMsg, setCloneMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const words = text.trim().split(/\s+/).filter(Boolean).length;

  async function clone() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setCloneMsg("Choose the voice sample file first."); return; }
    setCloning(true); setCloneMsg("Cloning the voice in ElevenLabs…");
    const fd = new FormData(); fd.append("file", file); fd.append("name", "1-800-MEDIGAP Voice");
    const r = await fetch("/api/voiceover/clone", { method: "POST", body: fd }).then((x) => x.json()).catch(() => ({}));
    setCloning(false);
    if (r.ok) { setCloneMsg(`✅ Voice cloned (id ${r.voiceId.slice(0, 10)}…). You can generate now.`); router.refresh(); }
    else setCloneMsg(`⚠️ ${r.error || "Clone failed"}`);
  }

  async function generate() {
    setBusy(true); setErr(""); setRes(null);
    const r = await fetch("/api/voiceover", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, seconds }) }).then((x) => x.json()).catch(() => ({}));
    setBusy(false);
    if (r.ok) setRes(r);
    else setErr(r.error || "Generation failed");
  }

  const audioSrc = res ? `data:audio/mpeg;base64,${res.audioBase64}` : "";

  return (
    <div className="mt-6 space-y-5">
      {/* setup status */}
      {(!hasKey || !hasVoice) && (
        <div className="card p-4 border-l-4 border-[var(--gold)]">
          <div className="text-sm font-medium mb-1">Setup ({hasKey ? "✅" : "⬜"} API key · {hasVoice ? "✅" : "⬜"} cloned voice)</div>
          {!hasKey && <p className="text-xs text-[var(--muted)]">1) Create an <b>ElevenLabs</b> account → Profile → API key, and paste it on the <a href="/dashboard/integrations" className="text-[var(--brand)]">Integrations</a> page (&ldquo;ElevenLabs Voice&rdquo;).</p>}
          {hasKey && !hasVoice && (
            <div className="mt-2">
              <p className="text-xs text-[var(--muted)] mb-2">2) Clone your voice — upload the extracted sample (e.g. <code className="text-[var(--brand2)]">medigap-voice-sample.m4a</code>).</p>
              <div className="flex flex-wrap gap-2 items-center">
                <input ref={fileRef} type="file" accept="audio/*,.m4a,.mp3,.wav" className="text-xs" />
                <button onClick={clone} disabled={cloning} className="btn btn-brand text-xs">{cloning ? "Cloning…" : "Clone this voice"}</button>
              </div>
              {cloneMsg && <p className="text-xs text-[var(--muted)] mt-1">{cloneMsg}</p>}
            </div>
          )}
        </div>
      )}

      {/* script + timing */}
      <div className="card p-5">
        <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Script</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm leading-relaxed" />
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <label className="text-sm flex items-center gap-2">Fit to
            <input type="number" value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} className="w-20 rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1 text-sm" /> seconds
          </label>
          <span className="text-xs text-[var(--muted)]">{words} words · ~{(words / 2.5).toFixed(0)}s at a natural pace</span>
          <button onClick={generate} disabled={busy || !hasVoice} className="btn btn-brand text-sm ml-auto">{busy ? "Generating…" : "🎙️ Generate voiceover"}</button>
        </div>
      </div>

      {err && <div className="card p-3 text-sm text-[var(--danger)]">⚠️ {err}</div>}

      {/* output */}
      {res && (
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${res.fit ? "bg-[var(--brand)]/15 text-[var(--brand)]" : "bg-[var(--gold)]/15 text-[var(--gold)]"}`}>
              {res.fit ? "✅ fits" : "⚠ off-target"} · {res.duration}s {res.target ? `/ ${res.target}s target` : ""} · speed {res.speed.toFixed(2)}×
            </span>
          </div>
          <audio src={audioSrc} controls className="w-full" />
          {res.suggestion && <p className="text-xs text-[var(--gold)] mt-2">{res.suggestion}</p>}
          <div className="flex gap-2 mt-3">
            <a href={audioSrc} download="1-800-MEDIGAP-voiceover.mp3" className="btn btn-brand text-sm">⬇ Download MP3 (for Runway)</a>
          </div>
        </div>
      )}

      {/* API */}
      <details className="card overflow-hidden">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium">🔌 Use it as an API (for Runway / automation)</summary>
        <div className="border-t border-[var(--border)] p-4 text-xs">
          <p className="text-[var(--muted)] mb-2">POST your script + target seconds; get back the mp3 (base64) + exact duration. Same cloned voice every time.</p>
          <pre className="bg-[var(--panel2)] rounded p-3 overflow-x-auto text-[11px]">{`curl -X POST https://medigap.plus/api/voiceover \\
  -H "content-type: application/json" \\
  -b "session=<your session cookie>" \\
  -d '{"text":"Your script...","seconds":30}'
# → { audioBase64, duration, speed, fit, suggestion }`}</pre>
          <p className="text-[var(--muted)] mt-2">Decode <code>audioBase64</code> → an mp3 file, then import it as the voice track in Runway.</p>
        </div>
      </details>
    </div>
  );
}
