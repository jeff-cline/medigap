"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type SettingsProps = {
  minCallBidCents: number;
  mgmtFeePct: number;
  profitSharePct: number;
  aiFeePct: number;
  futureProofingPct: number;
  investorPct: number;
  arbitrageTarget: number;
  autonomousMode: string;
  autoApproveAgent: boolean;
  autoApproveAdvertiser: boolean;
  autoApproveInvestor: boolean;
  defaultCallPriceCents: number;
  defaultForwardNumber: string;
  showUnrealized: boolean;
  callWhisper: boolean;
};

function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</label>
      {children}
      {sub && <p className="mt-1 text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full rounded-lg bg-[var(--panel2)] border border-[var(--border)] px-3 py-2.5 text-sm"
    >
      <span>{label}</span>
      <span className={`inline-flex h-5 w-9 items-center rounded-full transition ${checked ? "bg-[var(--brand)]" : "bg-[var(--border)]"}`}>
        <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}

export default function SettingsForm(props: SettingsProps) {
  const router = useRouter();
  const [minCallBid, setMinCallBid] = useState((props.minCallBidCents / 100).toString());
  const [mgmtFee, setMgmtFee] = useState(props.mgmtFeePct.toString());
  const [profitShare, setProfitShare] = useState(props.profitSharePct.toString());
  const [aiFee, setAiFee] = useState(props.aiFeePct.toString());
  const [futureProofing, setFutureProofing] = useState(props.futureProofingPct.toString());
  const [investorAlloc, setInvestorAlloc] = useState(props.investorPct.toString());
  const [arbitrage, setArbitrage] = useState(props.arbitrageTarget.toString());
  const [mode, setMode] = useState(props.autonomousMode);
  const [autoAgent, setAutoAgent] = useState(props.autoApproveAgent);
  const [autoAdvertiser, setAutoAdvertiser] = useState(props.autoApproveAdvertiser);
  const [autoInvestor, setAutoInvestor] = useState(props.autoApproveInvestor);
  const [defaultCallPrice, setDefaultCallPrice] = useState((props.defaultCallPriceCents / 100).toString());
  const [forwardNumber, setForwardNumber] = useState(props.defaultForwardNumber);
  const [showUnrealized, setShowUnrealized] = useState(props.showUnrealized);
  const [whisper, setWhisper] = useState(props.callWhisper);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    // Min Call Bid is entered in dollars → persist as cents.
    const minCallBidCents = Math.round((parseFloat(minCallBid) || 0) * 100);
    const payload: Record<string, string> = {
      minCallBidCents: String(minCallBidCents),
      mgmtFeePct: mgmtFee,
      profitSharePct: profitShare,
      aiFeePct: aiFee,
      futureProofingPct: futureProofing,
      investorPct: investorAlloc,
      arbitrageTarget: arbitrage,
      autonomousMode: mode,
      autoApproveAgent: String(autoAgent),
      autoApproveAdvertiser: String(autoAdvertiser),
      autoApproveInvestor: String(autoInvestor),
      defaultCallPriceCents: String(Math.round((parseFloat(defaultCallPrice) || 0) * 100)),
      defaultForwardNumber: forwardNumber.replace(/[^\d+]/g, ""),
      showUnrealized: String(showUnrealized),
      callWhisper: String(whisper),
    };
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save settings.");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-1">Bidding</h2>
        <p className="text-sm text-[var(--muted)] mb-4">The auction floor for inbound calls.</p>
        <div className="card p-5 grid gap-4 md:grid-cols-2">
          <Field label="Min Call Bid ($)" sub="Floor agents must clear to bid.">
            <input type="number" step="0.01" value={minCallBid} onChange={(e) => setMinCallBid(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Arbitrage Target (x)" sub="Target revenue ÷ spend ratio.">
            <input type="number" step="0.1" value={arbitrage} onChange={(e) => setArbitrage(e.target.value)} className={inputCls} />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-1">Calls &amp; House Revenue</h2>
        <p className="text-sm text-[var(--muted)] mb-4">Calls no agent buys are forwarded to your house number and booked at the default price as <b>unrealized</b> revenue.</p>
        <div className="card p-5 grid gap-4 md:grid-cols-2">
          <Field label="Default (House) Call Price ($)" sub="Booked to your God account for every unsold/default call.">
            <input type="number" step="0.01" value={defaultCallPrice} onChange={(e) => setDefaultCallPrice(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Default Forward Number" sub="Where unsold calls are bridged (e.g. 972-800-6670).">
            <input type="tel" value={forwardNumber} onChange={(e) => setForwardNumber(e.target.value)} className={inputCls} />
          </Field>
          <Toggle label="Show Unrealized revenue in totals (forwards & backwards)" checked={showUnrealized} onChange={setShowUnrealized} />
          <Toggle label="Whisper to agent on connect" checked={whisper} onChange={setWhisper} />
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">Turning Show Unrealized off recomputes every dashboard total to realized-only — accounting always sees it flagged UNREALIZED regardless.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-1">Investor Waterfall</h2>
        <p className="text-sm text-[var(--muted)] mb-4">How profit is split across fees and investors.</p>
        <div className="card p-5 grid gap-4 md:grid-cols-2">
          <Field label="Mgmt Fee %" sub="Off-the-top management fee.">
            <input type="number" step="0.1" value={mgmtFee} onChange={(e) => setMgmtFee(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Profit Share %" sub="Operator share of net profit.">
            <input type="number" step="1" value={profitShare} onChange={(e) => setProfitShare(e.target.value)} className={inputCls} />
          </Field>
          <Field label="AI Fee %" sub="Carve-out for AI operations.">
            <input type="number" step="0.1" value={aiFee} onChange={(e) => setAiFee(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Future-Proofing %" sub="Reinvestment reserve.">
            <input type="number" step="1" value={futureProofing} onChange={(e) => setFutureProofing(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Investor Allocation % Open" sub="Share of the round still open to investors.">
            <input type="number" step="1" value={investorAlloc} onChange={(e) => setInvestorAlloc(e.target.value)} className={inputCls} />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-1">Autonomous AI</h2>
        <p className="text-sm text-[var(--muted)] mb-4">How much the AI is allowed to do on its own.</p>
        <div className="card p-5 grid gap-4 md:grid-cols-2">
          <Field label="Autonomous Mode" sub="off / assist / learning / full">
            <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputCls}>
              <option value="off">off</option>
              <option value="assist">assist</option>
              <option value="learning">learning</option>
              <option value="full">full</option>
            </select>
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-1">Approvals</h2>
        <p className="text-sm text-[var(--muted)] mb-4">Auto-approve new signups by role.</p>
        <div className="card p-5 grid gap-3 md:grid-cols-3">
          <Toggle label="Auto-Approve Agents" checked={autoAgent} onChange={setAutoAgent} />
          <Toggle label="Auto-Approve Advertisers" checked={autoAdvertiser} onChange={setAutoAdvertiser} />
          <Toggle label="Auto-Approve Investors" checked={autoInvestor} onChange={setAutoInvestor} />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className="btn btn-brand text-sm disabled:opacity-60">
          {busy ? "Saving…" : "Save settings"}
        </button>
        {saved && <span className="text-sm text-[var(--brand)]">Settings saved.</span>}
        {error && <span className="text-sm text-[var(--danger)]">{error}</span>}
      </div>
      <p className="text-xs text-[var(--muted)]">Persisted to the Setting table. Wired next: audit log on change.</p>
    </form>
  );
}
