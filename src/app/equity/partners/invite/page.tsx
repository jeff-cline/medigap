import type { Metadata } from "next";
import { db } from "@/lib/db";
import AcceptInvite from "./AcceptInvite";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Accept your invitation | Equity Direct",
  robots: { index: false, follow: false },
};

export default async function InvitePage({
  searchParams,
}: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const invite = token
    ? await db.eqInvite.findUnique({ where: { token } }).catch(() => null)
    : null;

  const valid = invite && !invite.usedAt && invite.expiresAt > new Date();

  return (
    <main className="eq-wrap eq-narrow" style={{ padding: "72px 24px 96px" }}>
      <h1 className="eq-h1" style={{ fontSize: "clamp(1.9rem,4vw,2.6rem)" }}>
        {valid ? "Set your password" : "That invitation is not valid"}
      </h1>

      {valid ? (
        <>
          <p className="eq-lede" style={{ fontSize: "1rem" }}>
            You are setting up the partner account for <strong>{invite!.email}</strong>.
            Choose a password and you will be signed straight in.
          </p>
          <div style={{ marginTop: 32, maxWidth: 440 }}>
            <AcceptInvite token={token!} />
          </div>
        </>
      ) : (
        <p className="eq-lede" style={{ fontSize: "1rem" }}>
          This invitation has expired, has already been used, or the link is
          incomplete. Ask us to send you a new one and it will arrive within a
          few minutes.
        </p>
      )}
    </main>
  );
}
