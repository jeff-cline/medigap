"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { triggerConflicts, type ExistingRule } from "@/lib/static/trigger-check";

type ShortLink = { id: string; word: string; short: string; uses: number };
type Props = { children: React.ReactNode; rules: ExistingRule[]; moneyWords: string[]; shortlinks: ShortLink[] };

// Bigger font for links used more often (keyword-cloud feel). All bright white.
function cloudSize(uses: number): string {
  if (uses >= 20) return "text-3xl";
  if (uses >= 10) return "text-2xl";
  if (uses >= 4) return "text-xl";
  if (uses >= 1) return "text-lg";
  return "text-base";
}

// Wraps transcript content: highlight a phrase → a button opens a modal to teach the agent a
// response right there (with an overlap check, send-timing, and a click-to-insert link cloud).
export default function TranscriptTeach({ children, rules, moneyWords, shortlinks }: Props) {
  const router = useRouter();
  const [sel, setSel] = useState("");
  const [open, setOpen] = useState(false);

  const capture = () => {
    if (open) return;
    const raw = typeof window !== "undefined" ? window.getSelection()?.toString() ?? "" : "";
    setSel(raw.replace(/\s+/g, " ").trim().slice(0, 80));
  };

  return (
    <div onMouseUp={capture} className="relative">
      {children}
      {sel && !open && (
        <div className="sticky bottom-3 z-10 flex justify-center mt-3">
          <button
            onClick={() => setOpen(true)}
            className="rounded-full bg-[color:#1f6feb] hover:bg-[color:#388bfd] text-white text-sm font-semibold px-4 py-2 shadow-lg"
          >
            🎓 Teach a response for “{sel.length > 32 ? sel.slice(0, 32) + "…" : sel}”
          </button>
        </div>
      )}
      {open && (
        <TeachModal
          initialTrigger={sel}
          rules={rules}
          moneyWords={moneyWords}
          shortlinks={shortlinks}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); setSel(""); router.refresh(); }}
        />
      )}
    </div>
  );
}

function TeachModal({ initialTrigger, rules, moneyWords, shortlinks, onClose, onSaved }: { initialTrigger: string; rules: ExistingRule[]; moneyWords: string[]; shortlinks: ShortLink[]; onClose: () => void; onSaved: () => void }) {
  const [trigger, setTrigger] = useState(initialTrigger);
  const [response, setResponse] = useState("");
  const [sms, setSms] = useState("");
  const [smsWhen, setSmsWhen] = useState<"immediate" | "next_business_day">("immediate");
  const [smsHour, setSmsHour] = useState(10);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState("");

  const conflicts = useMemo(() => triggerConflicts(trigger, { rules, moneyWords }), [trigger, rules, moneyWords]);

  // Click a keyword → copy its short link (with confirmation it matched), drop it into the
  // text-to-send box, and bump its use count so the most-used keywords grow in the cloud.
  const useLink = (l: ShortLink) => {
    navigator.clipboard?.writeText(l.short).catch(() => {});
    setSms((prev) => (prev.trim() ? `${prev.trim()} ${l.short}` : l.short));
    setCopied(l.id);
    setTimeout(() => setCopied(""), 2000);
    fetch("/api/shorten/manage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "use", id: l.id }) }).catch(() => {});
  };

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/static/agent-rules", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", trigger, response, sms, smsWhen, smsHour, smsMinute: 0, continueMenu: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-4xl rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Teach a response</h2>
          <button className="text-[var(--muted)] hover:text-[var(--text)]" onClick={onClose}>✕</button>
        </div>

        {err && <div className="rounded border border-[var(--danger)] text-[var(--danger)] text-sm px-3 py-2 mb-3">{err}</div>}

        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          {/* Left: the rule form */}
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">When a caller says (trigger phrases, comma-separated)</label>
            <input className="w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1.5 text-sm mb-1" value={trigger} onChange={(e) => setTrigger(e.target.value)} />
            {conflicts.length > 0 ? (
              <div className="rounded border border-[color:#9a6700] bg-[color:#3a2d00] text-[color:#f0c000] text-xs px-3 py-2 mb-3">
                <div className="font-semibold mb-0.5">⚠ Heads up — this overlaps something:</div>
                {conflicts.map((c, i) => <div key={i}>• {c}</div>)}
              </div>
            ) : (
              trigger.trim() && <div className="text-xs text-[color:#3fb950] mb-3">✓ No overlap — this trigger is unique.</div>
            )}

            <label className="block text-xs text-[var(--muted)] mb-1">What the agent says</label>
            <textarea className="w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-2 text-sm min-h-[80px] mb-3" placeholder="e.g. I can text you more information — meanwhile, let me see how we can help." value={response} onChange={(e) => setResponse(e.target.value)} />

            <label className="block text-xs text-[var(--muted)] mb-1">Text to send from 1-800-MEDIGAP (optional)</label>
            <textarea className="w-full rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-2 text-sm min-h-[70px] mb-2" placeholder="Info + a link (click a link on the right to add it)…" value={sms} onChange={(e) => setSms(e.target.value)} />
            {sms.trim() && (
              <div className="flex flex-wrap items-center gap-3 text-sm mb-2">
                <label className="flex items-center gap-1"><input type="radio" checked={smsWhen === "immediate"} onChange={() => setSmsWhen("immediate")} /> Send immediately</label>
                <label className="flex items-center gap-1"><input type="radio" checked={smsWhen === "next_business_day"} onChange={() => setSmsWhen("next_business_day")} /> Next business day at</label>
                {smsWhen === "next_business_day" && (
                  <select className="rounded border border-[var(--border)] bg-[var(--panel2)] px-2 py-1" value={smsHour} onChange={(e) => setSmsHour(Number(e.target.value))}>
                    {Array.from({ length: 12 }, (_, i) => i + 8).map((h) => <option key={h} value={h}>{((h + 11) % 12) + 1} {h < 12 ? "AM" : "PM"} CT</option>)}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Right: keyword cloud — click a keyword to copy its link (+ add to text). Most-used = biggest. */}
          <div className="md:border-l md:border-[var(--border)] md:pl-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1">Link keywords</div>
            <div className="text-[11px] text-[var(--muted)] mb-3">Click a keyword to copy its link (and add it to the text). Most-used grow biggest.</div>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 max-h-[48vh] overflow-y-auto content-start">
              {shortlinks.length === 0 && <div className="text-xs text-[var(--muted)]">No saved links yet. Create them in the Unified inbox.</div>}
              {shortlinks.map((l) => (
                <button
                  key={l.id}
                  onClick={() => useLink(l)}
                  title={l.short}
                  className={`font-semibold leading-tight text-white hover:text-[color:#66b2ff] transition-colors ${cloudSize(l.uses)}`}
                >
                  {l.word}
                  {copied === l.id && <span className="ml-1 align-middle text-xs text-[color:#3fb950] font-normal">✓ copied</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[var(--border)]">
          <button className="btn btn-ghost text-sm" onClick={onClose}>Cancel</button>
          <button className="btn text-sm" disabled={busy || !trigger.trim() || (!response.trim() && !sms.trim())} onClick={save}>Save rule</button>
        </div>
      </div>
    </div>
  );
}
