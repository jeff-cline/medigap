"use client";
import { useState } from "react";
import { TOLLFREE } from "@/lib/format";

export default function LeadForm({ vertical = "medicare", compact = false }: { vertical?: string; compact?: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [form, setForm] = useState({ name: "", phone: "", email: "", dob: "", zip: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      // If the visitor arrived from a tracked recapture link (/r/<id> → ?lead=<id>),
      // opt that existing contact in instead of creating a duplicate.
      const leadId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("lead") : null;
      await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, vertical, source: "organic", ...(leadId ? { leadId } : {}) }) });
    } catch {}
    setState("done");
  }

  if (state === "done")
    return (
      <div className="card p-6 text-center glow">
        <div className="text-2xl">✅</div>
        <h3 className="mt-2 text-lg font-semibold">You&apos;re all set!</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">A licensed specialist will reach out. For the fastest help, call {TOLLFREE} now.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="card p-6 glow">
      <div className="text-sm font-semibold mb-1">See what you qualify for — free</div>
      <p className="text-xs text-[var(--muted)] mb-4">No obligation. Takes 30 seconds.</p>
      <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        <input required placeholder="Full name" value={form.name} onChange={set("name")} />
        <input required placeholder="Phone" value={form.phone} onChange={set("phone")} />
        <input placeholder="Email" type="email" value={form.email} onChange={set("email")} />
        <input placeholder="Date of birth" value={form.dob} onChange={set("dob")} />
        <input required placeholder="ZIP code" value={form.zip} onChange={set("zip")} className={compact ? "" : "sm:col-span-2"} />
      </div>
      <button disabled={state === "loading"} className="btn btn-brand w-full mt-4 justify-center">
        {state === "loading" ? "Submitting…" : "Get My Free Quote →"}
      </button>
      <p className="mt-3 text-[10px] leading-tight text-[var(--muted)]">
        By submitting you agree to be contacted by phone/SMS/email about insurance and related senior products, including by autodialer; consent not required to buy.
      </p>
    </form>
  );
}
