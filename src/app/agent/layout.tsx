import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import PortalShell from "@/components/portal/PortalShell";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.mustChangePassword) redirect("/change-password");
  // Partner portal: agents + money-word/risk partners + god (impersonating). Advertisers/investors have their own.
  if (["advertiser", "investor"].includes(s.role)) redirect("/login");

  return (
    <PortalShell title="Partner Portal" email={s.email} impersonator={s.impersonatorEmail}>
      {children}
    </PortalShell>
  );
}
