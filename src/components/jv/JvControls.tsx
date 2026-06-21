"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { JV_INTERESTS } from "@/lib/jv-constants";

const F = "mt-1 w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";

export default function JvControls({ isGod }: { isGod: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState<"" | "add" | "assistant">("");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [c, setC] = useState({ name: "", phone: "", email: "", zip: "", jvInterest: "", priority: "" });
  const [a, setA] = useState({ name: "", email: "", phone: "" });

  async function call(url: string, body: object, label: string) {
    setBusy(label); setNote("");
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    return d;
  }

  async function testText() {
    const d = await call("/api/jv/lead", { action: "test" }, "test");
    setNote(d.error ? d.error : "✓ Test text sent to the founder cell (972-800-6670).");
  }
  async function addContact() {
    const d = await call("/api/jv/lead", { action: "create", ...c }, "add");
    if (d.error) { setNote(d.error); return; }
    setOpen(""); setC({ name: "", phone: "", email: "", zip: "", jvInterest: "", priority: "" });
    if (d.id) router.push(`/dashboard/jv/${d.id}`);
  }
  async function addAssistant() {
    const d = await call("/api/jv/assistant", a, "assistant");
    if (d.error) { setNote(d.error); return; }
    setNote(`✓ Assistant created — temp password ${d.tempPassword}. They run the JV CRM as your persona.`);
    setOpen(""); setA({ name: "", email: "", phone: "" });
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setOpen(open === "add" ? "" : "add")} className="btn btn-brand text-sm">+ Add deal</button>
        <button onClick={testText} disabled={!!busy} className="btn btn-ghost text-sm">{busy === "test" ? "Sending…" : "📱 Test text to me"}</button>
        {isGod && <button onClick={() => setOpen(open === "assistant" ? "" : "assistant")} className="btn btn-ghost text-sm">+ Add assistant</button>}
      </div>
      {note && <div className="text-xs text-[var(--brand)] mt-2">{note}</div>}

      {open === "add" && (
        <div className="card !p-4 mt-3 grid gap-3 sm:grid-cols-2 max-w-2xl">
          <div><label className="text-[10px] uppercase text-[var(--muted)]">Name</label><input className={F} value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></div>
          <div><label className="text-[10px] uppercase text-[var(--muted)]">Phone</label><input className={F} value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} placeholder="+1 972 555 0123" /></div>
          <div><label className="text-[10px] uppercase text-[var(--muted)]">Email</label><input className={F} value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} /></div>
          <div><label className="text-[10px] uppercase text-[var(--muted)]">ZIP</label><input className={F} value={c.zip} onChange={(e) => setC({ ...c, zip: e.target.value })} /></div>
          <div><label className="text-[10px] uppercase text-[var(--muted)]">Interest</label>
            <select className={F} value={c.jvInterest} onChange={(e) => setC({ ...c, jvInterest: e.target.value })}>
              <option value="">—</option>{JV_INTERESTS.map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}
            </select></div>
          <div><label className="text-[10px] uppercase text-[var(--muted)]">Priority</label>
            <select className={F} value={c.priority} onChange={(e) => setC({ ...c, priority: e.target.value })}>
              <option value="">—</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select></div>
          <div className="sm:col-span-2"><button onClick={addContact} disabled={busy === "add"} className="btn btn-brand text-sm">{busy === "add" ? "Adding…" : "Create deal →"}</button></div>
        </div>
      )}

      {open === "assistant" && isGod && (
        <div className="card !p-4 mt-3 grid gap-3 sm:grid-cols-2 max-w-2xl">
          <p className="sm:col-span-2 text-xs text-[var(--muted)]">Your assistant signs in and manages the JV CRM as your persona. Texts still send from 1-800-MEDIGAP; their notes are attributed to them.</p>
          <div><label className="text-[10px] uppercase text-[var(--muted)]">Name</label><input className={F} value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} /></div>
          <div><label className="text-[10px] uppercase text-[var(--muted)]">Email</label><input className={F} value={a.email} onChange={(e) => setA({ ...a, email: e.target.value })} placeholder="assistant@…" /></div>
          <div><label className="text-[10px] uppercase text-[var(--muted)]">Phone (optional)</label><input className={F} value={a.phone} onChange={(e) => setA({ ...a, phone: e.target.value })} /></div>
          <div className="sm:col-span-2"><button onClick={addAssistant} disabled={busy === "assistant"} className="btn btn-brand text-sm">{busy === "assistant" ? "Creating…" : "Create assistant →"}</button></div>
        </div>
      )}
    </div>
  );
}
