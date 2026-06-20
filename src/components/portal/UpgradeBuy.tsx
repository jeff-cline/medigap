"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UpgradeBuy() {
  const router = useRouter();
  const [coupon, setCoupon] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  async function buy(kind: string) {
    setBusy(kind); setMsg("");
    const r = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, couponCode: coupon }) });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (d.url) { window.location.href = d.url; return; }
    if (d.free) { setMsg("✓ Covered by your coupon — your build is now generating. We'll email you when it's ready."); router.refresh(); return; }
    setMsg(`✗ ${d.error || "Could not start checkout."}`);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card p-5">
        <div className="text-2xl">🎬</div>
        <div className="font-semibold mt-2">Social Media Video Upgrade</div>
        <p className="text-sm text-[var(--muted)] mt-1">A series of high-quality Facebook & Instagram videos built from your site&apos;s data and our deep research — ready to launch.</p>
        <div className="text-2xl font-bold text-[var(--brand)] mt-3">$1,500</div>
        <button onClick={() => buy("video")} disabled={!!busy} className="btn btn-brand text-sm mt-3 w-full justify-center">{busy === "video" ? "Starting checkout…" : "Buy the video series →"}</button>
      </div>
      <div className="card p-5">
        <div className="text-2xl">🎨</div>
        <div className="font-semibold mt-2">Media Kit + Brand Guidelines</div>
        <p className="text-sm text-[var(--muted)] mt-1">Social graphics, a full media kit, and a polished brand-guidelines PDF (logo, colors, type) — officially baked.</p>
        <div className="text-2xl font-bold text-[var(--brand)] mt-3">$1,500</div>
        <button onClick={() => buy("mediakit")} disabled={!!busy} className="btn btn-brand text-sm mt-3 w-full justify-center">{busy === "mediakit" ? "Starting checkout…" : "Buy the media kit →"}</button>
      </div>
      <div className="md:col-span-2 flex items-center gap-2">
        <input className="!w-48" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code (optional)" />
        <span className="text-xs text-[var(--muted)]">Secure checkout by Stripe. Coupons apply your discount at checkout.</span>
      </div>
      {msg && <div className="md:col-span-2 text-sm" style={{ color: msg.startsWith("✓") ? "var(--brand)" : "var(--danger)" }}>{msg}</div>}
    </div>
  );
}
