import { redirect } from "next/navigation";
import { getSession, isGod } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import InvestorGate from "./InvestorGate";
import InvestorDeck from "./InvestorDeck";

// Notify God the first time an investor opens the data room (once per account).
async function notifyFirstView(uid: string, email: string) {
  const row = await db.setting.findUnique({ where: { key: "investor:profiles" } }).catch(() => null);
  if (!row?.value) return;
  let map: Record<string, Record<string, unknown>>;
  try { map = JSON.parse(row.value); } catch { return; }
  const p = map[uid];
  if (!p || p.viewedAt) return;
  p.viewedAt = new Date().toISOString();
  await db.setting.update({ where: { key: "investor:profiles" }, data: { value: JSON.stringify(map) } }).catch(() => {});
  const name = `${p.first || ""} ${p.last || ""}`.trim() || email;
  sendEmail("jeff.cline@me.com", `📄 ${name} opened the investor data room`,
    `<div style="font-family:Georgia,serif;font-size:15px;color:#111"><p><b>${name}</b> (${email}) just opened the R0cketShip Holdings investor data room and is viewing the documents.</p></div>`, "zapmail").catch(() => {});
}

export const dynamic = "force-dynamic";
export const metadata = {
  metadataBase: new URL("https://quuik.com"),
  title: "Investor Access · R0cketShip Holdings",
  description: "Accredited investors only · Investing in an ecosystem for good.",
  robots: { index: false, follow: false },
  icons: { icon: "/quuik-assets/favicon.png" },
  openGraph: {
    title: "Investor Access · R0cketShip Holdings",
    description: "Accredited investors only · Investing in an ecosystem for good.",
    url: "https://quuik.com/investor",
    siteName: "Quuik",
    images: [{ url: "/quuik-assets/og-investor.png", width: 1200, height: 630, alt: "Investor Access · quuik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Investor Access · R0cketShip Holdings",
    description: "Accredited investors only · Investing in an ecosystem for good.",
    images: ["/quuik-assets/og-investor.png"],
  },
};

const INK = "#111", MUT = "#555", LINE = "#d9d9d9", GOLD = "#8a6d1f";
const serif = "Georgia, 'Times New Roman', serif";

export default async function InvestorPage() {
  const s = await getSession();

  // Authenticated God or investor → the confidential memorandum (back office).
  if (s && (isGod(s) || s.role === "investor")) {
    if (s.mustChangePassword) redirect("/change-password?next=/investor");
    if (s.role === "investor") await notifyFirstView(s.uid, s.email).catch(() => {});
    return <InvestorDeck email={s.email} />;
  }

  // Everyone else → the formal access gate.
  return (
    <main style={{ fontFamily: serif, color: INK, background: "#fff", minHeight: "100vh" }}>
      <header style={{ borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/quuik-assets/favicon.png" alt="" style={{ height: 26, borderRadius: 5 }} />
            <span style={{ fontFamily: serif, fontWeight: 700, fontSize: 18 }}>R0cketShip Holdings</span>
          </div>
          <span style={{ fontFamily: "Arial,sans-serif", fontSize: 10.5, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: MUT }}>Confidential</span>
        </div>
      </header>

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px 30px", textAlign: "center" }}>
        <div style={{ fontFamily: "Arial,sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: GOLD }}>Investor Data Room</div>
        <h1 style={{ fontFamily: serif, fontSize: "clamp(30px,5vw,44px)", fontWeight: 700, lineHeight: 1.08, margin: "16px auto 0", maxWidth: 640 }}>A cross-industry holding company, built as one roll-up.</h1>
        <p style={{ fontSize: 16.5, lineHeight: 1.6, color: MUT, maxWidth: 560, margin: "18px auto 0" }}>
          Confidential seed materials for accredited investors. Sign in to the data room, or request access below.
        </p>
      </section>

      <section style={{ maxWidth: 620, margin: "0 auto", padding: "10px 24px 40px" }}>
        <div style={{ border: `1px solid ${LINE}`, padding: "34px 30px" }}>
          <InvestorGate />
        </div>
        <p style={{ fontFamily: "Arial,sans-serif", fontSize: 11.5, color: MUT, textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
          This is not an offer to sell securities. Any offering is made only to accredited investors under Regulation D pursuant to definitive documents. All materials are confidential.
        </p>
      </section>
    </main>
  );
}
