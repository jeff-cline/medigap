"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type Row = {
  id: string; leadName: string; phone: string; email: string; zip: string; state: string;
  tags: string[]; stage: string; valueCents: number;
  lastCallAt: string | null; lastStatus: string; durationSec: number; costCents: number; appended: boolean;
};

const STAGE_TONE: Record<string, string> = {
  "": "text-[var(--muted)]", missed: "text-[var(--danger)]", engaged: "text-[var(--gold)]",
  clicked: "text-[var(--brand2)]", opted_in: "text-[var(--brand)]", revenue: "text-[var(--brand)]",
};
const STAGE_LABEL: Record<string, string> = {
  "": "—", missed: "missed", engaged: "engaged", clicked: "clicked", opted_in: "opted in", revenue: "revenue",
};
const usd2 = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function RecaptureConsole({ rows, isGod }: { rows: Row[]; isGod: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [composer, setComposer] = useState(false);
  const [channel, setChannel] = useState("both");
  const [subject, setSubject] = useState("A quick follow-up from Medigap.plus");
  const [body, setBody] = useState("Hi {first}, you reached out about Medicare and we missed you. We're a FREE service — see what you qualify for here: {link}");
  const [tagName, setTagName] = useState("chapter-1");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) =>
      [r.leadName, r.phone, r.email, r.zip, r.state, r.tags.join(" ")].join(" ").toLowerCase().includes(t)
    );
  }, [rows, q]);

  const allSelected = filtered.length > 0 && filtered.every((r) => sel.has(r.id));
  function toggleAll() {
    setSel((cur) => {
      const next = new Set(cur);
      if (allSelected) filtered.forEach((r) => next.delete(r.id));
      else filtered.forEach((r) => next.add(r.id));
      return next;
    });
  }
  function toggle(id: string) {
    setSel((cur) => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  const ids = () => Array.from(sel);

  async function post(url: string, payload: object, label: string) {
    if (sel.size === 0) { setNote("Select some contacts first."); return null; }
    setBusy(label); setNote("");
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (d.error) { setNote(d.error); return null; }
    return d;
  }

  async function appendAll() {
    const d = await post("/api/recapture/append", { leadIds: ids() }, "append");
    if (d) { setNote(`Appended ${d.processed} — ${d.matched} matched & enriched.`); router.refresh(); }
  }
  async function tagAll() {
    const d = await post("/api/leads/tag", { leadIds: ids(), tag: tagName }, "tag");
    if (d) { setNote(`Tagged ${d.updated} as “${d.tag}”.`); router.refresh(); }
  }
  async function sendAll() {
    if (!body.trim()) { setNote("Write a message first."); return; }
    const d = await post("/api/comms/send", { filter: { type: "ids", value: ids() }, channel, subject, body, name: `recapture ${tagName}` }, "send");
    if (d) { setNote(`Sent — ${d.sms} texts, ${d.emails} emails${d.failed ? `, ${d.failed} failed` : ""}. Marked engaged.`); setComposer(false); router.refresh(); }
  }
  async function backfill() {
    if (!confirm("Pull your FULL Twilio call history into the recapture CRM? This can take a minute on large accounts.")) return;
    setBusy("backfill"); setNote("Importing from Twilio…");
    const r = await fetch("/api/recapture/backfill", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tag: "chapter-1" }) });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (d.error) { setNote(d.error); return; }
    setNote(`Imported ${d.createdCalls} calls (${d.createdLeads} new contacts, ${d.missed} missed) across ${d.pages} pages.${d.reachedCap ? " Hit page cap — run again to continue." : ""}`);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone, email, ZIP, state…"
          className="!w-72 max-w-full"
        />
        <span className="text-xs text-[var(--muted)]">{filtered.length} shown · {sel.size} selected</span>
        <div className="flex-1" />
        {isGod && (
          <button onClick={backfill} disabled={!!busy} className="btn btn-ghost text-xs !py-1.5">
            {busy === "backfill" ? "Importing…" : "⤓ Import full Twilio history"}
          </button>
        )}
      </div>

      {sel.size > 0 && (
        <div className="card !p-3 flex flex-wrap items-center gap-2 border-l-4 border-l-[var(--brand)]">
          <span className="text-sm font-medium">{sel.size} selected:</span>
          <button onClick={appendAll} disabled={!!busy} className="btn btn-ghost text-xs !py-1.5">{busy === "append" ? "Appending…" : "↻ Append all (PredictiveData)"}</button>
          <div className="flex items-center gap-1">
            <input value={tagName} onChange={(e) => setTagName(e.target.value)} className="!w-28 text-xs" />
            <button onClick={tagAll} disabled={!!busy} className="btn btn-ghost text-xs !py-1.5">{busy === "tag" ? "Tagging…" : "🏷 Tag all"}</button>
          </div>
          <button onClick={() => setComposer((v) => !v)} disabled={!!busy} className="btn btn-brand text-xs !py-1.5">✉️ Bulk text / email</button>
          <button onClick={() => setSel(new Set())} className="btn btn-ghost text-xs !py-1.5">Clear</button>
        </div>
      )}

      {composer && sel.size > 0 && (
        <div className="card !p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-[var(--muted)]">Channel</span>
            {["sms", "email", "both"].map((c) => (
              <button key={c} onClick={() => setChannel(c)} className={`btn text-xs !py-1 ${channel === c ? "btn-brand" : "btn-ghost"}`}>{c}</button>
            ))}
            <span className="text-[11px] text-[var(--muted)]">Cold/non-opted email → Zapmail · texts → Twilio</span>
          </div>
          {channel !== "sms" && (
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" className="w-full" />
          )}
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="w-full text-sm"
            placeholder="Message — use {first}, {zip}, {link} (tracked CTA)" />
          <div className="flex items-center gap-2">
            <button onClick={sendAll} disabled={!!busy} className="btn btn-brand text-sm">{busy === "send" ? "Sending…" : `Send to ${sel.size} →`}</button>
            <span className="text-[11px] text-[var(--muted)]">{"{link}"} is a tracked link — clicks move them to “clicked,” a form submit opts them in.</span>
          </div>
        </div>
      )}

      {note && <div className="text-xs text-[var(--brand)]">{note}</div>}

      <div className="card !p-0 overflow-hidden overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th className="!pr-0"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
              <th>Last call (CT)</th>
              <th>Number</th>
              <th>Name</th>
              <th>Zip / State</th>
              <th>Status</th>
              <th className="text-right">Sec</th>
              <th className="text-right">Twilio $</th>
              <th>Stage</th>
              <th>Tags</th>
              <th className="text-right">Enriched</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className={sel.has(r.id) ? "bg-[var(--panel2)]" : ""}>
                <td className="!pr-0"><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} /></td>
                <td className="text-[var(--muted)] text-sm whitespace-nowrap">{r.lastCallAt || "—"}</td>
                <td className="whitespace-nowrap">{r.phone || "—"}</td>
                <td className="text-sm"><Link href={`/dashboard/leads/${r.id}`} className="text-[var(--brand)] hover:underline">{r.leadName || "Unknown"}</Link></td>
                <td className="text-[var(--muted)] text-sm">{[r.zip, r.state].filter(Boolean).join(" · ") || "—"}</td>
                <td><span className={["missed", "no-answer", "busy", "failed", "canceled"].includes(r.lastStatus) ? "text-[var(--danger)] text-xs" : "text-[var(--muted)] text-xs"}>{r.lastStatus || "—"}</span></td>
                <td className="text-right text-sm">{r.durationSec ? mmss(r.durationSec) : "—"}</td>
                <td className="text-right text-[var(--muted)] text-sm">{r.costCents ? usd2(r.costCents) : "—"}</td>
                <td><span className={`text-xs font-medium ${STAGE_TONE[r.stage] || "text-[var(--muted)]"}`}>{r.valueCents > 0 ? "💰 revenue" : STAGE_LABEL[r.stage] ?? r.stage}</span></td>
                <td className="text-xs text-[var(--muted)]">{r.tags.join(", ") || "—"}</td>
                <td className="text-right text-xs">{r.appended ? <span className="text-[var(--brand)]">✓</span> : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={11} className="text-center text-[var(--muted)] py-8">No contacts {q ? "match your search" : "yet — import your Twilio history to begin"}.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
