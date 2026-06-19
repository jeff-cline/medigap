"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls =
  "mt-1 w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";

function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</label>
      {children}
      {sub && <p className="mt-1 text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

export default function MarketingCampaignForm() {
  const router = useRouter();
  const [channel, setChannel] = useState("google");
  const [name, setName] = useState("");
  const [vertical, setVertical] = useState("medicare");
  const [variant, setVariant] = useState("A");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [spend, setSpend] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (!name.trim()) {
      setError("Campaign name is required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/marketing/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          channel,
          name,
          vertical,
          variant,
          headline,
          description,
          spendCents: Math.round((parseFloat(spend) || 0) * 100),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not create campaign.");
        return;
      }
      setDone(true);
      setName("");
      setHeadline("");
      setDescription("");
      setSpend("0");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 grid gap-4 md:grid-cols-2">
      <Field label="Channel">
        <select value={channel} onChange={(e) => setChannel(e.target.value)} className={inputCls}>
          <option value="google">Google</option>
          <option value="facebook">Facebook</option>
          <option value="tv">TV</option>
          <option value="vibe">Vibe</option>
          <option value="organic">Organic</option>
        </select>
      </Field>
      <Field label="Campaign name">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Medigap Search — Brand" className={inputCls} />
      </Field>
      <Field label="Vertical" sub="medicare, plan-g, turning-65…">
        <input value={vertical} onChange={(e) => setVertical(e.target.value)} className={inputCls} />
      </Field>
      <Field label="A/B Variant" sub="The platform rotates and auto-promotes the winner.">
        <select value={variant} onChange={(e) => setVariant(e.target.value)} className={inputCls}>
          <option value="A">A</option>
          <option value="B">B</option>
        </select>
      </Field>
      <Field label="Seed headline" sub="We auto-insert tracking links & test variants.">
        <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Compare Medigap Plans in 60 Seconds" className={inputCls} />
      </Field>
      <Field label="Seed description">
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Licensed agents. No obligation. Call 1-800-MEDIGAP." className={inputCls} />
      </Field>
      <Field label="Initial spend ($)" sub="Auto-syncs from Google/Meta once OAuth-connected.">
        <input type="number" step="0.01" min={0} value={spend} onChange={(e) => setSpend(e.target.value)} className={inputCls} />
      </Field>
      <div className="md:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={busy} className="btn btn-brand text-sm disabled:opacity-60">
          {busy ? "Creating…" : "Add campaign"}
        </button>
        {error && <span className="text-sm text-[var(--danger)]">{error}</span>}
        {done && <span className="text-sm text-[var(--brand)]">Campaign created.</span>}
      </div>
    </form>
  );
}
