"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { engineLabel } from "@/lib/jv-constants";

type Sent = { templateId: string; templateName: string; engine: string; status: string; opened: boolean; replied: boolean };
type Contact = { id: string; name: string; email: string; sent: Sent[] };
type Template = { id: string; name: string; subject: string; html: string; text: string };
type Engine = { key: string; label: string; ready: boolean; oneToOne: boolean };

export default function FounderComms({ contacts, templates, engines }: { contacts: Contact[]; templates: Template[]; engines: Engine[] }) {
  const router = useRouter();
  const [compose, setCompose] = useState<Contact | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? contacts.filter((c) => (c.name + " " + c.email).toLowerCase().includes(q)) : contacts;
  }, [contacts, search]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts…" className="!w-56" />
        <button onClick={() => setShowTemplates((v) => !v)} className="btn btn-ghost text-xs !py-1.5 ml-auto">{showTemplates ? "Hide templates" : "✎ Manage templates"}</button>
      </div>

      {showTemplates && <TemplateManager templates={templates} onChange={() => router.refresh()} />}

      <div className="card !p-0 overflow-hidden overflow-x-auto">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Templates sent</th><th></th></tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="font-medium"><a href={`/dashboard/jv/${c.id}`} className="text-[var(--brand)] hover:underline">{c.name || "(no name)"}</a></td>
                <td className="text-[var(--muted)] text-sm">{c.email || "—"}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {c.sent.length === 0 && <span className="text-[11px] text-[var(--muted)]">none yet</span>}
                    {c.sent.map((s, i) => {
                      const mark = s.status === "failed" ? "✕" : s.replied ? "↩ replied" : s.opened ? "✓ opened" : "• sent";
                      const tone = s.status === "failed" ? "border-[var(--danger)]/50 text-[var(--danger)]" : s.replied || s.opened ? "border-[var(--brand)] text-[var(--brand)]" : "border-[var(--border)] text-[var(--muted)]";
                      return (
                        <span key={i} title={`${s.templateName || "ad-hoc"} via ${engineLabel(s.engine)} — ${s.status}${s.opened ? " · opened" : ""}${s.replied ? " · replied" : ""}`}
                          className={`text-[10px] rounded-full px-2 py-0.5 border ${tone}`}>
                          {(s.templateName || "ad-hoc")} · {s.engine} · {mark}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="text-right">
                  <button onClick={() => setCompose(c)} disabled={!c.email} className="btn btn-ghost text-xs !py-1.5 !px-3 text-[var(--gold)] disabled:opacity-40">✉ Email</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} className="text-center text-[var(--muted)] py-6">No contacts. They arrive from the deal room / partner pages.</td></tr>}
          </tbody>
        </table>
      </div>

      {compose && <ComposeModal contact={compose} templates={templates} engines={engines} onClose={() => setCompose(null)} onSent={() => { setCompose(null); router.refresh(); }} />}
    </div>
  );
}

