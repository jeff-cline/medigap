import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession, isGod } from "@/lib/auth";
import { getActiveEngine } from "@/lib/static/engine";
import { db } from "@/lib/db";
import { grantedNavHrefs } from "@/lib/features";
import { Sidebar, UnitTabs } from "@/components/dash/Nav";
import ImpersonationBar from "@/components/ImpersonationBar";
import EngineToggle from "@/components/static/EngineToggle";
import Notifications from "@/components/dash/Notifications";

const STAFF = ["god", "marketing", "accounting", "assistant", "developer"];

// Global kill switch for the Developer section (God-controlled). Unset = on.
export async function developerEnabled(): Promise<boolean> {
  const row = await db.setting.findUnique({ where: { key: "developer.enabled" } }).catch(() => null);
  return row?.value !== "0";
}

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

  const me = await db.user.findUnique({ where: { id: session.uid }, select: { features: true } });
  const devEnabled = await developerEnabled();

  // Restricted developer accounts only reach the sections the God account granted them;
  // any other dashboard URL bounces to their Developer home (which itself shows a
  // disabled notice when the global switch is off). Their home is always reachable.
  if (session.role === "developer") {
    const path = (await headers()).get("x-pathname") || "";
    const granted = grantedNavHrefs(me?.features);
    const allowed = path === "/dashboard/developer" || granted.has(path);
    if (!allowed) redirect("/dashboard/developer");
  }

  const engine = isGod(session) ? await getActiveEngine() : null;

  return (
    <div className="flex">
      <Sidebar email={session.email} role={session.role} features={me?.features ?? ""} devEnabled={devEnabled} />
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
