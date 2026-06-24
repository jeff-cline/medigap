"use client";
import { useMemo } from "react";
import { annualModel, monthlyModel, fmtUsd, fmtUsd0, fmtNum, RAMP_MONTHS, PEAK_PER_MONTH, ANNUAL_PREMIUM, COMMISSION_RATE, POLICY_LIFE_MONTHS, MARKETING_FEE } from "@/lib/addmortgage";
import { IllustrativeBadge } from "@/components/agetech/primitives";

export default function AddProforma() {
  const years = useMemo(() => annualModel(), []);
  const months = useMemo(() => monthlyModel(), []);
  const totals = {
    newPolicies: years.reduce((a, y) => a + y.newPolicies, 0),
    marketingFee: years.reduce((a, y) => a + y.marketingFee, 0),
    commission: years.reduce((a, y) => a + y.commission, 0),
    totalIncome: years.reduce((a, y) => a + y.totalIncome, 0),
    activeEnd: years[years.length - 1].activeEnd,
  };

  return (
    <div className="space-y-5">
      {/* assumption strip */}
      <div className="ag-panel p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
        <span className="ag-mono text-[var(--ag-cyan)] font-bold">AD&amp;D Mortgage</span>
        <Fact k="Ramp" v={`0 → ${PEAK_PER_MONTH.toLocaleString()}/mo over ${RAMP_MONTHS} mo`} />
        <Fact k="Premium" v={`$${ANNUAL_PREMIUM}/yr`} />
        <Fact k="Commission" v={`${Math.round(COMMISSION_RATE * 100)}% ($${Math.round(ANNUAL_PREMIUM * COMMISSION_RATE)}/yr)`} />
        <Fact k="Policy life" v={`${POLICY_LIFE_MONTHS / 12} yrs`} />
        <Fact k="Marketing fee" v={`$${MARKETING_FEE}/policy`} />
        <span className="ml-auto"><IllustrativeBadge /></span>
      </div>

      {/* GRAPH — annual income (marketing + commission) + active policies */}
      <div className="ag-panel p-5 md:p-6">
        <div className="text-xs uppercase tracking-widest text-[var(--ag-muted)] mb-4">10-year income · marketing fee + commission · active policies</div>
        <Chart years={years} />
      </div>

      {/* ANNUAL PIVOT */}
      <div className="ag-panel p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="text-sm text-[var(--ag-muted)]">Annual pivot · 10-year projection — full monthly detail (120 months) is in the Excel file</div>
          <a href="/api/mortgage/xlsx" className="ag-btn ag-btn-primary text-sm !py-2 !px-4">⬇ Monthly Excel (.xlsx)</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full ag-mono text-[17px] md:text-[18px] min-w-[760px]">
            <thead>
              <tr className="text-[var(--ag-muted)] text-[13px] uppercase tracking-wider">
                <th className="text-left font-semibold pb-3 pr-3">Year</th>
                <th className="text-right font-semibold pb-3 px-3">New policies</th>
                <th className="text-right font-semibold pb-3 px-3">Active (EOY)</th>
                <th className="text-right font-semibold pb-3 px-3">Marketing fee</th>
                <th className="text-right font-semibold pb-3 px-3">Commission</th>
                <th className="text-right font-semibold pb-3 px-3">Total income</th>
                <th className="text-right font-semibold pb-3 px-3">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {years.map((y) => (
                <tr key={y.year} className="border-t border-[var(--ag-border)]/50">
                  <td className="py-2.5 pr-3 font-sans text-[var(--ag-text)]">Year {y.year}</td>
                  <td className="text-right px-3 text-[var(--ag-text)]">{fmtNum(y.newPolicies)}</td>
                  <td className="text-right px-3 text-[var(--ag-text)]">{fmtNum(y.activeEnd)}</td>
                  <td className="text-right px-3 text-[var(--ag-green)]">{fmtUsd0(y.marketingFee)}</td>
                  <td className="text-right px-3 text-[var(--ag-cyan)]">{fmtUsd0(y.commission)}</td>
                  <td className="text-right px-3 text-[var(--ag-gold)] font-bold">{fmtUsd0(y.totalIncome)}</td>
                  <td className="text-right px-3 text-[var(--ag-gold)]">{fmtUsd0(y.cumIncome)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[var(--ag-gold)] font-bold">
                <td className="py-3 pr-3 font-sans text-[var(--ag-text)]">10-yr total</td>
                <td className="text-right px-3 text-[var(--ag-text)]">{fmtNum(totals.newPolicies)}</td>
                <td className="text-right px-3 text-[var(--ag-text)]">{fmtNum(totals.activeEnd)}</td>
                <td className="text-right px-3 text-[var(--ag-green)]">{fmtUsd0(totals.marketingFee)}</td>
                <td className="text-right px-3 text-[var(--ag-cyan)]">{fmtUsd0(totals.commission)}</td>
                <td className="text-right px-3 text-[var(--ag-gold)]">{fmtUsd0(totals.totalIncome)}</td>
                <td className="text-right px-3 text-[var(--ag-gold)]">{fmtUsd0(years[years.length - 1].cumIncome)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[13px] text-[var(--ag-muted)]">
          Income is the <b className="text-[var(--ag-text)]">$250 marketing fee</b> per new policy (partner-paid) plus the recurring <b className="text-[var(--ag-text)]">35% commission</b> ($35/yr per active policy, while in force).
          Steady state ≈ {fmtNum(PEAK_PER_MONTH * POLICY_LIFE_MONTHS)} active policies → ~{fmtUsd(PEAK_PER_MONTH * 12 * MARKETING_FEE + PEAK_PER_MONTH * POLICY_LIFE_MONTHS * ANNUAL_PREMIUM * COMMISSION_RATE)}/yr. Illustrative &amp; editable.
        </p>
      </div>

      {/* monthly ramp mini-chart (first 36 months) */}
      <div className="ag-panel p-5 md:p-6">
        <div className="text-xs uppercase tracking-widest text-[var(--ag-muted)] mb-3">Monthly ramp · new &amp; active policies (first 36 months)</div>
        <MonthlyRamp months={months.slice(0, 36)} />
      </div>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return <span className="text-[var(--ag-muted)]">{k}: <b className="text-[var(--ag-text)] ag-mono">{v}</b></span>;
}

function Chart({ years }: { years: ReturnType<typeof annualModel> }) {
  const W = 760, H = 300, padL = 64, padB = 40, padT = 16, padR = 16;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const max = Math.max(...years.map((y) => y.totalIncome)) * 1.12;
  const maxActive = Math.max(...years.map((y) => y.activeEnd)) * 1.1;
  const n = years.length, bw = (innerW / n) * 0.55;
  const x = (i: number) => padL + (innerW / n) * (i + 0.5);
  const y = (v: number) => padT + innerH - (v / max) * innerH;
  const yA = (v: number) => padT + innerH - (v / maxActive) * innerH;
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[600px]" role="img" aria-label="AD&D income and active policies by year">
        {Array.from({ length: 5 }).map((_, t) => { const v = (max / 4) * t; const yy = y(v); return (
          <g key={t}><line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="#1b2740" /><text x={padL - 8} y={yy + 4} textAnchor="end" fontSize={11} fill="#8595b4" fontFamily="monospace">{fmtUsd(v)}</text></g>
        ); })}
        {years.map((yy, i) => {
          const mk = (yy.marketingFee / max) * innerH, cm = (yy.commission / max) * innerH; const bx = x(i) - bw / 2;
          return (
            <g key={yy.year}>
              <rect x={bx} y={padT + innerH - mk} width={bw} height={mk} fill="#3ee6a6" rx={3} />
              <rect x={bx} y={padT + innerH - mk - cm} width={bw} height={cm} fill="#38e1ff" rx={3} />
              <text x={x(i)} y={H - padB + 16} textAnchor="middle" fontSize={12} fill="#9baac6">Y{yy.year}</text>
              <text x={x(i)} y={padT + innerH - mk - cm - 6} textAnchor="middle" fontSize={11} fill="#eaf1ff" fontFamily="monospace">{fmtUsd(yy.totalIncome)}</text>
            </g>
          );
        })}
        {/* active policies line (right scale) */}
        <polyline fill="none" stroke="#d8b46a" strokeWidth={2.5} points={years.map((yy, i) => `${x(i)},${yA(yy.activeEnd)}`).join(" ")} />
        {years.map((yy, i) => <circle key={i} cx={x(i)} cy={yA(yy.activeEnd)} r={4} fill="#d8b46a" />)}
      </svg>
      <div className="flex flex-wrap gap-4 mt-2 text-[13px]">
        <Legend color="#3ee6a6" label="Marketing fee" />
        <Legend color="#38e1ff" label="Commission (35%)" />
        <Legend color="#d8b46a" label="Active policies" />
      </div>
    </div>
  );
}

function MonthlyRamp({ months }: { months: ReturnType<typeof monthlyModel> }) {
  const W = 760, H = 180, padL = 50, padB = 24, padT = 10, padR = 12;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const max = Math.max(...months.map((m) => m.activePolicies)) * 1.1;
  const x = (i: number) => padL + (innerW / months.length) * (i + 0.5);
  const y = (v: number) => padT + innerH - (v / max) * innerH;
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label="Monthly policy ramp">
        <polyline fill="none" stroke="#38e1ff" strokeWidth={2} points={months.map((m, i) => `${x(i)},${y(m.activePolicies)}`).join(" ")} />
        {months.map((m, i) => (m.month % 6 === 0 || m.month === 1) ? <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={10} fill="#8595b4">M{m.month}</text> : null)}
        <text x={padL - 6} y={y(max) + 12} textAnchor="end" fontSize={10} fill="#8595b4" fontFamily="monospace">active</text>
      </svg>
      <div className="text-[12px] text-[var(--ag-muted)] mt-1">New policies ramp 0 → 1,000/mo over 24 months; active policies climb toward the 72,000 plateau.</div>
    </div>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5 text-[var(--ag-muted)]"><span className="w-3 h-3 rounded-sm" style={{ background: color }} />{label}</span>;
}