function ComposeModal({ contact, templates, engines, onClose, onSent }: { contact: Contact; templates: Template[]; engines: Engine[]; onClose: () => void; onSent: () => void }) {
  const [engine, setEngine] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const tpl = templates.find((t) => t.id === templateId);
  function applyTemplate(id: string) {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) { setSubject(t.subject); setHtml(t.html); setText(t.text); }
  }

  // No-resend guard (client mirror of the server rule): block if this template already
  // went to this person via the SAME engine; allow via a different engine.
  const blocked = useMemo(() => {
    if (!templateId || !engine) return null;
    const priorEngines = contact.sent.filter((s) => s.templateId === templateId && s.status !== "failed").map((s) => s.engine);
    if (priorEngines.length === 0) return null;
    if (priorEngines.includes(engine)) return `Already sent “${tpl?.name}” to ${contact.name || contact.email} via ${engine}. Pick a different email service to resend.`;
    return null;
  }, [templateId, engine, contact, tpl]);

  async function send() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/founder/email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: contact.id, engine, subject, html, text, templateId: templateId || undefined, templateName: tpl?.name || "" }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (d.ok) onSent();
    else setMsg(d.error || "Send failed.");
  }

  const canSend = !!engine && !!subject.trim() && !!html.trim() && !blocked && !busy;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl my-8 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Email <span className="text-[var(--brand)]">{contact.name || contact.email}</span></h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)]">✕</button>
        </div>

        <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Send from *</label>
        <select value={engine} onChange={(e) => setEngine(e.target.value)} className="mt-1 mb-3">
          <option value="">— pick an email engine —</option>
          {engines.map((e) => <option key={e.key} value={e.key} disabled={!e.ready || !e.oneToOne}>{e.label}{!e.ready ? " (not connected)" : ""}{!e.oneToOne ? " (blasts only)" : ""}</option>)}
        </select>

        <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Template</label>
        <select value={templateId} onChange={(e) => applyTemplate(e.target.value)} className="mt-1 mb-3">
          <option value="">— none (write fresh) —</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Subject *</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 mb-3" placeholder="Subject — {first} merges the first name" />

        <label className="text-xs uppercase tracking-wide text-[var(--muted)]">HTML body *</label>
        <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={6} className="mt-1 mb-3" placeholder="<p>Hi {first},</p> …" />

        <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Plain-text version (optional)</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="mt-1 mb-2" placeholder="Plain-text fallback…" />

        {blocked && <p className="text-xs text-[var(--gold)] mb-2">⚠ {blocked}</p>}
        {msg && <p className="text-sm text-[var(--danger)] mb-2">{msg}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost text-sm">Cancel</button>
          <button onClick={send} disabled={!canSend} className="btn btn-brand text-sm disabled:opacity-40">{busy ? "Sending…" : "Send email"}</button>
        </div>
      </div>
    </div>
  );
}

function TemplateManager({ templates, onChange }: { templates: Template[]; onChange: () => void }) {
  const [edit, setEdit] = useState<Partial<Template> | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!edit?.name?.trim()) return;
    setBusy(true);
    await fetch("/api/founder/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...edit }) });
    setBusy(false); setEdit(null); onChange();
  }
  async function del(id: string) {
    setBusy(true);
    await fetch("/api/founder/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id }) });
    setBusy(false); onChange();
  }

  return (
    <div className="card !p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-sm">Email templates</div>
        <button onClick={() => setEdit({ name: "", subject: "", html: "", text: "" })} className="btn btn-ghost text-xs !py-1">+ New template</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {templates.length === 0 && <span className="text-xs text-[var(--muted)]">No templates yet.</span>}
        {templates.map((t) => (
          <span key={t.id} className="inline-flex items-center gap-2 text-xs rounded-full border border-[var(--border)] px-2 py-1">
            {t.name}
            <button onClick={() => setEdit(t)} className="text-[var(--brand)]">edit</button>
            <button onClick={() => del(t.id)} className="text-[var(--danger)]">×</button>
          </span>
        ))}
      </div>

      {edit && (
        <div className="mt-3 border-t border-[var(--border)] pt-3 space-y-2">
          <input value={edit.name || ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Template name *" />
          <input value={edit.subject || ""} onChange={(e) => setEdit({ ...edit, subject: e.target.value })} placeholder="Subject" />
          <textarea value={edit.html || ""} onChange={(e) => setEdit({ ...edit, html: e.target.value })} rows={4} placeholder="HTML body" />
          <textarea value={edit.text || ""} onChange={(e) => setEdit({ ...edit, text: e.target.value })} rows={2} placeholder="Plain-text version (optional)" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setEdit(null)} className="btn btn-ghost text-xs">Cancel</button>
            <button onClick={save} disabled={busy || !edit.name?.trim()} className="btn btn-brand text-xs disabled:opacity-40">{busy ? "Saving…" : "Save template"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
