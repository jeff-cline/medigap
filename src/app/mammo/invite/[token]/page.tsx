import { db } from "@/lib/db";
import InviteForm from "./InviteForm";
import { MammoHeader, MammoFooter } from "@/components/mammo/Chrome";

export const dynamic = "force-dynamic";

export default async function Invite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await db.mammoInvite.findUnique({ where: { token } }).catch(() => null);
  const valid = Boolean(inv && !inv.usedAt && inv.expiresAt > new Date());

  return (
    <>
      <MammoHeader />
      <main className="bg-white text-[#2E1065] min-h-[70vh]">
        <div className="max-w-md mx-auto px-4 py-14 md:py-20">
          {valid ? (
            <InviteForm token={token} email={inv!.email} name={inv!.name} />
          ) : (
            <>
              <h1 className="text-3xl font-black mb-3">This invite is no longer valid</h1>
              <p className="text-[#2E1065]/70">
                Invite links work once and expire after seven days. Ask for a fresh one.
              </p>
            </>
          )}
        </div>
      </main>
      <MammoFooter />
    </>
  );
}
