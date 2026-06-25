import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import PortalShell from "@/components/portal/PortalShell";

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.mustChangePassword) redirect("/change-password");
  // Creators + god (impersonating / viewing). Others go to their own home.
  if (!(s.role === "creator" || s.role === "god" || s.impersonatorUid)) redirect("/login");
  return (
    <PortalShell title="Creator Studio" email={s.email} impersonator={s.impersonatorEmail}>
      {children}
    </PortalShell>
  );
}
