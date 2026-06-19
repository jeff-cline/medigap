import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import PortalShell from "@/components/portal/PortalShell";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.mustChangePassword) redirect("/change-password");
  if (s.role !== "agent" && s.role !== "god") redirect("/login");

  return (
    <PortalShell title="Agent Portal" email={s.email}>
      {children}
    </PortalShell>
  );
}
