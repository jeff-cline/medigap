import { BIZ, FOOTER_ROLES } from "@/lib/biz";

const C = BIZ.colors;

export default function BizShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: C.navy, color: C.ink, fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", minHeight: "100vh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(10,14,26,.82)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "12px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ fontWeight: 900, fontSize: 19, letterSpacing: ".01em", color: C.white, textDecoration: "none" }}>1-800-<span style={{ color: C.gold }}>MEDIGAP</span></a>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <a href={`tel:${BIZ.tel}`} style={{ color: C.muted, fontSize: 14, textDecoration: "none" }} className="hide-sm">Call 1-800-MEDIGAP</a>
            <a href="/#disrupt" style={{ fontWeight: 800, fontSize: 14, color: "#1a0b00", textDecoration: "none", padding: "9px 16px", borderRadius: 9, background: `linear-gradient(90deg, ${C.disrupt2}, ${C.disrupt})` }}>DISRUPT NOW</a>
          </div>
        </div>
      </header>

      {children}

      <footer style={{ background: C.panel2, borderTop: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 22px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between" }}>
            <div style={{ maxWidth: 340 }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>1-800-<span style={{ color: C.gold }}>MEDIGAP</span></div>
              <p style={{ color: C.muted, fontSize: 13.5, marginTop: 8 }}>A business-development power platform for investors, sponsors, carriers, and strategic partners in the Medicare & senior-marketing space.</p>
            </div>
            <div>
              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: C.gold, marginBottom: 10 }}>Who are you?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 26px" }}>
                {FOOTER_ROLES.map((r) => (
                  <a key={r.role} href={`/?role=${r.role}#disrupt`} style={{ color: C.ink, fontSize: 14, textDecoration: "none" }}>{r.label} →</a>
                ))}
              </div>
              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
                <a href="/summary" style={{ color: C.goldSoft, fontSize: 13.5, textDecoration: "none", fontWeight: 700 }}>Executive Summary →</a>
                <a href="/comps" style={{ color: C.goldSoft, fontSize: 13.5, textDecoration: "none", fontWeight: 700 }}>Comps →</a>
                <a href="/market-analysis" style={{ color: C.goldSoft, fontSize: 13.5, textDecoration: "none", fontWeight: 700 }}>Market Analysis →</a>
                <a href="/vanity" style={{ color: C.muted, fontSize: 13.5, textDecoration: "none" }}>Vanity thesis →</a>
                <a href="/login" style={{ color: C.muted, fontSize: 13, textDecoration: "none" }}>Owner login →</a>
              </div>
            </div>
          </div>
          <p style={{ marginTop: 28, paddingTop: 18, borderTop: `1px solid ${C.line}`, color: C.muted, fontSize: 11.5, lineHeight: 1.6 }}>{BIZ.disclaimer}</p>
          <p style={{ marginTop: 10, color: "#5c6a84", fontSize: 11.5 }}>© 2026 1-800-MEDIGAP. All rights reserved.</p>
        </div>
      </footer>
      <style>{`@media (max-width:640px){.hide-sm{display:none}}`}</style>
    </div>
  );
}
