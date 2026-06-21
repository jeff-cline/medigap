"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { JV_INTERESTS } from "@/lib/jv-constants";

type Msg = { dir: string; body: string; at: string };
type Note = { author: string; body: string; at: string };
type Doc = { url: string; label: string; by: string; at: string };
export type DealLead = {
  id: string; name: string; phone: string; email: string; zip: string; state: string;
  priority: string; ltvMonthly: string; jvInterest: string; status: string; optOut: boolean;
  autoReply: string; autoReplySent: boolean;
};

const F = "w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";

export default function JvDeal({ lead, messages, notes, docs }: { lead: DealLead; messages: Msg[]; notes: Note[]; docs: Doc[] }) {
  const router = useRouter();
  const [f, setF] = useState(lead);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [text, setText] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoReply, setAutoReply] = useState(lead.autoReply || "");
  const set = (k: keyof DealLead, v: string) => setF({ ...f, [k]: v });

  async function call(body: object, label: string) {
    setBusy(label); setMsg("");
    const r = await fetch("/api/jv/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: lead.id, ...body }) });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (d.error) setMsg(d.error);
    return d;
  }
  async function save() { const d = await call({ action: "update", priority: f.priority, ltvMonthly: f.ltvMonthly, jvInterest: f.jvInterest, status: f.status, name: f.name, email: f.email, phone: f.phone }, "save"); if (!d.error) { setMsg("Saved"); router.refresh(); } }
  async function sendText() { if (!text.trim()) return; const d = await call({ action: "text", body: text }, "text"); if (!d.error) { setText(""); router.refresh(); } }
  async function addNote() { if (!noteBody.trim()) return; const d = await call({ action: "note", body: noteBody }, "note"); if (!d.error) { setNoteBody(""); router.refresh(); } }
  async function saveAuto() { const d = await call({ action: "autoreply", body: autoReply }, "auto"); if (!d.error) { setMsg(autoReply.trim() ? "Auto-reply armed ✓" : "Auto-reply cleared"); router.refresh(); } }
  async function uploadDoc(file: File) {
    setBusy("doc"); setMsg("");
    const fd = new FormData(); fd.append("file", file); fd.append("label", file.name);
    const u = await fetch("/api/upload", { method: "POST", body: fd }); const ud = await u.json().catch(() => ({}));
    if (!ud.url) { setBusy(""); setMsg(ud.error || "Upload failed"); return; }
    const d = await call({ action: "doc", url: ud.url, label: file.name }, "doc");
    if (!d.error) router.refresh();
  }

  const priBtn = (p: string, label: string, tone: string) => (
    <button onClick={() => set("priority", p)} className={`btn text-xs !py-1 ${f.priority === p ? "btn-brand" : "btn-ghost"}`}>{tone} {label}</button>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
      {/* LEFT — texting thread */}
      <div className="space-y-4">
        {/* Instant auto-reply manager */}
        <div className="card !p-0 overflow-hidden border-l-4 border-l-[var(--brand)]">
          <button onClick={() => setAutoOpen((v) => !v)} className="w-full px-4 py-3 flex items-center justify-between text-left">
            <span className="font-semibold">⚡ MANAGE REPLY INSTANTLY</span>
            <span className="text-xs text-[var(--muted)]">
              {lead.autoReply ? (lead.autoReplySent ? "fired · re-arm to reuse" : "armed ✓") : "off"} · {autoOpen ? "hide" : "set up"}
            </span>
          </button>
          {autoOpen && (
            <div className="px-4 pb-4 space-y-2">
              <p className="text-xs text-[var(--muted)]">
                The first time this contact texts back, we instantly auto-reply with this message from 1-800-MEDIGAP — then
                email you a link so you can take over here. Saving re-arms it.
              </p>
              <textarea className={F} rows={3} value={autoReply} onChange={(e) => setAutoReply(e.target.value)}
                placeholder="e.g. Thanks for reaching out about 1-800-MEDIGAP! This is Jeff's desk — I'll be right with you. What market are you interested in?" />
              <div className="flex items-center gap-2">
                <button onClick={saveAuto} disabled={busy === "auto"} className="btn btn-brand text-sm">{busy === "auto" ? "Saving…" : "Save & arm auto-reply"}</button>
                {autoReply && <button onClick={() => { setAutoReply(""); }} className="btn btn-ghost text-xs">Clear</button>}
              </div>
            </div>
          )}
        </div>

        <div className="card !p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <div className="font-semibold">💬 Conversation <span className="text-xs text-[var(--muted)] font-normal">via 1-800-MEDIGAP</span></div>
            {f.optOut && <span className="text-[11px] text-[var(--danger)]">opted out of texts</span>}
          </div>
          <div className="p-4 space-y-2 max-h-[420px] overflow-y-auto">
            {messages.length === 0 && <p className="text-sm text-[var(--muted)] text-center py-6">No messages yet. Send the first text below — it goes out from 1-800-MEDIGAP and replies come back here.</p>}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.dir === "inbound" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.dir === "inbound" ? "bg-[var(--panel2)]" : "bg-[var(--brand)]/15 border border-[var(--brand)]/30"}`}>
                  {m.body}
                  <div className="text-[10px] text-[var(--muted)] mt-1">{m.dir === "inbound" ? "← them" : "→ you"} · {m.at}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-[var(--border)]">
            <textarea className={F} rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={f.phone ? "Type a text…" : "Add a phone number first (right panel)"} disabled={!f.phone || f.optOut} />
            <div className="flex items-center gap-2 mt-2">
              <button onClick={sendText} disabled={busy === "text" || !f.phone || f.optOut} className="btn btn-brand text-sm">{busy === "text" ? "Sending…" : "Send text →"}</button>
              <span className="text-[11px] text-[var(--muted)]">Replies thread here and ping your cell.</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card !p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] font-semibold">📝 Notes <span className="text-xs text-[var(--muted)] font-normal">— who wrote what</span></div>
          <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
            {notes.length === 0 && <p className="text-sm text-[var(--muted)]">No notes yet.</p>}
            {notes.map((n, i) => (
              <div key={i} className="text-sm">
                <div className="text-[11px] text-[var(--muted)]"><b className="text-[var(--text)]">{n.author}</b> · {n.at}</div>
                <div>{n.body}</div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-[var(--border)]">
            <textarea className={F} rows={2} value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Add a note…" />
            <button onClick={addNote} disabled={busy === "note"} className="btn btn-ghost text-sm mt-2">{busy === "note" ? "Saving…" : "Add note"}</button>
          </div>
        </div>
      </div>

      {/* RIGHT — deal fields + documents */}
      <div className="space-y-4">
        <div className="card !p-4 space-y-3">
          <div className="font-semibold">Deal</div>
          <div><label className="text-[10px] uppercase text-[var(--muted)]">Name</label><input className={F} value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px] uppercase text-[var(--muted)]">Phone</label><input className={F} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            <div><label className="text-[10px] uppercase text-[var(--muted)]">Email</label><input className={F} value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
          </div>
          <div>
            <label className="text-[10px] uppercase text-[var(--muted)]">Priority</label>
            <div className="flex gap-2 mt-1">{priBtn("high", "High", "🔴")}{priBtn("medium", "Medium", "🟡")}{priBtn("low", "Low", "⚪")}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px] uppercase text-[var(--muted)]">LTV / month ($)</label><input className={F} type="number" value={f.ltvMonthly} onChange={(e) => set("ltvMonthly", e.target.value)} placeholder="0" /></div>
            <div><label className="text-[10px] uppercase text-[var(--muted)]">Status</label>
              <select className={F} value={f.status} onChange={(e) => set("status", e.target.value)}>
                {["new", "contacted", "negotiating", "won", "lost", "dead"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
          </div>
          <div><label className="text-[10px] uppercase text-[var(--muted)]">Interest</label>
            <select className={F} value={f.jvInterest} onChange={(e) => set("jvInterest", e.target.value)}>
              <option value="">—</option>{JV_INTERESTS.map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}
            </select></div>
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={busy === "save"} className="btn btn-brand text-sm">{busy === "save" ? "Saving…" : "Save deal"}</button>
            {msg && <span className="text-xs text-[var(--muted)]">{msg}</span>}
          </div>
        </div>

        <div className="card !p-4">
          <div className="font-semibold mb-2">📎 Documents</div>
          <div className="space-y-1 mb-3">
            {docs.length === 0 && <p className="text-sm text-[var(--muted)]">No documents yet.</p>}
            {docs.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <a href={d.url} target="_blank" rel="noreferrer" className="text-[var(--brand)] hover:underline truncate">{d.label || d.url}</a>
                <span className="text-[10px] text-[var(--muted)] shrink-0 ml-2">{d.by} · {d.at}</span>
              </div>
            ))}
          </div>
          <label className="btn btn-ghost text-xs cursor-pointer">
            {busy === "doc" ? "Uploading…" : "⤓ Upload document"}
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0])} />
          </label>
        </div>
      </div>
    </div>
  );
}
