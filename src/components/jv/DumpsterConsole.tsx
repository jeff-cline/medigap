"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Stats = { total: number; textable: number; emailable: number; appended: number };
type Lead = { id: string; name: string; email: string; phone: string; city: string; state: string; zip: string; smsOptOut: boolean; emailOptOut: boolean };
type Template = { id: string; name: string; subject: string; html: string; text: string };
type Engine = { key: string; label: string; ready: boolean; oneToOne: boolean };

const fmtPhone = (p: string) => { const d = (p || "").replace(/\D/g, "").slice(-10); return d.length === 10 ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}` : p || "—"; };

export default function DumpsterConsole({ stats: initStats, leads: initLeads, templates, engines }: { stats: Stats; leads: Lead[]; templates: Template[]; engines: Engine[] }) {
  const router = useRouter();
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [stats, setStats] = useState(initStats);
  const [leads, setLeads] = useState(initLeads);
  const [q, setQ] = useState("");

  // send panel
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [engine, setEngine] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [smsMsg, setSmsMsg] = useState("");

  async function api(body: object) {
    const r = await fetch("/api/founder/dumpster", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return r.json().catch(() => ({}));
  }

  async function process() {
    if (!paste.trim()) return;
    setBusy("process"); setMsg("");
    const d = await api({ action: "process", text: paste });
    setBusy("");
    if (d.ok) { setStats(d.stats); setPaste(""); setMsg(`Imported — ${d.emails} email(s), ${d.phones} phone(s): ${d.created} new, ${d.matched} matched. Appending in the background…`); search(""); }
    else setMsg(d.error || "Process failed");
  }

  async function search(query: string) {
    setQ(query); setBusy("search");
    const d = await api({ action: "search", q: query || undefined });
    setBusy("");
    if (d.ok) { setStats(d.stats); setLeads(d.leads); }
  }

  function applyTemplate(id: string) {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) { setSubject(t.subject); setHtml(t.html); setText(t.text); }
  }

  async function send() {
    setBusy("send"); setMsg("");
    const d = await api({ action: "send", channel, q: q || undefined, engine, subject, html, text, message: smsMsg, templateId: templateId || undefined, templateName: templates.find((t) => t.id === templateId)?.name || "" });
    setBusy("");
    if (d.ok) { setMsg(`Sent ${d.sent} · skipped ${d.skipped} (opt-out/dupes) · failed ${d.failed}${d.remaining ? ` · ${d.remaining} more — send again or narrow the search` : ""}`); router.refresh(); }
    else setMsg(d.error || "Send failed");
  }

  const segLabel = q ? `search "${q}"` : "All";
  const reach = channel === "sms" ? stats.textable : stats.emailable;
  const personalWarn = channel === "email" && engine === "personal";

  return (
    <div className="space-y-4">
      {/* PASTE */}
      <div className="card !p-4">
        <div className="font-semibold text-sm mb-2">Dump a list — emails or phone numbers, any format</div>
        <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={4} placeholder="paste here… commas, spaces, line breaks, mixed — we'll sort it out" />
        <button onClick={process} disabled={busy === "process" || !paste.trim()} className="btn btn-brand text-sm mt-2 disabled:opacity-40">{busy === "process" ? "Processing…" : "🗑 → Bulk: clean & append"}</button>
      </div>

      {/* MICRO DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="In Bulk" value={stats.total} sub={segLabel} />
        <Stat label="Can Text" value={stats.textable} sub="has phone · not opted out" tone="brand" />
        <Stat label="Can Email" value={stats.emailable} sub="has email · not opted out" tone="brand" />
        <Stat label="Appended" value={stats.appended} sub="enriched by data append" tone="gold" />
      </div>

      {/* FILTER */}
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => search(e.target.value)} placeholder="Search bulk: email, name, company, city, state, ZIP… (blank = All)" className="!w-96" />
        {busy === "search" && <span className="text-xs text-[var(--muted)]">…</span>}
        <span className="text-xs text-[var(--muted)] ml-auto">Showing {leads.length} (segment: {segLabel})</span>
      </div>

      {/* SEND PANEL */}
      <div className="card !p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Send to {segLabel}</span>
          <div className="flex gap-1 ml-auto">
            <button onClick={() => setChannel("email")} className={`text-xs px-3 py-1 rounded-lg border ${channel === "email" ? "border-[var(--brand)] text-[var(--brand)]" : "border-[var(--border)] text-[var(--muted)]"}`}>✉ Email ({stats.emailable})</button>
            <button onClick={() => setChannel("sms")} className={`text-xs px-3 py-1 rounded-lg border ${channel === "sms" ? "border-[var(--brand)] text-[var(--brand)]" : "border-[var(--border)] text-[var(--muted)]"}`}>💬 Text ({stats.textable})</button>
          </div>
        </div>

        {channel === "email" ? (
          <>
            <select value={engine} onChange={(e) => setEngine(e.target.value)}>
              <option value="">— send from which engine? —</option>
              {engines.filter((e) => e.oneToOne).map((e) => <option key={e.key} value={e.key} disabled={!e.ready}>{e.label}{!e.ready ? " (not connected)" : ""}</option>)}
            </select>
            {personalWarn && <p className="text-xs text-[var(--gold)]">⚠ Bulk-sending from your Personal Google address can hurt its reputation — Cold (Zapmail) or SMTP is safer for big lists.</p>}
            <select value={templateId} onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">— template (or write fresh) —</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject — {first} merges first name" />
            <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={4} placeholder="<p>Hi {first}…</p>" />
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Plain-text version (optional)" />
          </>
        ) : (
          <textarea value={smsMsg} onChange={(e) => setSmsMsg(e.target.value)} rows={3} placeholder="Text message — {first} merges first name. STOP compliance is appended automatically." />
        )}

        <button onClick={send} disabled={busy === "send"} className="btn btn-brand text-sm disabled:opacity-40">
          {busy === "send" ? "Sending…" : `Send ${channel === "sms" ? "text" : "email"} to ${segLabel} (${reach} reachable, up to 200/send)`}
        </button>
      </div>

      {msg && <p className="text-sm text-[var(--brand)]">{msg}</p>}

      {/* LIST */}
      <div className="card !p-0 overflow-hidden overflow-x-auto">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Location</th></tr></thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-[var(--panel2)] cursor-pointer" onClick={() => router.push(`/dashboard/jv/${l.id}`)}>
                <td className="font-medium"><span className="text-[var(--brand)] hover:underline">{l.name || "(no name)"}</span></td>
                <td className="text-sm text-[var(--muted)]">{l.email || "—"}{l.emailOptOut ? " 🚫" : ""}</td>
                <td className="text-sm text-[var(--muted)]">{l.phone ? fmtPhone(l.phone) : "—"}{l.smsOptOut ? " 🚫" : ""}</td>
                <td className="text-sm text-[var(--muted)]">{[l.city, l.state, l.zip].filter(Boolean).join(", ") || "—"}</td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td colSpan={4} className="text-center text-[var(--muted)] py-6">No bulk contacts yet — paste a list above.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone = "default" }: { label: string; value: number; sub: string; tone?: "default" | "brand" | "gold" }) {
  const color = tone === "brand" ? "text-[var(--brand)]" : tone === "gold" ? "text-[var(--gold)]" : "text-[var(--text)]";
  return (
    <div className="card !p-3">
      <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</div>
      <div className="text-[11px] text-[var(--muted)]">{sub}</div>
    </div>
  );
}
