"use client";
// Soft real-time refresh for God dashboards: re-runs the server component every N seconds
// (no full page reload) so visitor data stays live. Toggleable.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [on, seconds, router]);
  return (
    <button onClick={() => setOn((o) => !o)} title="Toggle live auto-refresh"
      style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", border: "1px solid #e9ecf1", borderRadius: 100, padding: "6px 13px", fontSize: 12.5, fontWeight: 700, color: on ? "#12a150" : "#5b6472", cursor: "pointer" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: on ? "#12a150" : "#b7bcc4" }} />
      {on ? "Live" : "Paused"}
      <style>{`@keyframes pcpl{0%{opacity:1}50%{opacity:.35}100%{opacity:1}}`}</style>
    </button>
  );
}
