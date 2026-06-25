"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const LEFT_NAV: [string, string, string][] = [
  ["Overview", "/dashboard", "▦"],
  ["JV / PE / VC", "/dashboard/jv", "💼"],
  ["Leads CRM", "/dashboard/leads", "👥"],
  ["Calls", "/dashboard/calls", "📞"],
  ["Arm Cloud", "/dashboard/arm-cloud", "☁"],
  ["Social & Creators", "/dashboard/social", "📣"],
  ["Missed Calls", "/dashboard/missed-calls", "📵"],
  ["Train Agent", "/dashboard/voice-agent", "🎙️"],
  ["Communications", "/dashboard/communications", "✉️"],
  ["Coupons", "/dashboard/coupons", "🎟️"],
  ["Marketing Sites", "/dashboard/sites", "🌐"],
  ["Affiliate Partners", "/dashboard/partners", "🤝"],
  ["Partner Payouts", "/dashboard/payouts", "💸"],
  ["Marketing / Ads", "/dashboard/marketing", "📣"],
  ["Integrations", "/dashboard/integrations", "🔌"],
  ["CORE API & SDK", "/core-api", "🧩"],
  ["User Management", "/dashboard/users", "🔐"],
  ["Autonomous Logic", "/dashboard/autonomous", "✦"],
  ["Missed Opportunity", "/dashboard/missed", "⚠️"],
  ["Settings", "/dashboard/settings", "⚙️"],
];

export const UNIT_TABS: [string, string][] = [
  ["Overview", "/dashboard"],
  ["Agents", "/dashboard/agents"],
  ["Advertisers", "/dashboard/advertisers"],
  ["Money Words", "/dashboard/money-words"],
  ["Live Upsells", "/dashboard/upsells"],
  ["Autonomous Risk", "/dashboard/risk"],
  ["Investors", "/dashboard/investors"],
  ["Accounting", "/dashboard/accounting"],
];

export function Sidebar({ email, role }: { email: string; role: string }) {
  const path = usePathname();
  // Assistants run the founder's JV space only — they don't see the rest of the dash.
  const nav = role === "assistant" ? LEFT_NAV.filter(([, href]) => href === "/dashboard/jv") : LEFT_NAV;
  return (
    <aside className="w-60 shrink-0 border-r border-[var(--border)] bg-[var(--panel)] min-h-screen sticky top-0 hidden lg:flex flex-col">
      <Link href={role === "assistant" ? "/dashboard/jv" : "/dashboard"} className="px-5 h-16 flex items-center text-xl font-bold text-gradient">medigap.plus</Link>
      <nav className="flex-1 px-3 py-3 space-y-1">
        {nav.map(([label, href, icon]) => {
          const active = path === href;
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${active ? "bg-[var(--brand)]/10 text-[var(--brand)]" : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel2)]"}`}>
              <span className="w-4 text-center">{icon}</span>{label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[var(--border)]">
        <div className="rounded-lg bg-[var(--panel2)] p-3">
          <div className="text-xs text-[var(--muted)]">Signed in</div>
          <div className="text-sm font-medium truncate">{email}</div>
          <div className="mt-1"><span className="text-[10px] uppercase tracking-wide text-[var(--gold)]">{role === "god" ? "★ GOD ACCOUNT" : role}</span></div>
          <form action="/api/auth/logout" method="post" onSubmit={(e) => { e.preventDefault(); fetch("/api/auth/logout", { method: "POST" }).then(() => (window.location.href = "/login")); }}>
            <button className="btn btn-ghost text-xs w-full justify-center mt-2 !py-1.5">Sign out</button>
          </form>
        </div>
      </div>
    </aside>
  );
}

export function UnitTabs({ role }: { role?: string } = {}) {
  const path = usePathname();
  if (role === "assistant") return null;
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)] px-2">
      {UNIT_TABS.map(([label, href]) => {
        const active = path === href;
        return (
          <Link key={href} href={href} className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 -mb-px ${active ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"}`}>{label}</Link>
        );
      })}
    </div>
  );
}
