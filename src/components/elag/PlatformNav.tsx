// Single shared God left-nav for the WHOLE platform. Absolute URLs so it works identically from
// quuik.com and el.ag. Used by the quuik God console, the Visitors view, and every el.ag admin page.
import LogoutLink from "@/components/elag/LogoutLink";

const ITEMS: [string, string, string, string][] = [
  ["home", "🏠", "Ask Quuik", "https://quuik.com/"],
  ["account", "🧾", "Advertisers & Keywords", "https://quuik.com/account"],
  ["investor", "📈", "Investor room", "https://quuik.com/investor"],
  ["live", "🔴", "Live now", "https://quuik.com/account/live"],
  ["visitors", "👁", "Visitors", "https://quuik.com/account/visitors"],
  ["short", "🔗", "House traffic", "https://el.ag/short"],
  ["leads", "👥", "Leads", "https://el.ag/leads"],
  ["ml", "🧪", "Predictive ML", "https://el.ag/ml"],
  ["cloud", "☁️", "MoneyWord Cloud", "https://el.ag/m/d=6,t=5,c=all,newest,theme=business/show"],
  ["editor", "✏️", "Cloud editor", "https://el.ag/cloud"],
  ["integrations", "🔌", "Integrations", "https://el.ag/integrations"],
  ["embed", "🧩", "Embeds", "https://el.ag/embed"],
  ["quuik", "❓", "Quuik Q&A", "https://el.ag/quuik-admin"],
  ["advertisers", "🧾", "Ad accounts", "https://el.ag/ad-accounts"],
  ["world", "🌍", "Change the World", "https://quuik.com/change-the-world"],
];

export const NAV_WIDTH = 216;

export default function PlatformNav({ active, email }: { active: string; email?: string }) {
  return (
    <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: NAV_WIDTH, background: "#0f1b2d", color: "#fff", zIndex: 50, overflowY: "auto", padding: "16px 12px 72px", boxSizing: "border-box", fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif" }}>
      <a href="https://quuik.com/account" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px 16px", fontWeight: 800, fontSize: 15.5, color: "#fff", textDecoration: "none" }}>🚀 <span>R0cketShip network</span></a>
      <nav style={{ display: "grid", gap: 3 }}>
        {ITEMS.map(([key, icon, label, href]) => {
          const on = key === active;
          return (
            <a key={key} href={href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 600, color: on ? "#fff" : "#9fb3cc", background: on ? "rgba(255,91,46,.16)" : "transparent", borderLeft: on ? "3px solid #ff5b2e" : "3px solid transparent" }}>
              <span style={{ width: 18, textAlign: "center" }}>{icon}</span>{label}
            </a>
          );
        })}
      </nav>
      <div style={{ position: "absolute", bottom: 14, left: 12, right: 12, fontSize: 11, color: "#6b7c93" }}>
        <div style={{ padding: "0 4px 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>God{email ? ` · ${email}` : ""}</div>
        <LogoutLink />
      </div>
    </aside>
  );
}
