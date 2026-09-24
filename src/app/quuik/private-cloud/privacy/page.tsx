import type { Metadata } from "next";
import { PRIVACY } from "../legal";
import SiteFooter from "@/components/quuik/SiteFooter";

export const metadata: Metadata = { title: "Privacy Policy · Private Cloud · Quuik", robots: { index: true, follow: true } };

const ORANGE = "#F5821F", INK = "#0e1524", MUT = "#5b6472", LINE = "#e9ecf1";

export default function Privacy() {
  return (
    <main style={{ fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", color: INK, background: "#fff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 22px 70px" }}>
        <a href="/private-cloud" style={{ color: MUT, textDecoration: "none", fontSize: 14 }}>← Private Cloud</a>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
          <h1 style={{ fontSize: 30, margin: 0, fontWeight: 800 }}>Privacy Policy</h1>
          <a href="/private-cloud/privacy.txt" style={{ background: ORANGE, color: "#fff", fontWeight: 800, textDecoration: "none", padding: "9px 18px", borderRadius: 100, fontSize: 14 }}>⬇ Download</a>
        </div>
        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 15, lineHeight: 1.7, color: "#26313f", background: "#fafbfc", border: `1px solid ${LINE}`, borderRadius: 14, padding: "22px 24px", marginTop: 18 }}>{PRIVACY}</pre>
      </div>
      <SiteFooter />
    </main>
  );
}
