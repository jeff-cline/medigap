// quuik.com/join — "A rising tide lifts all boats." Founding-member / advertiser funnel.
import { db } from "@/lib/db";
import JoinForm from "./JoinForm";
import InstallPWA from "@/components/quuik/InstallPWA";
import SiteFooter from "@/components/quuik/SiteFooter";

export const dynamic = "force-dynamic";
export const viewport = { themeColor: "#F5821F" };
export const metadata = {
  title: "Join the Network · A rising tide lifts all boats — Quuik",
  description: "Take control of your marketing. Join a proprietary network of businesses saving time, energy, effort and money.",
  manifest: "/quuik-assets/manifest.webmanifest",
  icons: { icon: "/quuik-assets/favicon.png", apple: "/quuik-assets/apple-180.png" },
  appleWebApp: { capable: true, title: "Quuik", statusBarStyle: "default" as const },
  openGraph: { type: "website", url: "https://quuik.com/join", siteName: "Quuik", title: "Join the Network — A rising tide lifts all boats", description: "Take control of your marketing. Join a proprietary network of businesses saving time, energy, effort and money.", images: [{ url: "https://quuik.com/api/quuik/og?t=Join%20the%20Network%20%E2%80%94%20A%20rising%20tide%20lifts%20all%20boats", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: "Join the Network — A rising tide lifts all boats", images: ["https://quuik.com/api/quuik/og?t=Join%20the%20Network%20%E2%80%94%20A%20rising%20tide%20lifts%20all%20boats"] },
};

const ORANGE = "#F5821F", INK = "#1c2128", MUT = "#6b7280";

async function spotsLeft(): Promise<number> {
  try { const row = await db.setting.findUnique({ where: { key: "founding:spotsLeft" } }); const n = row?.value ? parseInt(row.value, 10) : 32; return Number.isFinite(n) ? n : 32; } catch { return 32; }
}

export default async function JoinPage() {
  const spots = await spotsLeft();
  return (
    <div style={{ background: "#fff", color: INK, fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", minHeight: "100vh" }}>
      {/* HERO */}
      <section style={{ background: "linear-gradient(165deg,#1c2128 0%,#2b2018 60%,#3a2412 100%)", color: "#fff", padding: "62px 20px 70px", textAlign: "center" }}>
        <a href="/" style={{ display: "inline-block", marginBottom: 22 }}><img src="/quuik-assets/logo.png" alt="Quuik" style={{ height: 54 }} /></a>
        <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: ORANGE }}>#ARTLAB</div>
        <h1 style={{ fontSize: "clamp(34px,6vw,58px)", fontWeight: 900, margin: "10px auto 0", maxWidth: 900, lineHeight: 1.05 }}>A rising tide lifts all boats.</h1>
        <p style={{ fontSize: "clamp(16px,2.2vw,20px)", color: "#d7dce2", maxWidth: 720, margin: "20px auto 0", lineHeight: 1.6 }}>
          Quuik.com is part of a movement to help business owners take control while providing savings to consumers. As a founder you enjoy the benefits of a proprietary network of businesses working together to save time, energy, effort, and money — and minimize operational strain.
        </p>
        <p style={{ fontSize: 14.5, color: "#a7b0bb", maxWidth: 680, margin: "16px auto 0" }}>
          Powered by <b style={{ color: "#fff" }}>R0cketShip.com</b> and <b style={{ color: "#fff" }}>predictivedata.org</b>, you'll receive results from best-in-class AI, machine-learning predictive data.
        </p>
        <div style={{ marginTop: 26, display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(245,130,31,.14)", border: "1px solid rgba(245,130,31,.4)", borderRadius: 100, padding: "9px 18px", color: "#ffce9e", fontWeight: 700, fontSize: 14 }}>
          🚀 {spots} founding-member spots left · lifetime flat rate
        </div>
        <div style={{ marginTop: 20 }}><InstallPWA variant="button" /></div>
      </section>

      {/* THESIS */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 10px", textAlign: "center" }}>
        <div style={{ fontSize: "clamp(22px,3.4vw,30px)", fontWeight: 800, lineHeight: 1.3 }}>
          Our founding thesis: <span style={{ color: ORANGE }}>“every industry is a geek away from being Uberized.”</span>
        </div>
        <div style={{ marginTop: 16, color: MUT, fontSize: 15.5, lineHeight: 1.7 }}>
          Collectively working together, we can all reduce our costs, reduce our operational strain, and provide higher-quality services and support for our clients.
        </div>
        <div style={{ marginTop: 18, fontWeight: 800, fontSize: 16 }}>Jeff Cline</div>
        <div style={{ color: MUT, fontSize: 13.5, letterSpacing: ".04em" }}>Founder — VRTCLS FUND</div>
      </section>

      {/* FUNNEL */}
      <section style={{ padding: "34px 0 70px" }}>
        <JoinForm spotsLeft={spots} />
      </section>

      <SiteFooter />
    </div>
  );
}
