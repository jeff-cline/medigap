"use client";
export default function StopImpersonate({ email }: { email: string }) {
  return (
    <div style={{ background: "#fef3c7", borderBottom: "1px solid #f59e0b", padding: "10px 16px", textAlign: "center", fontSize: 13.5, color: "#92400e" }}>
      👁 Viewing as God{email ? ` (${email})` : ""}.
      <button onClick={async () => { await fetch("/api/quuik/impersonate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stop: true }) }); location.href = "/account"; }}
        style={{ marginLeft: 8, background: "#92400e", color: "#fff", border: 0, borderRadius: 100, padding: "5px 12px", fontWeight: 700, cursor: "pointer" }}>Stop &amp; return to console</button>
    </div>
  );
}
