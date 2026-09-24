import { redirect } from "next/navigation";
import { getSession, isGod } from "@/lib/auth";
import PlatformNav, { NAV_WIDTH } from "@/components/elag/PlatformNav";
import LiveMap from "@/components/elag/LiveMap";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live now · Quuik God", robots: { index: false, follow: false } };

const INK = "#0e1524", MUT = "#5b6472";

export default async function LivePage() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!isGod(s)) redirect("/account");
  return (
    <div style={{ fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", color: INK, background: "#f7f8fa", minHeight: "100vh", paddingLeft: NAV_WIDTH }}>
      <PlatformNav active="live" email={s.email} />
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 22px 30px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px" }}>🔴 Live now</h1>
        <p style={{ color: MUT, fontSize: 14.5, margin: "0 0 14px" }}>Where your traffic is coming from, in real time. <b style={{ color: "#12a150" }}>Green throbbing</b> = visitor active right now; <b style={{ color: "#2f7be6" }}>blue</b> = past visitor, dot grows with how many times they&rsquo;ve visited. Starts on the U.S. — scroll to zoom, drag to roam the globe.</p>
        <LiveMap />
      </section>
    </div>
  );
}
