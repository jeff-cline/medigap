"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SocialMetricsControls({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function pull() {
    setBusy(true); setMsg("Pulling from Facebook…");
    const r = await fetch("/api/social/pull", { method: "POST" }).then((r) => r.json()).catch(() => ({}));
    setBusy(false);
    if (r.ok) { setMsg(`✅ Captured ${r.captured} page snapshot${r.captured === 1 ? "" : "s"}${r.errors?.length ? ` · ${r.errors.join("; ")}` : ""}`); router.refresh(); }
    else setMsg(`⚠️ ${r.error || "Pull failed"}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href="/api/oauth/fb_social/start" className="btn btn-ghost text-sm">{connected ? "↻ Reconnect business" : "📘 Connect the Doublewide business"}</a>
      <button onClick={pull} disabled={busy} className="btn btn-brand text-sm">{busy ? "Pulling…" : "⟳ Pull metrics now"}</button>
      {msg && <span className="text-xs text-[var(--muted)]">{msg}</span>}
    </div>
  );
}
