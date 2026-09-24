import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPartnerSession } from "@/lib/equity/partner-auth";
import PartnerLogin from "./PartnerLogin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partner sign in | Equity Direct",
  description: "Referral partner sign in.",
  robots: { index: false, follow: false },
};

export default async function PartnersPage() {
  const s = await getPartnerSession();
  if (s) redirect("/partners/referrals");

  return (
    <main className="eq-wrap eq-narrow" style={{ padding: "72px 24px 96px" }}>
      <h1 className="eq-h1" style={{ fontSize: "clamp(1.9rem,4vw,2.6rem)" }}>
        Partner sign in
      </h1>
      <p className="eq-lede" style={{ fontSize: "1rem" }}>
        See the homeowners you have referred and where each one has got to.
      </p>
      <div style={{ marginTop: 32, maxWidth: 440 }}>
        <PartnerLogin />
      </div>
      <p style={{ marginTop: 26, fontSize: "0.88rem", color: "var(--slate)" }}>
        Partner accounts are created by invitation. If you work with homeowners who
        need access to equity and would like to refer them, get in touch and we will
        send you an invitation.
      </p>
    </main>
  );
}
