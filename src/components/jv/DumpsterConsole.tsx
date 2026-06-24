"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Stats = { total: number; textable: number; emailable: number; appended: number };
type Lead = { id: string; name: string; email: string; phone: string; city: string; state: string; zip: string; smsOptOut: boolean; emailOptOut: boolean; appended: string };
type Template = { id: string; name: string; subject: string; html: string; text: string };
type Engine = { key: string; label: string; ready: boolean; oneToOne: boolean };

const fmtPhone = (p: string) => { const d = (p || "").replace(/\D/g, "").slice(-10); return d.length === 10 ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}` : p || "—"; };

// Carrot chips → merge tokens the founder can insert into the subject/body/text.
const CARROTS: { label: string; token: string }[] = [
  { label: "First name", token: "{first}" },
  { label: "Last name", token: "{last}" },
  { label: "Date of birth", token: "{dob}" },
  { label: "Today's date", token: "{today}" },
  { label: "My calendar link", token: "{calendar}" },
];

// Short append summary for the list, or the "no data" note the founder asked for.
function appendNote(raw: string): { ok: boolean; text: string } {
  try {
    const a = JSON.parse(raw || "{}");
    if (a.appendStatus === "matched") {
      const bits = ["age", "city", "state", "householdIncome"].map((k) => a[k]).filter(Boolean).slice(0, 3);
      return { ok: true, text: "✓ appended" + (bits.length ? `: ${bits.join(", ")}` : "") };
    }
  } catch {}
  return { ok: false, text: "no auto-append data available" };
}

export default function DumpsterConsole({ stats: initStats, leads: initLeads, templates: initTemplates, engines }: { stats: Stats; leads: Lead[]; templates: Template[]; engines: Engine[] }) {
  const router = useRouter();
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [stats, setStats] = useState(initStats);
  const [leads, setLeads] = useState(initLeads);
  const [templates, setTemplates] = useState(initTemplates);
  const [q, setQ] = useState("");

  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [engine, setEngine] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [smsMsg, setSmsMsg] = useState("");

  // Track which field is focused so a carrot inserts at the right caret.
  const subjectRef = useRef<HTMLInputElement>(null);
  const htmlRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const smsRef = useRef<HTMLTextAreaElement>(null);
  const [active, setActive] = useState<"subject" | "html" | "text" | "sms">(channel === "sms" ? "sms" : "html");

  function insert(token: string) {
    const map = {
      subject: { ref: subjectRef, val: subject, set: setSubject },
      html: { ref: htmlRef, val: html, set: setHtml },
      text: { ref: textRef, val: text, set: setText },
      sms: { ref: smsRef, val: smsMsg, set: setSmsMsg },
    } as const;
    const target = channel === "sms" ? "sms" : active === "sms" ? "html" : active;
    const { ref, val, set } = map[target];
    const el = ref.current;
    const pos = el && typeof el.selectionStart === "number" ? el.selectionStart : val.length;
    const next = val.slice(0, pos) + token + val.slice(pos);
    set(next);
    requestAnimationFrame(() => { if (el) { el.focus(); const c = pos + token.length; el.setSelectionRange(c, c); } });
  }

  async function api(body: object) {
    const r = await fetch("/api/founder/dumpster", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return r.json().catch(() => ({}));
  }

  async function process() {
    if (!paste.trim()) return;
    setBusy("process"); setMsg("");
    const d = await api({ action: "process", text: paste });
    setBusy("");
    if (d.ok) { setStats(d.stats); setPaste(""); setMsg(`Imported — ${d.emails} email(s), ${d.phones} phone(s): ${d.created} new, ${d.matched} matched. Auto-appending in the background — refresh in a moment to see results.`); search(""); }
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

  async function doSend(saveAs?: string) {
    setBusy("send"); setMsg("");
    if (saveAs && channel === "email") {
      const sv = await fetch("/api/founder/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: saveAs, subject, html, text }) });
      const sd = await sv.json().catch(() => ({}));
      if (sd.ok) setTemplates((t) => [...t.filter((x) => x.name !== saveAs), { id: sd.id, name: saveAs, subject, html, text }]);
      else { setBusy(""); setMsg(sd.error || "Could not save template."); return; }
    }
    const d = await api({ action: "send", channel, q: q || undefined, engine, subject, html, text, message: smsMsg, templateId: templateId || undefined, templateName: templates.find((t) => t.id === templateId)?.name || "" });
    setBusy("");
    if (d.ok) { setMsg(`${saveAs ? `Saved template “${saveAs}”. ` : ""}Sent ${d.sent} · skipped ${d.skipped} (opt-out/dupes) · failed ${d.failed}${d.remaining ? ` · ${d.remaining} more — send again or narrow` : ""}`); router.refresh(); }
    else setMsg(d.error || "Send failed");
  }

  function saveAndSend() {
    const name = window.prompt("Save this as a template named:");
    if (name && name.trim()) doSend(name.trim());
  }

  const segLabel = q ? `search "${q}"` : "All";
  const reach = channel === "sms" ? stats.textable : stats.emailable;
  const selEngine = engines.find((e) => e.key === engine);
  const engineBlocked = channel === "email" && (!engine || !selEngine?.ready);
  const canSend = busy !== "send" && (channel === "sms" ? !!smsMsg.trim() : (!!subject.trim() && !!html.trim() && !engineBlocked));

  return (
    <div className="space-y-4">
      {/* PASTE */}
      <div className="card !p-4">
        <div className="font-semibold text-sm mb-2">Dump a list — emails or phone numbers, any format</div>
        <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={4} placeholder="paste here… commas, spaces, line breaks, mixed — we'll sort it out. Everything is auto-appended if data is available." />
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
            <button onClick={() => { setChannel("email"); setActive("html"); }} className={`text-xs px-3 py-1 rounded-lg border ${channel === "email" ? "border-[var(--brand)] text-[var(--brand)]" : "border-[var(--border)] text-[var(--muted)]"}`}>✉ Email ({stats.emailable})</button>
            <button onClick={() => { setChannel("sms"); setActive("sms"); }} className={`text-xs px-3 py-1 rounded-lg border ${channel === "sms" ? "border-[var(--brand)] text-[var(--brand)]" : "border-[var(--border)] text-[var(--muted)]"}`}>💬 Text ({stats.textable})</button>
          </div>
        </div>

        {/* Carrot chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-[var(--muted)]">Insert:</span>
          {CARROTS.map((c) => (
            <button key={c.token} type="button" onClick={() => insert(c.token)} className="text-[11px] rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--brand)] hover:border-[var(--brand)]" title={`inserts ${c.token}`}>⌄ {c.label}</button>
          ))}
        </div>

        {channel === "email" ? (
          <>
            <select value={engine} onChange={(e) => setEngine(e.target.value)}>
              <option value="">— send from which engine? —</option>
              {engines.filter((e) => e.oneToOne).map((e) => <option key={e.key} value={e.key}>{e.label}{!e.ready ? " — not connected" : ""}</option>)}
            </select>
            {!!engine && !selEngine?.ready && (
              <p className="text-xs text-[var(--danger)]">⚠ “{selEngine?.label}” isn’t set up for sending. Add its mailbox SMTP host + login (app password) on the <a href="/dashboard/integrations" className="underline">Integrations</a> page, then it’s selectable here.</p>
            )}
            {engine === "personal" && selEngine?.ready && <p className="text-xs text-[var(--gold)]">⚠ Bulk-sending from your Personal Google address can hurt its reputation — Cold (Zapmail) or SMTP is safer for big lists.</p>}
            <select value={templateId} onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">— template (or write fresh) —</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input ref={subjectRef} onFocus={() => setActive("subject")} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject — use the Insert chips above for {first}, {today}, etc." />
            <textarea ref={htmlRef} onFocus={() => setActive("html")} value={html} onChange={(e) => setHtml(e.target.value)} rows={4} placeholder="<p>Hi {first},</p> … click the Insert chips to drop in merge fields" />
            <textarea ref={textRef} onFocus={() => setActive("text")} value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Plain-text version (optional)" />
          </>
        ) : (
          <textarea ref={smsRef} onFocus={() => setActive("sms")} value={smsMsg} onChange={(e) => setSmsMsg(e.target.value)} rows={3} placeholder="Text message — use the Insert chips for {first}, {calendar}, etc. STOP compliance is appended automatically." />
        )}

        <div className="flex flex-wrap gap-2">
          <button onClick={() => doSend()} disabled={!canSend} className="btn btn-brand text-sm disabled:opacity-40">
            {busy === "send" ? "Sending…" : `Send ${channel === "sms" ? "text" : "email"} to ${segLabel} (${reach} reachable, up to 200/send)`}
          </button>
          {channel === "email" && (
            <button onClick={saveAndSend} disabled={!canSend} className="btn btn-ghost text-sm disabled:opacity-40" title="Save these contents as a reusable template, then send">💾 Send &amp; save as template</button>
          )}
        </div>
      </div>

      {msg && <p className="text-sm text-[var(--brand)]">{msg}</p>}

      {/* LIST */}
      <div className="card !p-0 overflow-hidden overflow-x-auto">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Append</th></tr></thead>
          <tbody>
            {leads.map((l) => {
              const note = appendNote(l.appended);
              return (
                <tr key={l.id} className="hover:bg-[var(--panel2)] cursor-pointer" onClick={() => router.push(`/dashboard/jv/${l.id}`)}>
                  <td className="font-medium"><span className="text-[var(--brand)] hover:underline">{l.name || "(no name)"}</span></td>
                  <td className="text-sm text-[var(--muted)]">{l.email || "—"}{l.emailOptOut ? " 🚫" : ""}</td>
                  <td className="text-sm text-[var(--muted)]">{l.phone ? fmtPhone(l.phone) : "—"}{l.smsOptOut ? " 🚫" : ""}</td>
                  <td className="text-sm text-[var(--muted)]">{[l.city, l.state, l.zip].filter(Boolean).join(", ") || "—"}</td>
                  <td className={`text-xs ${note.ok ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}>{note.text}</td>
                </tr>
              );
            })}
            {leads.length === 0 && <tr><td colSpan={5} className="text-center text-[var(--muted)] py-6">No bulk contacts yet — paste a list above.</td></tr>}
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
