import { redirect } from "next/navigation";
import { getSession, isGod } from "@/lib/auth";
import { getActiveEngine } from "@/lib/static/engine";
import { Sidebar, UnitTabs } from "@/components/dash/Nav";
import ImpersonationBar from "@/components/ImpersonationBar";
import EngineToggle from "@/components/static/EngineToggle";
import Notifications from "@/components/dash/Notifications";

const STAFF = ["god", "marketing", "accounting", "assistant"];

// Always render fresh so the engine toggle reflects the live setting (Static is the default).
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustChangePassword) redirect("/change-password");
  // Agents/advertisers/investors/partners have their own portals; staff + god use the management dash.
  if (!STAFF.includes(session.role)) {
    const portal: Record<string, string> = { agent: "/agent", moneywords: "/agent", risk: "/agent", advertiser: "/advertiser", investor: "/investor", creator: "/creator", brand: "/brand", growth: "/growth", marketing_partner: "/partner" };
    redirect(portal[session.role] || "/agent"); // default any other role into the partner portal, never /login
  }

  const engine = isGod(session) ? await getActiveEngine() : null;

  return (
    <div className="flex">
      <Sidebar email={session.email} role={session.role} />
      <div className="flex-1 min-w-0">
        {session.impersonatorEmail && <ImpersonationBar email={session.email} impersonator={session.impersonatorEmail} />}
        <div className="flex items-center justify-between gap-2 px-6 pt-2">
          <div>{engine && <EngineToggle current={engine} />}</div>
          <Notifications />
        </div>
        <UnitTabs role={session.role} />
        <main className="p-6 max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}
