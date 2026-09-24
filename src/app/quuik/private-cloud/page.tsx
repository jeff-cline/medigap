import type { Metadata } from "next";
import JoinForm from "./JoinForm";
import SiteFooter from "@/components/quuik/SiteFooter";

export const metadata: Metadata = {
  title: "Private Cloud · Quuik",
  description:
    "Private Cloud — internet infrastructure and performance services for businesses in a modern age. Collaborative technology that increases profitability by reducing cost, operational strain, and risk.",
  icons: { icon: "/quuik-assets/favicon.png", apple: "/quuik-assets/apple-180.png" },
  openGraph: {
    title: "Private Cloud · Quuik",
    description: "Internet infrastructure & performance services for businesses in a modern age.",
    images: ["/quuik-assets/apple-180.png"],
  },
};

const ORANGE = "#F5821F";
const INK = "#0e1524";
const MUT = "#5b6472";
const LINE = "#e9ecf1";

export default function PrivateCloud() {
  const wrap: React.CSSProperties = { maxWidth: 1060, margin: "0 auto", padding: "0 22px" };
  const eyebrow: React.CSSProperties = { color: ORANGE, fontWeight: 800, letterSpacing: ".14em", fontSize: 12.5, textTransform: "uppercase" };
  return (
    <main style={{ fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", color: INK, background: "#fff" }}>
      {/* header */}
      <header style={{ borderBottom: `1px solid ${LINE}` }}>
        <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between", height: 66 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/quuik-assets/favicon.png" alt="Quuik" style={{ height: 30, borderRadius: 7 }} />
            <span style={{ fontWeight: 800, fontSize: 18, color: INK }}>
              Quuik <span style={{ color: MUT, fontWeight: 600 }}>· Private Cloud</span>
            </span>
          </a>
          <a href="/login" style={{ textDecoration: "none", color: INK, fontWeight: 700, fontSize: 14.5 }}>Log in →</a>
        </div>
      </header>

      {/* hero */}
      <section style={{ padding: "78px 0 40px" }}>
        <div style={{ ...wrap, maxWidth: 820, textAlign: "center" }}>
          <div style={eyebrow}>For business owners · executives · investors</div>
          <h1 style={{ fontSize: "clamp(38px,6vw,66px)", lineHeight: 1.03, letterSpacing: "-.02em", margin: "16px 0 0", fontWeight: 800 }}>
            Private Cloud
          </h1>
          <p style={{ fontSize: "clamp(18px,2.3vw,23px)", color: INK, fontWeight: 600, margin: "18px 0 0", lineHeight: 1.4 }}>
            Providing internet infrastructure and performance services for businesses in a modern age.
          </p>
          <p style={{ fontSize: 17, color: MUT, lineHeight: 1.65, margin: "18px auto 0", maxWidth: 660 }}>
            Collaborative technology through our private cloud helps increase profitability by reducing overall
            costs and operational strain — leveraging the proprietary technology powering our private economy.
          </p>
          <div style={{ marginTop: 30 }}>
            <a href="#join" style={{ display: "inline-block", background: ORANGE, color: "#fff", fontWeight: 800, fontSize: 16, textDecoration: "none", padding: "15px 34px", borderRadius: 100, boxShadow: "0 8px 26px rgba(245,130,31,.35)" }}>
              Join — create your account
            </a>
          </div>
        </div>
      </section>

      {/* value props */}
      <section style={{ padding: "34px 0" }}>
        <div style={{ ...wrap, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18 }}>
          {[
            ["Lower your costs", "Consolidated, edge-delivered infrastructure removes overhead and waste."],
            ["Reduce operational strain", "One collaborative platform replaces a stack of moving parts."],
            ["Mitigate risk", "Security, performance, and resilience built into the network."],
            ["Leverage R0cketShip", "Proprietary technology and predictive data working for your business."],
          ].map(([h, d]) => (
            <div key={h} style={{ border: `1px solid ${LINE}`, borderRadius: 16, padding: "22px 20px" }}>
              <div style={{ fontWeight: 800, fontSize: 16.5 }}>{h}</div>
              <p style={{ color: MUT, fontSize: 14.5, lineHeight: 1.55, margin: "7px 0 0" }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* plans */}
      <section style={{ padding: "40px 0 10px" }}>
        <div style={wrap}>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <div style={eyebrow}>Choose your path</div>
            <h2 style={{ fontSize: "clamp(24px,3vw,34px)", letterSpacing: "-.01em", margin: "8px 0 0", fontWeight: 800 }}>Three ways to work with us</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
            <Plan title="Free Service" price="$0" tag="Get started" points={["Private Cloud performance & tracking", "Join the network", "Best-practice security"]} />
            <Plan featured title="Quuik Advertising" price="Fund as you go" tag="Grow demand" points={["Become part of the Quuik ad platform", "Fund it right from your account", "Predictive, keyword-matched reach"]} />
            <Plan title="Fast Start" price="$32,500 / mo" tag="+ backend · call for more" points={["White-glove build & scale program", "Full R0cketShip technology stack", "Dedicated partnership"]} contact />
          </div>
          <p style={{ textAlign: "center", color: MUT, fontSize: 13.5, marginTop: 16 }}>
            You choose your plan after you create your account and log in.
          </p>
        </div>
      </section>

      {/* join */}
      <section id="join" style={{ padding: "50px 0 70px" }}>
        <div style={{ ...wrap, maxWidth: 640 }}>
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div style={eyebrow}>Join Private Cloud</div>
            <h2 style={{ fontSize: "clamp(24px,3vw,32px)", margin: "8px 0 0", fontWeight: 800 }}>Create your account</h2>
            <p style={{ color: MUT, fontSize: 15, marginTop: 8 }}>Two quick steps. We'll email your login. Your email is your username.</p>
          </div>
          <JoinForm />
        </div>
      </section>

      <div style={{ ...wrap, display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", color: MUT, fontSize: 13, padding: "26px 22px 4px" }}>
        <span>© 2026 Quuik · Private Cloud</span>
        <a href="/private-cloud/terms" style={{ color: MUT }}>Terms of Use</a>
        <a href="/private-cloud/privacy" style={{ color: MUT }}>Privacy Policy</a>
      </div>
      <SiteFooter />
    </main>
  );
}

function Plan({ title, price, tag, points, featured, contact }: { title: string; price: string; tag: string; points: string[]; featured?: boolean; contact?: boolean }) {
  return (
    <div style={{ border: `2px solid ${featured ? ORANGE : LINE}`, borderRadius: 18, padding: "24px 22px", background: "#fff", boxShadow: featured ? "0 12px 34px rgba(245,130,31,.14)" : "none", position: "relative" }}>
      {featured && <div style={{ position: "absolute", top: -12, left: 22, background: ORANGE, color: "#fff", fontWeight: 800, fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 100 }}>Most popular</div>}
      <div style={{ fontSize: 12, fontWeight: 800, color: ORANGE, textTransform: "uppercase", letterSpacing: ".06em" }}>{tag}</div>
      <div style={{ fontSize: 21, fontWeight: 800, marginTop: 6 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 850, margin: "6px 0 12px" }}>{price}</div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {points.map((p) => (
          <li key={p} style={{ display: "flex", gap: 8, alignItems: "flex-start", color: MUT, fontSize: 14.5, lineHeight: 1.5, margin: "6px 0" }}>
            <span style={{ color: ORANGE, fontWeight: 800 }}>✓</span>{p}
          </li>
        ))}
      </ul>
      <a href={contact ? "#join" : "#join"} style={{ display: "block", textAlign: "center", marginTop: 16, background: featured ? ORANGE : "#fff", color: featured ? "#fff" : INK, border: `1px solid ${featured ? ORANGE : LINE}`, fontWeight: 800, textDecoration: "none", padding: "11px 0", borderRadius: 100, fontSize: 14.5 }}>
        {contact ? "Call for more →" : "Choose after signup →"}
      </a>
    </div>
  );
}
