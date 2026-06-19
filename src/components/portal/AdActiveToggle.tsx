"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Ad = {
  id: string;
  kind: string;
  headline: string;
  body: string;
  assetUrl: string;
  targetUrl: string;
  bidCents: number;
  placement: string;
  active: boolean;
};

export default function AdActiveToggle({ ad }: { ad: Ad }) {
  const router = useRouter();
  const [on, setOn] = useState(ad.active);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !on;
    setBusy(true);
    setOn(next); // optimistic
    try {
      const res = await fetch("/api/advertiser/ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ad.id,
          kind: ad.kind,
          headline: ad.headline,
          body: ad.body,
          assetUrl: ad.assetUrl,
          targetUrl: ad.targetUrl,
          bidCents: ad.bidCents,
          placement: ad.placement,
          active: next,
        }),
      });
      if (!res.ok) {
        setOn(!next); // revert
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={on}
      title={on ? "Active — click to pause" : "Paused — click to activate"}
      className={`relative h-6 w-11 rounded-full border transition-colors disabled:opacity-60 ${
        on ? "bg-[var(--brand)]/30 border-[var(--brand)]/40" : "bg-[var(--panel2)] border-[var(--border)]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
          on ? "left-6 bg-[var(--brand)]" : "left-0.5 bg-[var(--muted)]"
        }`}
      />
    </button>
  );
}
