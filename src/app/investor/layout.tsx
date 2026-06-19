import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import PortalShell from "@/components/portal/PortalShell";

export default async function InvestorLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.mustChangePassword) redirect("/change-password");
  if (s.role !== "investor" && s.role !== "god") redirect("/login");

  return (
    <PortalShell title="Investor Portal" email={s.email}>
      {children}
    </PortalShell>
  );
}
