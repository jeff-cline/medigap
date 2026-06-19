import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar, UnitTabs } from "@/components/dash/Nav";

const STAFF = ["god", "marketing", "accounting"];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustChangePassword) redirect("/change-password");
  // Agents/advertisers/investors have their own portals; staff + god use the management dash.
  if (!STAFF.includes(session.role)) {
    const portal: Record<string, string> = { agent: "/agent", advertiser: "/advertiser", investor: "/investor" };
    redirect(portal[session.role] || "/login");
  }

  return (
    <div className="flex">
      <Sidebar email={session.email} role={session.role} />
      <div className="flex-1 min-w-0">
        <UnitTabs />
        <main className="p-6 max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}
