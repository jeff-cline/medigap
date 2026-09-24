"use client";
import { useState } from "react";
import PlatformNav, { NAV_WIDTH } from "@/components/elag/PlatformNav";

type Row = { uid: string; business: string; name: string; email: string; moneyWord: string; status: string; baseCpc: number; clicks: number; adjacent: string[]; supporting: string[] };
type WordStat = { keyword: string; clicks: number };
const O = "#F5821F", INK = "#1c2128", MUT = "#5b6572", LINE = "#e4e7ec";

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json().catch(() => ({}));
}

export default function GodConsole({ email, rows, moneyWordStats }: { email: string; rows: Row[]; moneyWordStats: WordStat[] }) {
  const [busy, setBusy] = useState("");
  const [kw, setKw] = useState({ keyword: "", url: "", title: "", desc: "" });
  const [msg, setMsg] = useState("");
  const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", border: `1px solid ${LINE}`, borderRadius: 9, fontSize: 14, color: "#111", background: "#fff", outline: "none" };

  async function approve(uid: string, op: "approve" | "pause") { setBusy(uid + op); await post("/api/quuik/god", { op, uid }); location.reload(); }
  async function impersonate(uid: string) { setBusy(uid + "imp"); const r = await post("/api/quuik/impersonate", { uid }); if (r.ok) location.href = "/account"; else { setBusy(""); alert(r.error || "Could not impersonate."); } }
  async function addKeyword() {
    if (!kw.keyword || !kw.url) { setMsg("Keyword and destination URL are required."); return; }
    setBusy("addkw"); setMsg("");
    const r = await post("/api/quuik/god", { op: "add-keyword", ...kw });
    setBusy("");
    if (r.ok) { setMsg(`Added el.ag/${r.keyword} ✓`); setKw({ keyword: "", url: "", title: "", desc: "" }); } else setMsg(r.error || "Could not add.");
  }
  const pending = rows.filter((r) => (r.status || "pending") === "pending").length;
  const stc = (s: string) => (s === "active" || s === "founding" ? "#12a150" : s === "paused" ? "#b3261e" : "#b7791f");

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f7", paddingLeft: NAV_WIDTH, fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", color: INK }}>
      <PlatformNav active="account" email={email} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "30px 26px 80px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Advertisers &amp; Keywords</h1>
        <p style={{ color: MUT, fontSize: 14, marginTop: 6 }}>{rows.length} accounts · {pending} pending · {moneyWordStats.length} live money words. Approve keywords, add new ones, see clicks by money word, and drill into any account.</p>

        {/* Add keyword */}
        <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, marginTop: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 10px" }}>➕ Add a keyword</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input placeholder="money word (e.g. medicare-plans)" value={kw.keyword} onChange={(e) => setKw({ ...kw, keyword: e.target.value })} style={inp} />
            <input placeholder="destination URL (https://…)" value={kw.url} onChange={(e) => setKw({ ...kw, url: e.target.value })} style={inp} />
            <input placeholder="title (optional)" value={kw.title} onChange={(e) => setKw({ ...kw, title: e.target.value })} style={inp} />
            <input placeholder="description (optional)" value={kw.desc} onChange={(e) => setKw({ ...kw, desc: e.target.value })} style={inp} />
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={addKeyword} disabled={busy === "addkw"} style={{ background: O, color: "#fff", border: 0, borderRadius: 100, padding: "10px 20px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>{busy === "addkw" ? "Adding…" : "Add keyword"}</button>
            {msg && <span style={{ fontSize: 13, color: msg.includes("✓") ? "#12a150" : "#b3261e" }}>{msg}</span>}
          </div>
        </div>

        {/* Clicks by money word */}
        <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, marginTop: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 10px" }}>📊 Clicks by money word</h2>
          {moneyWordStats.length === 0 ? <p style={{ color: MUT, fontSize: 13.5 }}>No clicks yet.</p> : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {moneyWordStats.map((w) => <a key={w.keyword} href={`https://el.ag/leads?kw=${encodeURIComponent(w.keyword)}`} target="_blank" rel="noopener" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7, background: "#fff5ef", border: `1px solid ${O}44`, color: INK, borderRadius: 100, padding: "5px 12px", fontSize: 13, fontWeight: 600 }}>{w.keyword}<b style={{ color: O }}>{w.clicks}</b></a>)}
            </div>
          )}
        </div>

        {/* Advertisers */}
        <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, marginTop: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 10px" }}>🧾 Accounts</h2>
          {rows.length === 0 ? <p style={{ color: MUT, fontSize: 13.5 }}>No advertiser accounts yet.</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead><tr>{["Business", "Money word", "Status", "CPC", "Clicks", ""].map((h) => <th key={h} style={{ textAlign: "left", color: MUT, fontSize: 11, textTransform: "uppercase", padding: "8px 10px", borderBottom: `1px solid ${LINE}`, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.uid}>
                      <td style={{ padding: "10px", borderTop: `1px solid ${LINE}` }}><b>{r.business}</b><div style={{ color: MUT, fontSize: 12 }}>{r.name} · {r.email}</div></td>
                      <td style={{ padding: "10px", borderTop: `1px solid ${LINE}` }}>{r.moneyWord}</td>
                      <td style={{ padding: "10px", borderTop: `1px solid ${LINE}`, color: stc(r.status), fontWeight: 700 }}>● {r.status}</td>
                      <td style={{ padding: "10px", borderTop: `1px solid ${LINE}` }}>${r.baseCpc.toFixed(2)}</td>
                      <td style={{ padding: "10px", borderTop: `1px solid ${LINE}` }}>{r.clicks}</td>
                      <td style={{ padding: "10px", borderTop: `1px solid ${LINE}`, whiteSpace: "nowrap" }}>
                        {r.status === "active" || r.status === "founding"
                          ? <button onClick={() => approve(r.uid, "pause")} disabled={!!busy} style={{ background: "#fff", color: "#b3261e", border: "1px solid #f0c4c0", borderRadius: 100, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginRight: 6 }}>Pause</button>
                          : <button onClick={() => approve(r.uid, "approve")} disabled={!!busy} style={{ background: "#12a150", color: "#fff", border: 0, borderRadius: 100, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginRight: 6 }}>Approve</button>}
                        <button onClick={() => impersonate(r.uid)} disabled={!!busy} style={{ background: "#0f1b2d", color: "#fff", border: 0, borderRadius: 100, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Drill in →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
