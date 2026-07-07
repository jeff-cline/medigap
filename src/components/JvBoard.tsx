"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Note = { authorName: string; body: string; createdAt: string };
type Lead = {
  id: string; name: string; email: string; phone: string; city: string; state: string; source: string; createdAt: string; status: string;
  project: { estimate: string; dateExpected: string; dateDelivered: string; clientExpectations: string; stage: string };
  notes: Note[];
};
const STAGES = [["new", "New"], ["quoted", "Quoted"], ["in_production", "In production"], ["delivered", "Delivered"], ["closed", "Closed"]];
const stageColor: Record<string, string> = { new: "#5b6b86", quoted: "#1457e6", in_production: "#c69a3e", delivered: "#0b8a6a", closed: "#334155" };

export default function JvBoard({ leads: initial }: { leads: Lead[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initial);
  const [sel, setSel] = useState(initial[0]?.id || "");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const lead = leads.find((l) => l.id === sel);
  const box = { background: "#fff", border: "1px solid #e4e9f2", borderRadius: 12 } as React.CSSProperties;
  const inp = { width: "100%", border: "1px solid #e4e9f2", borderRadius: 8, padding: "8px 10px", fontSize: 13, background: "#fff" } as React.CSSProperties;

  async function api(body: Record<string, unknown>, tag: string) { setBusy(tag); const r = await fetch("/api/partner/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((x) => x.json()).catch(() => ({})); setBusy(""); return r; }
  const setProj = (k: keyof Lead["project"], v: string) => setLeads((s) => s.map((l) => l.id === sel ? { ...l, project: { ...l.project, [k]: v } } : l));

  async function saveProject() { if (!lead) return; await api({ action: "saveProject", leadId: lead.id, ...lead.project }, "save"); }
  async function addNote() {
    if (!lead || !note.trim()) return;
    const r = await api({ action: "addNote", leadId: lead.id, body: note }, "note");
    if (r.ok) { setLeads((s) => s.map((l) => l.id === sel ? { ...l, notes: [{ authorName: "you", body: note, createdAt: new Date().toISOString() }, ...l.notes] } : l)); setNote(""); router.refresh(); }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
      {/* LIST */}
      <div style={{ ...box, overflow: "hidden", alignSelf: "start" }}>
        <div style={{ padding: "10px 14px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "#5b6b86", borderBottom: "1px solid #e4e9f2" }}>Clients / projects ({leads.length})</div>
        <div style={{ maxHeight: "70vh", overflow: "auto" }}>
          {leads.length === 0 && <div style={{ padding: 24, color: "#5b6b86", fontSize: 13 }}>No leads yet — they appear the moment the site collects one.</div>}
          {leads.map((l) => (
            <button key={l.id} onClick={() => setSel(l.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #eef2f8", background: sel === l.id ? "#f2f6ff" : "#fff", cursor: "pointer" }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{l.name || l.email || "Unnamed"}</div>
              <div style={{ fontSize: 11, color: "#5b6b86", display: "flex", justifyContent: "space-between" }}><span>{[l.city, l.state].filter(Boolean).join(", ") || l.source}</span><span style={{ color: stageColor[l.project.stage] || "#5b6b86", fontWeight: 700 }}>{(STAGES.find((x) => x[0] === l.project.stage)?.[1]) || "New"}</span></div>
            </button>
          ))}
        </div>
      </div>

      {/* DETAIL */}
      {lead ? (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ ...box, padding: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{lead.name || "Unnamed client"}</div>
            <div style={{ fontSize: 13, color: "#5b6b86", marginTop: 4, display: "flex", flexWrap: "wrap", gap: 14 }}>
              <span>✉️ {lead.email || "—"}</span><span>📞 {lead.phone || "—"}</span><span>📍 {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}</span><span>via {lead.source}</span><span>{new Date(lead.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* PROJECT FIELDS */}
          <div style={{ ...box, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Project</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ fontSize: 12, color: "#5b6b86" }}>Stage<select value={lead.project.stage} onChange={(e) => setProj("stage", e.target.value)} style={{ ...inp, marginTop: 4 }}>{STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label style={{ fontSize: 12, color: "#5b6b86" }}>Estimate given<input value={lead.project.estimate} onChange={(e) => setProj("estimate", e.target.value)} placeholder="$0" style={{ ...inp, marginTop: 4 }} /></label>
              <label style={{ fontSize: 12, color: "#5b6b86" }}>Date expected<input value={lead.project.dateExpected} onChange={(e) => setProj("dateExpected", e.target.value)} placeholder="e.g. Aug 15" style={{ ...inp, marginTop: 4 }} /></label>
              <label style={{ fontSize: 12, color: "#5b6b86" }}>Date delivered<input value={lead.project.dateDelivered} onChange={(e) => setProj("dateDelivered", e.target.value)} placeholder="e.g. Aug 20" style={{ ...inp, marginTop: 4 }} /></label>
              <label style={{ fontSize: 12, color: "#5b6b86", gridColumn: "1 / -1" }}>Client note / expectations<textarea value={lead.project.clientExpectations} onChange={(e) => setProj("clientExpectations", e.target.value)} rows={2} style={{ ...inp, marginTop: 4 }} /></label>
            </div>
            <button onClick={saveProject} disabled={!!busy} style={{ marginTop: 12, background: "#1457e6", color: "#fff", border: 0, borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer" }}>{busy === "save" ? "Saving…" : "Save project"}</button>
          </div>

          {/* NOTES */}
          <div style={{ ...box, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Notes &amp; updates</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} placeholder="Add a note…" style={inp} />
              <button onClick={addNote} disabled={!!busy || !note.trim()} style={{ background: "#0b8a6a", color: "#fff", border: 0, borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{busy === "note" ? "…" : "Add"}</button>
            </div>
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {lead.notes.length === 0 && <div style={{ fontSize: 13, color: "#5b6b86" }}>No notes yet.</div>}
              {lead.notes.map((n, i) => (
                <div key={i} style={{ borderLeft: "3px solid #e4e9f2", paddingLeft: 10 }}>
                  <div style={{ fontSize: 11, color: "#5b6b86" }}>{n.authorName} · {new Date(n.createdAt).toLocaleString()}</div>
                  <div style={{ fontSize: 13 }}>{n.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : <div style={{ ...box, padding: 40, color: "#5b6b86" }}>Select a client to view their project.</div>}
    </div>
  );
}
