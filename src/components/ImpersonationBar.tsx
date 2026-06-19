"use client";
// Shows when God is acting as another account; one click to return.
export default function ImpersonationBar({ email, impersonator }: { email: string; impersonator: string }) {
  async function stop() {
    await fetch("/api/impersonate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stop: true }) });
    window.location.href = "/dashboard";
  }
  return (
    <div className="sticky top-0 z-50 bg-[var(--gold)] text-black text-sm font-medium px-4 py-2 flex items-center justify-center gap-3">
      <span>👁️ Viewing as <b>{email}</b> — impersonated by {impersonator}</span>
      <button onClick={stop} className="rounded-md bg-black/85 text-white px-3 py-1 text-xs font-semibold hover:bg-black">Return to God account</button>
    </div>
  );
}
