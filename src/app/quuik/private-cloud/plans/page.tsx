import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SiteFooter from "@/components/quuik/SiteFooter";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Private Cloud plan · Quuik", robots: { index: false, follow: false } };

const ORANGE = "#F5821F";
const INK = "#0e1524";
const MUT = "#5b6472";
const LINE = "#e9ecf1";

export default async function Plans() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.mustChangePassword) redirect("/change-password");

  const wrap: React.CSSProperties = { maxWidth: 1000, margin: "0 auto", padding: "0 22px" };
  const card: React.CSSProperties = { border: `1px solid ${LINE}`, borderRadius: 18, padding: "24px 22px", background: "#fff", display: "flex", flexDirection: "column" };

  return (
    <main style={{ fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", color: INK, background: "#fff", minHeight: "100vh" }}>
      <header style={{ borderBottom: `1px solid ${LINE}` }}>
        <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between", height: 66 }}>
          <a href="/private-cloud" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/quuik-assets/favicon.png" alt="Quuik" style={{ height: 30, borderRadius: 7 }} />
            <span style={{ fontWeight: 800, fontSize: 18, color: INK }}>Quuik <span style={{ color: MUT, fontWeight: 600 }}>· Private Cloud</span></span>
          </a>
          <span style={{ color: MUT, fontSize: 13.5 }}>{s.email}</span>
        </div>
      </header>

      <section style={{ padding: "54px 0 20px" }}>
        <div style={{ ...wrap, textAlign: "center", maxWidth: 720 }}>
          <div style={{ color: ORANGE, fontWeight: 800, letterSpacing: ".12em", fontSize: 12.5, textTransform: "uppercase" }}>Welcome aboard</div>
          <h1 style={{ fontSize: "clamp(28px,4vw,40px)", margin: "12px 0 0", fontWeight: 800 }}>Choose your Private Cloud plan</h1>
          <p style={{ color: MUT, fontSize: 16, marginTop: 10 }}>You can start free and upgrade any time. A rising tide lifts all boats.</p>
        </div>
      </section>

      <section style={{ padding: "10px 0 70px" }}>
        <div style={{ ...wrap, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
          {/* 1 · Free */}
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 800, color: ORANGE, textTransform: "uppercase", letterSpacing: ".06em" }}>Get started</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>Free Service</div>
            <div style={{ fontSize: 26, fontWeight: 850, margin: "6px 0 12px" }}>$0</div>
            <p style={{ color: MUT, fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>Private Cloud performance, security and tracking — plus membership in the network.</p>
            <form method="post" action="/api/quuik/private-cloud/plan" style={{ marginTop: "auto", paddingTop: 18 }}>
              <input type="hidden" name="plan" value="free" />
              <button type="submit" style={{ width: "100%", background: ORANGE, color: "#fff", fontWeight: 800, border: 0, borderRadius: 100, padding: "12px 0", fontSize: 14.5, cursor: "pointer" }}>Activate free service →</button>
            </form>
          </div>

          {/* 2 · Advertising */}
          <div style={{ ...card, border: `2px solid ${ORANGE}`, boxShadow: "0 12px 34px rgba(245,130,31,.14)" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: ORANGE, textTransform: "uppercase", letterSpacing: ".06em" }}>Grow demand</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>Quuik Advertising</div>
            <div style={{ fontSize: 26, fontWeight: 850, margin: "6px 0 12px" }}>Fund as you go</div>
            <p style={{ color: MUT, fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>Become part of the Quuik ad platform and fund it right from your account — predictive, keyword-matched reach across the network.</p>
            <a href="/account" style={{ marginTop: "auto", paddingTop: 18, textDecoration: "none" }}>
              <span style={{ display: "block", width: "100%", boxSizing: "border-box", background: ORANGE, color: "#fff", fontWeight: 800, borderRadius: 100, padding: "12px 0", fontSize: 14.5, textAlign: "center" }}>Go to my ad account →</span>
            </a>
          </div>

          {/* 3 · Fast Start */}
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 800, color: ORANGE, textTransform: "uppercase", letterSpacing: ".06em" }}>Full program</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>Fast Start</div>
            <div style={{ fontSize: 26, fontWeight: 850, margin: "6px 0 4px" }}>$32,500 <span style={{ fontSize: 15, color: MUT }}>/ mo</span></div>
            <div style={{ color: MUT, fontSize: 13.5, marginBottom: 10 }}>plus backend</div>
            <p style={{ color: MUT, fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>White-glove build-and-scale with the full R0cketShip stack and a dedicated partnership.</p>
            <a href="mailto:jeff.cline@me.com?subject=Private%20Cloud%20Fast%20Start" style={{ marginTop: "auto", paddingTop: 18, textDecoration: "none" }}>
              <span style={{ display: "block", width: "100%", boxSizing: "border-box", background: "#fff", color: INK, border: `1px solid ${LINE}`, fontWeight: 800, borderRadius: 100, padding: "12px 0", fontSize: 14.5, textAlign: "center" }}>Call for more →</span>
            </a>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
