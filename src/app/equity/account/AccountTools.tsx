"use client";

import { useState, useMemo } from "react";
import {
  amortise, agreementCost, accessibleEquity, breakEvenAppreciation,
} from "@/lib/equity/calc";

// The sticky part of the account: tools that answer the questions people
// actually have, including the one the industry tends not to answer — when is
// the agreement the *worse* deal.
//
// Everything recalculates live. Nothing is sent anywhere; this is the
// homeowner's own working-out.

const money = (c: number) =>
  `$${Math.round(c / 100).toLocaleString("en-US")}`;

const num = (v: string) => Math.max(0, Math.round(Number(String(v).replace(/[^0-9.]/g, "")) * 100)) || 0;

export default function AccountTools({
  homeValueCents, mortgageBalanceCents, wantedCents,
}: { homeValueCents: number; mortgageBalanceCents: number; wantedCents: number }) {
  // Seeded from what they told us, then theirs to play with.
  const [value, setValue] = useState(String(Math.round(homeValueCents / 100) || 450000));
  const [balance, setBalance] = useState(String(Math.round(mortgageBalanceCents / 100) || 220000));
  const [amount, setAmount] = useState(String(Math.round(wantedCents / 100) || 75000));

  const [rate, setRate] = useState("8.5");
  const [loanYears, setLoanYears] = useState("10");

  const [share, setShare] = useState("25");
  const [appreciation, setAppreciation] = useState("4");
  const [riskAdj, setRiskAdj] = useState("10");
  const [years, setYears] = useState("10");

  const v = num(value), b = num(balance), a = num(amount);

  const equity = useMemo(
    () => accessibleEquity({ homeValueCents: v, mortgageBalanceCents: b }),
    [v, b],
  );

  const loan = useMemo(
    () => amortise({ principalCents: a, annualRatePct: Number(rate) || 0, years: Number(loanYears) || 1 }),
    [a, rate, loanYears],
  );

  const agr = useMemo(
    () => agreementCost({
      advanceCents: a,
      homeValueCents: v,
      sharePct: Number(share) || 0,
      appreciationPct: Number(appreciation) || 0,
      years: Number(years) || 1,
      riskAdjustmentPct: Number(riskAdj) || 0,
    }),
    [a, v, share, appreciation, years, riskAdj],
  );

  const breakEven = useMemo(
    () => breakEvenAppreciation({
      advanceCents: a, homeValueCents: v, sharePct: Number(share) || 0,
      years: Number(years) || 1, riskAdjustmentPct: Number(riskAdj) || 0,
      loanTotalPaidCents: loan.totalPaidCents,
    }),
    [a, v, share, years, riskAdj, loan.totalPaidCents],
  );

  const agreementCheaper = agr.settlementCents < loan.totalPaidCents;

  return (
    <div style={{ marginTop: 44 }}>
      {/* ── what you could access ─────────────────────────────────── */}
      <section>
        <h2 className="eq-h2" style={{ fontSize: "1.5rem" }}>What you could access</h2>
        <p className="eq-sub" style={{ fontSize: "0.95rem" }}>
          Providers require you to keep a cushion of equity — {equity.retainedPct}% is the
          usual convention. This is an estimate from your own figures, not an offer.
        </p>

        <div className="eq-row eq-row-2" style={{ marginTop: 20, maxWidth: 520 }}>
          <Field label="Home value" value={value} onChange={setValue} prefix="$" />
          <Field label="Mortgage balance" value={balance} onChange={setBalance} prefix="$" />
        </div>

        <div className="eq-steps" style={{ marginTop: 26, gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
          <Stat label="Total equity" value={money(equity.totalEquityCents)} />
          <Stat label="Potentially accessible" value={money(equity.accessibleCents)} gold />
          <Stat label="Current loan-to-value" value={`${equity.currentLtvPct}%`} />
        </div>
      </section>

      {/* ── the comparison ────────────────────────────────────────── */}
      <section style={{ marginTop: 52 }}>
        <h2 className="eq-h2" style={{ fontSize: "1.5rem" }}>What a loan would look like, side by side</h2>
        <p className="eq-sub" style={{ fontSize: "0.95rem" }}>
          The same amount, two structures. Change the assumptions and watch which one
          wins — because it is not always the agreement.
        </p>

        <div className="eq-field" style={{ marginTop: 20, maxWidth: 250 }}>
          <label htmlFor="c-amount">Amount you need</label>
          <input id="c-amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        </div>

        <div className="eq-layout" style={{ marginTop: 26, gridTemplateColumns: "1fr 1fr", gap: 22 }}>
          {/* loan */}
          <div style={{ padding: 22, borderRadius: 14, border: "1px solid var(--line)", background: "var(--ink-2)" }}>
            <h3 className="eq-h3" style={{ color: "var(--parchment)" }}>Home equity loan</h3>
            <p style={{ fontSize: "0.86rem", color: "var(--slate)", marginTop: 4 }}>
              You borrow, you pay interest, you pay monthly.
            </p>
            <div className="eq-row eq-row-2" style={{ marginTop: 16 }}>
              <Field label="Rate %" value={rate} onChange={setRate} small />
              <Field label="Years" value={loanYears} onChange={setLoanYears} small />
            </div>
            <dl style={{ marginTop: 18, display: "grid", gap: 8, fontSize: "0.93rem" }}>
              <Row k="Monthly payment" v={money(loan.monthlyPaymentCents)} strong />
              <Row k="Total interest" v={money(loan.totalInterestCents)} />
              <Row k="Total paid" v={money(loan.totalPaidCents)} strong />
            </dl>
          </div>

          {/* agreement */}
          <div style={{ padding: 22, borderRadius: 14, border: "1px solid var(--gold)", background: "color-mix(in srgb, var(--gold) 6%, var(--ink-2))" }}>
            <h3 className="eq-h3" style={{ color: "var(--parchment)" }}>Equity agreement</h3>
            <p style={{ fontSize: "0.86rem", color: "var(--slate)", marginTop: 4 }}>
              No monthly payment. One settlement at the end.
            </p>
            <div className="eq-row eq-row-2" style={{ marginTop: 16 }}>
              <Field label="Their share %" value={share} onChange={setShare} small />
              <Field label="Years" value={years} onChange={setYears} small />
            </div>
            <div className="eq-row eq-row-2" style={{ marginTop: 12 }}>
              <Field label="Home growth %/yr" value={appreciation} onChange={setAppreciation} small />
              <Field label="Risk adjustment %" value={riskAdj} onChange={setRiskAdj} small />
            </div>
            <dl style={{ marginTop: 18, display: "grid", gap: 8, fontSize: "0.93rem" }}>
              <Row k="Monthly payment" v="None" strong />
              <Row k="Home worth then" v={money(agr.futureHomeValueCents)} />
              <Row k="You settle for" v={money(agr.settlementCents)} strong />
              <Row k="Cost of the money" v={money(agr.costCents)} />
            </dl>
          </div>
        </div>

        {/* the verdict */}
        <div style={{
          marginTop: 22, padding: "18px 22px", borderRadius: 13,
          border: `1px solid ${agreementCheaper ? "color-mix(in srgb, var(--good) 40%, transparent)" : "color-mix(in srgb, #ff5d6c 40%, transparent)"}`,
          background: agreementCheaper ? "color-mix(in srgb, var(--good) 10%, transparent)" : "rgba(255,93,108,0.08)",
        }}>
          <p style={{ fontWeight: 700, color: "var(--parchment)" }}>
            {agreementCheaper
              ? `On these assumptions the agreement costs ${money(loan.totalPaidCents - agr.settlementCents)} less than the loan.`
              : `On these assumptions the loan costs ${money(agr.settlementCents - loan.totalPaidCents)} less than the agreement.`}
          </p>
          <p style={{ marginTop: 8, fontSize: "0.88rem", color: "#b9c4d6" }}>
            {breakEven !== null ? (
              <>
                They break even at roughly <strong style={{ color: "var(--gold-lit)" }}>{breakEven}% a year</strong>{" "}
                of home price growth. Below that the agreement is cheaper; above it, the
                loan is. The agreement also has no monthly payment, which is worth real
                money if cash flow is the constraint — but it must be settled in one
                amount at the end.
              </>
            ) : (
              <>Enter an amount and a term to see the break-even point.</>
            )}
          </p>
        </div>

        <p style={{ marginTop: 16, fontSize: "0.8rem", color: "var(--slate)", lineHeight: 1.6 }}>
          Estimates only, from figures you entered. Not an offer, not a quote, and not
          advice. The implied annual cost of the agreement on these numbers is about{" "}
          {agr.impliedAnnualPct}% — shown for comparison, and it is not an APR. Real
          agreements differ in how the starting value is set, whether a decline is
          shared, and what caps apply. Read any actual agreement in full.
        </p>
      </section>

      {/* ── how to think about it ─────────────────────────────────── */}
      <section style={{ marginTop: 52 }}>
        <h2 className="eq-h2" style={{ fontSize: "1.5rem" }}>How to think about it</h2>
        <div className="eq-related-grid" style={{ marginTop: 18 }}>
          {THINKING.map((t) => (
            <div key={t.q} style={{ padding: "16px 18px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--ink-2)" }}>
              <strong style={{ display: "block", color: "var(--parchment)", fontSize: "0.97rem" }}>{t.q}</strong>
              <span style={{ display: "block", marginTop: 6, fontSize: "0.88rem", color: "#a8b4c6", lineHeight: 1.6 }}>
                {t.a}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const THINKING = [
  {
    q: "Can you settle it when it ends?",
    a: "There is no monthly payment, but there is one large amount due at the end. If the plan is to sell, that is straightforward. If the plan is to stay, you need a realistic route to refinancing or paying it — decided now, not in year nine.",
  },
  {
    q: "What do you think your home will do?",
    a: "The agreement costs more when your home appreciates fast, and less when it is flat. Nobody knows which will happen. Run the comparison above at a pessimistic rate and an optimistic one, and be comfortable with both answers.",
  },
  {
    q: "Is cash flow the real constraint?",
    a: "If you could service a loan payment comfortably, a loan is often cheaper. The agreement earns its keep when a monthly payment is the thing you genuinely cannot take on — starting a business, funding a gap, or retiring early.",
  },
  {
    q: "How long will you actually hold it?",
    a: "Shorter terms usually favour the agreement, because there is less appreciation to share. Very long terms tend to favour the loan, which is eventually paid off while the share keeps growing.",
  },
  {
    q: "What happens if values fall?",
    a: "This varies enormously between providers and is the question most worth asking directly. Some share the downside with you; others apply a floor that protects their position first. Get the answer in writing before you sign.",
  },
  {
    q: "Have you compared more than one?",
    a: "Terms differ a great deal — the share, the starting-value adjustment, the caps, and the settlement options. The first offer is not automatically the best one, and asking a second provider costs nothing.",
  },
];

function Field({ label, value, onChange, prefix, small }: {
  label: string; value: string; onChange: (v: string) => void; prefix?: string; small?: boolean;
}) {
  return (
    <div className="eq-field">
      <label>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--slate)", pointerEvents: "none" }}>
            {prefix}
          </span>
        )}
        <input value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal"
               style={{ paddingLeft: prefix ? 26 : undefined, fontSize: small ? "0.9rem" : undefined }} />
      </div>
    </div>
  );
}

function Stat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="eq-step">
      <h3 style={{ fontSize: "1.55rem", color: gold ? "var(--gold-lit)" : "var(--parchment)" }}>{value}</h3>
      <p>{label}</p>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <dt style={{ color: "var(--slate)" }}>{k}</dt>
      <dd style={{ margin: 0, fontWeight: strong ? 700 : 400, color: strong ? "var(--parchment)" : "#b9c4d6" }}>{v}</dd>
    </div>
  );
}
