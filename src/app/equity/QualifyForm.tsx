"use client";

import { useEffect, useRef, useState } from "react";
import { CONSENT_TEXT, FORM_DISCLOSURE, SPEED_CLAIM, SPEED_FOOTNOTE } from "@/lib/equity/consent";

// The qualification form. Appears on all 100 keyword pages, inline in the hero,
// and inside the modal the CTAs open. It carries the slug so the CRM knows
// which reason the person arrived with.
//
// RecaptchaProvider in the Core's root layout wraps fetch and attaches a token
// to same-origin JSON POSTs at registered endpoints, so /api/equity/lead is
// protected without anything extra here.
export default function QualifyForm({
  slug = "", reason = "", autoFocus = false, onDone,
}: {
  slug?: string; reason?: string; autoFocus?: boolean; onDone?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    ref: string; hasAccount: boolean; redirectUrl: string; redirectDelay: number;
  } | null>(null);
  const [counting, setCounting] = useState<number | null>(null);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) firstField.current?.focus();
  }, [autoFocus]);

  // Post-submission redirect. Counted down visibly rather than fired instantly:
  // being thrown to another site the moment you hand over your details feels
  // like a hijack, and the reference number is worth reading first.
  useEffect(() => {
    if (!done?.redirectUrl) return;
    if (counting === null) {
      setCounting(Math.max(0, done.redirectDelay));
      return;
    }
    if (counting <= 0) {
      window.location.href = done.redirectUrl;
      return;
    }
    const t = setTimeout(() => setCounting((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [done, counting]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/equity/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: f.get("firstName"), lastName: f.get("lastName"),
          email: f.get("email"), phone: f.get("phone"), zip: f.get("zip"),
          estValue: f.get("estValue"), mortgageBal: f.get("mortgageBal"),
          amountWanted: f.get("amountWanted"), timeline: f.get("timeline"),
          reasonNote: f.get("reasonNote"),
          consent: f.get("consent") === "on",
          slug,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!j.ok) {
        setError(j.error || "Something went wrong. Please try again.");
        return;
      }
      setDone({
        ref: j.ref || "received",
        hasAccount: Boolean(j.hasAccount),
        redirectUrl: String(j.redirectUrl || ""),
        redirectDelay: Number(j.redirectDelay ?? 4),
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="eq-form-card" id="qualify">
        <div className="eq-success">
          <h3>{done.hasAccount ? "Your account is open." : "We have what we need."}</h3>
          <p>
            Someone will be in touch to walk through your options. Nothing is
            committed and there is no obligation at any point.
          </p>
          <span className="eq-ref">{done.ref}</span>

          {done.hasAccount && (
            <p style={{ marginTop: 16 }}>
              We have emailed you a link to your account, where you can compare an
              equity agreement against a loan and work out what each one costs.
            </p>
          )}

          <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {done.hasAccount && (
              <a href="/account" className="eq-btn">Open my account</a>
            )}
            {onDone && (
              <button type="button" className="eq-btn eq-btn-ghost" onClick={onDone}>Close</button>
            )}
          </div>

          {done.redirectUrl && counting !== null && (
            <p style={{ marginTop: 18, fontSize: "0.83rem", color: "var(--slate)" }}>
              Taking you to the next step
              {counting > 0 ? ` in ${counting}…` : "…"}{" "}
              <a href={done.redirectUrl} style={{ color: "var(--gold)", textDecoration: "underline" }}>
                go now
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="eq-form-card" id="qualify" onSubmit={submit} noValidate>
      <div className="eq-form-top">
        <div className="eq-form-title">See what you could access</div>
        <p className="eq-form-sub">
          {reason
            ? `Free and no obligation. Tell us about the property and we will come back on ${reason.toLowerCase()}.`
            : "Free and no obligation. It takes about two minutes and does not affect your credit score."}
        </p>
        <p className="eq-speed">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="currentColor" />
          </svg>
          <span>{SPEED_CLAIM}</span>
        </p>
      </div>

      <div className="eq-form-body">
        <div className="eq-row eq-row-2">
          <div className="eq-field">
            <label htmlFor="q-first">First name</label>
            <input id="q-first" name="firstName" autoComplete="given-name" ref={firstField} />
          </div>
          <div className="eq-field">
            <label htmlFor="q-last">Last name</label>
            <input id="q-last" name="lastName" autoComplete="family-name" />
          </div>
        </div>

        <div className="eq-field">
          <label htmlFor="q-email">Email</label>
          <input id="q-email" name="email" type="email" inputMode="email"
                 autoComplete="email" placeholder="you@example.com" />
        </div>

        <div className="eq-row eq-row-2">
          <div className="eq-field">
            <label htmlFor="q-phone">Phone</label>
            <input id="q-phone" name="phone" type="tel" inputMode="tel"
                   autoComplete="tel" placeholder="(555) 555-5555" />
          </div>
          <div className="eq-field">
            <label htmlFor="q-zip">Property ZIP</label>
            <input id="q-zip" name="zip" inputMode="numeric" maxLength={5}
                   autoComplete="postal-code" placeholder="00000" required />
          </div>
        </div>

        <div className="eq-row eq-row-2">
          <div className="eq-field">
            <label htmlFor="q-value">Estimated value</label>
            <input id="q-value" name="estValue" inputMode="decimal" placeholder="$450,000" />
          </div>
          <div className="eq-field">
            <label htmlFor="q-bal">Mortgage balance</label>
            <input id="q-bal" name="mortgageBal" inputMode="decimal" placeholder="$220,000" />
          </div>
        </div>

        <div className="eq-row eq-row-2">
          <div className="eq-field">
            <label htmlFor="q-amount">Amount needed</label>
            <input id="q-amount" name="amountWanted" inputMode="decimal" placeholder="$75,000" />
          </div>
          <div className="eq-field">
            <label htmlFor="q-when">Timeline</label>
            <select id="q-when" name="timeline" defaultValue="">
              <option value="">Select…</option>
              <option value="asap">As soon as possible</option>
              <option value="30days">Within 30 days</option>
              <option value="90days">Within 90 days</option>
              <option value="researching">Just researching</option>
            </select>
          </div>
        </div>

        <div className="eq-field">
          <label htmlFor="q-note">Anything else we should know</label>
          <textarea id="q-note" name="reasonNote" rows={2}
                    placeholder="Optional" maxLength={2000} />
        </div>

        {error && <p className="eq-error">{error}</p>}

        <label className="eq-consent">
          <input type="checkbox" name="consent" />
          <span>{CONSENT_TEXT}</span>
        </label>

        <button className="eq-btn" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
          {busy ? "Sending…" : "Create my account and see my options"}
        </button>

        <p className="eq-disclosure">{FORM_DISCLOSURE}</p>
        <p className="eq-disclosure">{SPEED_FOOTNOTE}</p>
      </div>
    </form>
  );
}
