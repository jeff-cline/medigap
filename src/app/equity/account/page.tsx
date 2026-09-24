import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAccountSession, signInWithToken } from "@/lib/equity/account";
import { getEquitySettings, telHref } from "@/lib/equity/settings";
import { bySlug, pathFor } from "@/lib/equity";
import AccountTools from "./AccountTools";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your account | Equity Direct",
  robots: { index: false, follow: false },
};

// The homeowner's back office.
//
// Reached either from an existing session or from a magic link in the welcome
// email (?t=<token>). No password anywhere — see lib/equity/account.ts for why.
export default async function AccountPage({
  searchParams,
}: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;

  // A token in the URL signs them in, then we send them to the clean path so
  // the link does not sit in history or get shared with the token attached.
  if (t) {
    const acct = await signInWithToken(t);
    if (acct) redirect("/account");
  }

  const session = await getAccountSession();
  if (!session) redirect("/account/signin");

  const account = await db.eqAccount.findUnique({ where: { id: session.id } }).catch(() => null);
  if (!account) redirect("/account/signin");

  const lead = account.leadId
    ? await db.eqLead.findUnique({ where: { id: account.leadId } }).catch(() => null)
    : null;

  const settings = await getEquitySettings();
  const use = lead?.slug ? bySlug(lead.slug) : undefined;

  return (
    <main className="eq-wrap" style={{ padding: "48px 24px 90px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <p className="eq-eyebrow">Your account</p>
          <h1 className="eq-h1" style={{ fontSize: "clamp(1.8rem,3.6vw,2.4rem)", marginTop: 14 }}>
            {account.firstName ? `Hello, ${account.firstName}.` : "Hello."}
          </h1>
        </div>
        <Link href="/account/signout" style={{ fontSize: "0.88rem", color: "var(--slate)" }}>
          Sign out
        </Link>
      </div>

      {/* What we hold for them. Shown back so they can see it arrived right. */}
      <div className="eq-stat" style={{ marginTop: 28, gap: "14px 32px" }}>
        {lead && (
          <>
            <div>
              <span style={{ display: "block", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--gold-lit)", fontWeight: 600 }}>
                Reference
              </span>
              <span style={{ fontFamily: "ui-monospace,monospace", fontSize: "1.1rem", color: "var(--parchment)" }}>
                {lead.ref}
              </span>
            </div>
            <div>
              <span style={{ display: "block", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--gold-lit)", fontWeight: 600 }}>
                Estimated equity
              </span>
              <span style={{ fontSize: "1.1rem", color: "var(--parchment)" }}>
                {lead.estEquity > 0
                  ? `$${(lead.estEquity / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                  : "—"}
              </span>
            </div>
          </>
        )}
        <div>
          <span style={{ display: "block", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--gold-lit)", fontWeight: 600 }}>
            Talk to someone
          </span>
          <a href={telHref(settings.phone)} style={{ fontSize: "1.1rem", color: "var(--parchment)" }}>
            {settings.phone}
          </a>
        </div>
        {use && (
          <span className="eq-stat-src">
            You started on{" "}
            <Link href={pathFor(use)} style={{ textDecoration: "underline" }}>{use.reason}</Link>.
          </span>
        )}
      </div>

      {settings.redirectUrl && (
        <p style={{ marginTop: 22 }}>
          <a href={settings.redirectUrl} className="eq-btn" target="_blank" rel="noopener noreferrer">
            Continue your application
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.4"
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </p>
      )}

      <AccountTools
        homeValueCents={lead?.estValue ?? 0}
        mortgageBalanceCents={lead?.mortgageBal ?? 0}
        wantedCents={lead?.amountWanted ?? 0}
      />
    </main>
  );
}
