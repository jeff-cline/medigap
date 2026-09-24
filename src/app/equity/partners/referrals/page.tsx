import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPartnerSession } from "@/lib/equity/partner-auth";
import { bySlug, pathFor } from "@/lib/equity";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your referrals | Equity Direct",
  robots: { index: false, follow: false },
};

const DAY = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago",
});

const STAGE_LABEL: Record<string, string> = {
  lead: "New", contacted: "Contacted", qualified: "Qualified",
  submitted: "Submitted", funded: "Funded", declined: "Declined", lost: "Closed",
};

// What a partner sees about the homeowners they referred.
//
// First name and last initial only, with no email or phone. A partner needs to
// recognise who they sent and know how it is progressing — they do not need the
// homeowner's contact details, and the homeowner did not consent to the partner
// having them. This is the same rule the instructor portal on Beyond Limits
// follows, and for the same reason.
export default async function PartnerReferrals() {
  const s = await getPartnerSession();
  if (!s) redirect("/partners");

  const partner = await db.eqPartner.findUnique({ where: { id: s.id } });
  if (!partner || !partner.active) redirect("/partners");

  const leads = await db.eqLead.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true, ref: true, firstName: true, lastName: true,
      zip: true, slug: true, category: true, stage: true,
      amountWanted: true, createdAt: true,
    },
  }).catch(() => []);

  const count = (st: string) => leads.filter((l) => l.stage === st).length;
  const link = `https://equity.direct/?p=${partner.code}`;

  return (
    <main className="eq-wrap" style={{ padding: "48px 24px 96px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h1 className="eq-h1" style={{ fontSize: "clamp(1.8rem,3.6vw,2.4rem)", marginTop: 0 }}>
            Your referrals
          </h1>
          <p style={{ color: "var(--slate)", marginTop: 6 }}>
            {partner.name || partner.email}
            {partner.company ? ` · ${partner.company}` : ""}
          </p>
        </div>
        <Link href="/partners/signout" style={{ fontSize: "0.88rem", color: "var(--slate)" }}>
          Sign out
        </Link>
      </div>

      {/* Their link */}
      <div className="eq-stat" style={{ marginTop: 28 }}>
        <span style={{ fontSize: "0.74rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--gold-lit)", fontWeight: 600, width: "100%" }}>
          Your referral link
        </span>
        <code style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "1rem", color: "var(--parchment)", wordBreak: "break-all" }}>
          {link}
        </code>
        <span className="eq-stat-src">
          Anyone who starts from this link is attributed to you. You can also send
          them to any of the hundred reason pages with <code>?p={partner.code}</code> on the end.
        </span>
      </div>

      {/* Counts */}
      <div className="eq-steps" style={{ marginTop: 32, gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
        {[
          ["Total referred", leads.length],
          ["New", count("lead")],
          ["Qualified", count("qualified")],
          ["Funded", count("funded")],
        ].map(([label, n]) => (
          <div className="eq-step" key={String(label)}>
            <h3 style={{ fontSize: "1.9rem" }}>{n as number}</h3>
            <p>{label as string}</p>
          </div>
        ))}
      </div>

      <section style={{ marginTop: 44 }}>
        <h2 className="eq-h2" style={{ fontSize: "1.4rem" }}>Everyone you have sent</h2>
        <p style={{ marginTop: 8, fontSize: "0.88rem", color: "var(--slate)" }}>
          First name and last initial only. Contact details stay with us — your
          referrals did not agree to their details being shared onward.
        </p>

        {leads.length === 0 ? (
          <p style={{ marginTop: 22, padding: "26px", borderRadius: 13, border: "1px dashed var(--line)", color: "var(--slate)" }}>
            Nothing yet. Share your link above and referrals will appear here as they arrive.
          </p>
        ) : (
          <div style={{ marginTop: 18, overflowX: "auto", border: "1px solid var(--line)", borderRadius: 13 }}>
            <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <thead>
                <tr style={{ background: "var(--ink-2)", textAlign: "left" }}>
                  {["Reference", "Name", "ZIP", "Reason", "Stage", "Date"].map((h) => (
                    <th key={h} style={{ padding: "11px 15px", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--slate)", fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => {
                  const use = bySlug(l.slug);
                  return (
                    <tr key={l.id} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={{ padding: "12px 15px", fontFamily: "ui-monospace, monospace", fontSize: "0.85rem", color: "var(--gold-lit)" }}>
                        {l.ref}
                      </td>
                      <td style={{ padding: "12px 15px", color: "var(--parchment)", fontWeight: 600 }}>
                        {l.firstName || "—"}{l.lastName ? ` ${l.lastName.charAt(0)}.` : ""}
                      </td>
                      <td style={{ padding: "12px 15px", color: "#a8b4c6" }}>{l.zip || "—"}</td>
                      <td style={{ padding: "12px 15px", color: "#a8b4c6" }}>
                        {use ? (
                          <Link href={pathFor(use)} style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>
                            {use.reason}
                          </Link>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "12px 15px" }}>
                        <span style={{
                          fontSize: "0.76rem", fontWeight: 700, padding: "4px 10px", borderRadius: 999,
                          background: l.stage === "funded" ? "rgba(63,156,109,0.18)" : "var(--ink-3)",
                          color: l.stage === "funded" ? "#9fdcbb" : "var(--slate)",
                        }}>
                          {STAGE_LABEL[l.stage] ?? l.stage}
                        </span>
                      </td>
                      <td style={{ padding: "12px 15px", color: "var(--slate)", fontSize: "0.85rem" }}>
                        {DAY.format(l.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
