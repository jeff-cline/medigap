import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar, UnitTabs } from "@/components/dash/Nav";
import ImpersonationBar from "@/components/ImpersonationBar";

const STAFF = ["god", "marketing", "accounting", "assistant"];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustChangePassword) redirect("/change-password");
  // Agents/advertisers/investors/partners have their own portals; staff + god use the management dash.
  if (!STAFF.includes(session.role)) {
    const portal: Record<string, string> = { agent: "/agent", moneywords: "/agent", risk: "/agent", advertiser: "/advertiser", investor: "/investor" };
    redirect(portal[session.role] || "/agent"); // default any other role into the partner portal, never /login
  }

  return (
    <div className="flex">
      <Sidebar email={session.email} role={session.role} />
      <div className="flex-1 min-w-0">
        {session.impersonatorEmail && <ImpersonationBar email={session.email} impersonator={session.impersonatorEmail} />}
        <UnitTabs role={session.role} />
        <main className="p-6 max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}
