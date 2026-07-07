"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Note = { authorName: string; body: string; createdAt: string };
type Lead = {
  id: string; name: string; email: string; phone: string; city: string; state: string; source: string; createdAt: string; status: string;
  project: { estimate: string; dateExpected: string; dateDelivered: string; clientExpectations: string; stage: string };
  notes: Note[];
};
const STAGES = [["new", "New"], ["quoted", "Quoted"], ["in_production", "In production"], ["delivered", "Delivered"], ["closed", "Closed"]];
const O = "#f97316", RED = "#e11d2a", CARD = "#16161a", BORDER = "#2a2a31", MUTED = "#9a9aa5";
const num = (s: string) => Number(String(s || "").replace(/[^0-9.]/g, "")) || 0;

export default function JvBoard({ leads: initial }: { leads: Lead[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initial);
  const [open, setOpen] = useState<string>(""); // selected lead id → modal
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const lead = leads.find((l) => l.id === open);

  const stats = useMemo(() => {
    const byStage: Record<string, number> = {};
    let sales = 0;
    for (const l of leads) { byStage[l.project.stage] = (byStage[l.project.stage] || 0) + 1; sales += num(l.project.estimate); }
    return { sales, byStage, total: leads.length };
  }, [leads]);

  const card = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12 } as React.CSSProperties;
  const inp = { width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, background: "#fff", color: "#111" } as React.CSSProperties;
  const setProj = (k: keyof Lead["project"], v: string) => setLeads((s) => s.map((l) => l.id === open ? { ...l, project: { ...l.project, [k]: v } } : l));

  async function api(body: Record<string, unknown>, tag: string) { setBusy(tag); const r = await fetch("/api/partner/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((x) => x.json()).catch(() => ({})); setBusy(""); return r; }
  async function saveProject() { if (lead) await api({ action: "saveProject", leadId: lead.id, ...lead.project }, "save"); }
  async function addNote() {
    if (!lead || !note.trim()) return;
    const r = await api({ action: "addNote", leadId: lead.id, body: note }, "note");
    if (r.ok) { setLeads((s) => s.map((l) => l.id === open ? { ...l, notes: [{ authorName: "you", body: note, createdAt: new Date().toISOString() }, ...l.notes] } : l)); setNote(""); router.refresh(); }
  }

  return (
    <div>
      {/* DASHBOARD */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 22 }}>
        <div style={{ ...card, padding: 16 }}><div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: MUTED }}>Estimated sales</div><div style={{ fontSize: 30, fontWeight: 900, color: O }}>${stats.sales.toLocaleString()}</div></div>
        <div style={{ ...card, padding: 16 }}><div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: MUTED }}>Total leads</div><div style={{ fontSize: 30, fontWeight: 900, color: "#fff" }}>{stats.total}</div></div>
        {STAGES.map(([v, l]) => (
          <div key={v} style={{ ...card, padding: 16 }}><div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: MUTED }}>{l}</div><div style={{ fontSize: 30, fontWeight: 900, color: v === "closed" ? RED : "#fff" }}>{stats.byStage[v] || 0}</div></div>
        ))}
      </div>

      {/* LEADS LIST */}
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: O, fontWeight: 800, marginBottom: 10 }}>Leads &amp; projects ({leads.length})</div>
      {leads.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: "center", color: MUTED }}>No leads yet — they appear here the moment the site collects one.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {leads.map((l) => (
            <button key={l.id} onClick={() => { setOpen(l.id); setNote(""); }} style={{ ...card, padding: "14px 16px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, color: "#fff" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{l.name || l.email || "Unnamed"}</div>
                <div style={{ fontSize: 12, color: MUTED }}>{[l.city, l.state].filter(Boolean).join(", ") || "—"} · {l.email || "—"} · {l.phone || "—"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {num(l.project.estimate) > 0 && <span style={{ color: O, fontWeight: 800 }}>${num(l.project.estimate).toLocaleString()}</span>}
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: l.project.stage === "closed" ? RED : O }}>{STAGES.find((x) => x[0] === l.project.stage)?.[1] || "New"}</span>
                <span style={{ color: MUTED }}>›</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* MODAL */}
      {lead && (
        <div onClick={() => setOpen("")} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 24, overflow: "auto", zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "100%", maxWidth: 620, padding: 22, color: "#fff", marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{lead.name || "Unnamed client"}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 3, display: "flex", flexWrap: "wrap", gap: 12 }}><span>✉️ {lead.email || "—"}</span><span>📞 {lead.phone || "—"}</span><span>📍 {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}</span><span>{new Date(lead.createdAt).toLocaleDateString()}</span></div>
              </div>
              <button onClick={() => setOpen("")} style={{ background: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}>✕</button>
            </div>

            {/* project fields */}
            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ fontSize: 12, color: O }}>Stage<select value={lead.project.stage} onChange={(e) => setProj("stage", e.target.value)} style={{ ...inp, marginTop: 4 }}>{STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label style={{ fontSize: 12, color: O }}>Estimate given<input value={lead.project.estimate} onChange={(e) => setProj("estimate", e.target.value)} placeholder="$0" style={{ ...inp, marginTop: 4 }} /></label>
              <label style={{ fontSize: 12, color: O }}>Date expected<input value={lead.project.dateExpected} onChange={(e) => setProj("dateExpected", e.target.value)} placeholder="e.g. Aug 15" style={{ ...inp, marginTop: 4 }} /></label>
              <label style={{ fontSize: 12, color: O }}>Date delivered<input value={lead.project.dateDelivered} onChange={(e) => setProj("dateDelivered", e.target.value)} placeholder="e.g. Aug 20" style={{ ...inp, marginTop: 4 }} /></label>
              <label style={{ fontSize: 12, color: O, gridColumn: "1 / -1" }}>Client note / expectations<textarea value={lead.project.clientExpectations} onChange={(e) => setProj("clientExpectations", e.target.value)} rows={2} style={{ ...inp, marginTop: 4 }} /></label>
            </div>
            <button onClick={saveProject} disabled={!!busy} style={{ marginTop: 12, background: O, color: "#0b0b0d", border: 0, borderRadius: 8, padding: "9px 18px", fontWeight: 800, cursor: "pointer" }}>{busy === "save" ? "Saving…" : "Save project"}</button>

            {/* notes */}
            <div style={{ marginTop: 20, borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
              <div style={{ fontWeight: 800, marginBottom: 10, color: RED }}>Notes &amp; updates</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} placeholder="Add a note…" style={inp} />
                <button onClick={addNote} disabled={!!busy || !note.trim()} style={{ background: RED, color: "#fff", border: 0, borderRadius: 8, padding: "9px 18px", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>{busy === "note" ? "…" : "Add"}</button>
              </div>
              <div style={{ marginTop: 12, display: "grid", gap: 8, maxHeight: 220, overflow: "auto" }}>
                {lead.notes.length === 0 && <div style={{ fontSize: 13, color: MUTED }}>No notes yet.</div>}
                {lead.notes.map((n, i) => (
                  <div key={i} style={{ borderLeft: `3px solid ${O}`, paddingLeft: 10 }}>
                    <div style={{ fontSize: 11, color: MUTED }}>{n.authorName} · {new Date(n.createdAt).toLocaleString()}</div>
                    <div style={{ fontSize: 13 }}>{n.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
