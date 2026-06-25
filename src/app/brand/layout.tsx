import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import PortalShell from "@/components/portal/PortalShell";

export default async function BrandLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.mustChangePassword) redirect("/change-password");
  if (!(s.role === "brand" || s.role === "god" || s.impersonatorUid)) redirect("/login");
  return (
    <PortalShell title="Brand Studio" email={s.email} impersonator={s.impersonatorEmail}>
      {children}
    </PortalShell>
  );
}
