"use client";
import { useState } from "react";
import { FULL_STACK_MONTHLY } from "@/lib/secretweapon";

const usd = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${Math.round(n).toLocaleString()}`;

// The pitch: you invest for 12 months; we expect to DOUBLE your revenue in 12–18 months,
// then double again. The calculator proves the spend is small vs. the profit it unlocks.
export default function SecretWeaponCalc() {
  const [rev, setRev] = useState(2_000_000);
  const [margin, setMargin] = useState(0.25);
  const [monthly, setMonthly] = useState(FULL_STACK_MONTHLY);

  const currentProfit = rev * margin;
  const annualSpend = monthly * 12;
  const y1Rev = rev * 2;                 // doubled
  const y1Profit = y1Rev * margin;
  const profitGain = y1Profit - currentProfit;        // = currentProfit
  const netAfterSpend = profitGain - annualSpend;
  const roiX = annualSpend > 0 ? profitGain / annualSpend : 0;
  const spendPct = rev > 0 ? annualSpend / rev : 0;
  const y2Rev = y1Rev * 2;               // doubled again

  return (
    <div className="card p-6 md:p-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <Field label="Your current annual revenue" value={usd(rev)}>
            <input type="range" min={250000} max={50_000_000} step={250000} value={rev} onChange={(e) => setRev(+e.target.value)} className="w-full" />
          </Field>
          <Field label="Your net margin" value={`${Math.round(margin * 100)}%`}>
            <input type="range" min={0.05} max={0.6} step={0.01} value={margin} onChange={(e) => setMargin(+e.target.value)} className="w-full" />
          </Field>
          <Field label="Secret Weapon investment / month" value={usd(monthly)}>
            <input type="range" min={10500} max={120000} step={500} value={monthly} onChange={(e) => setMonthly(+e.target.value)} className="w-full" />
            <div className="text-[11px] text-[var(--muted)] mt-1">Full Stack is {usd(FULL_STACK_MONTHLY)}/mo · slide to model any tier.</div>
          </Field>
        </div>

        <div>
          {/* revenue ramp */}
          <div className="space-y-2 mb-5">
            {[["Today", rev, "var(--muted)"], ["12–18 months · doubled", y1Rev, "var(--brand)"], ["~24 months · doubled again", y2Rev, "var(--gold)"]].map(([label, v, color], i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1"><span className="text-[var(--muted)]">{label as string}</span><span className="font-semibold" style={{ color: color as string }}>{usd(v as number)}</span></div>
                <div className="h-2.5 rounded-full bg-[var(--border)] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${((v as number) / y2Rev) * 100}%`, background: color as string }} /></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="New annual profit" value={usd(y1Profit)} sub={`+${usd(profitGain)} / yr`} tone="brand" />
            <Stat label="Annual investment" value={usd(annualSpend)} sub={`${(spendPct * 100).toFixed(1)}% of revenue`} tone="default" />
            <Stat label="Net profit after spend" value={usd(netAfterSpend)} sub="year one of the double" tone={netAfterSpend >= 0 ? "brand" : "down"} />
            <Stat label="Return on investment" value={`${roiX.toFixed(1)}×`} sub="profit gain ÷ spend" tone="gold" />
          </div>
          <p className="text-xs text-[var(--muted)] mt-4 leading-relaxed">
            You invest for 12 months. We&apos;re playing to <b className="text-[var(--text)]">double your revenue in 12–18 months — then double again</b>. If the math doesn&apos;t work for you, we&apos;re not your team. Illustrative; your numbers, your assumptions.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex justify-between items-baseline mb-2"><span className="text-sm text-[var(--muted)]">{label}</span><span className="font-semibold text-[var(--brand)]">{value}</span></div>
      {children}
    </label>
  );
}
function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "brand" | "gold" | "down" | "default" }) {
  const c = tone === "gold" ? "text-[var(--gold)]" : tone === "down" ? "text-[var(--danger)]" : tone === "brand" ? "text-[var(--brand)]" : "text-[var(--text)]";
  return (
    <div className="rounded-xl border border-[var(--border)] p-3">
      <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className={`text-2xl font-bold mt-0.5 ${c}`}>{value}</div>
      <div className="text-[11px] text-[var(--muted)] mt-0.5">{sub}</div>
    </div>
  );
}
