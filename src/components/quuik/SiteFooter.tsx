// Home-style footer reused across every Quuik page, with a scrolling "People also visit:" strip of
// money words linking to their category silos (randomized) — lateral internal links for SEO/AEO.
// Also renders the Private Cloud consent bar so it appears on every page that uses this footer.
import { readCategories } from "@/lib/gptfinder";
import ConsentBar from "@/components/quuik/ConsentBar";
const ORANGE = "#F5821F";

export default function SiteFooter({ variant = "full" }: { variant?: "full" | "stripOnly" }) {
  const cats = readCategories();
  const shuffled = [...cats].sort(() => Math.random() - 0.5);
  const loop = shuffled.length ? [...shuffled, ...shuffled] : [];
  return (
    <footer style={{ borderTop: "1px solid #eee", marginTop: variant === "stripOnly" ? 0 : 44 }}>
      {loop.length > 0 && (
        <div style={{ background: "#fafafa", borderBottom: variant === "stripOnly" ? "none" : "1px solid #f2f2f2", padding: "11px 0", display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          <span style={{ flex: "0 0 auto", paddingLeft: 16, fontSize: 11.5, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em" }}>People also visit:</span>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <style>{`@keyframes qpav{from{transform:translateX(0)}to{transform:translateX(-50%)}}.qpav{display:inline-flex;gap:26px;white-space:nowrap;animation:qpav 48s linear infinite;will-change:transform}.qpav:hover{animation-play-state:paused}`}</style>
            <div className="qpav">
              {loop.map((c, i) => <a key={i} href={`/${c.cat}`} style={{ color: ORANGE, textDecoration: "none", fontSize: 13.5, fontWeight: 600 }}>{c.title}</a>)}
            </div>
          </div>
        </div>
      )}
      {variant === "full" && (
        <div style={{ padding: "18px 20px", textAlign: "center", fontSize: 12.5, color: "#9ca3af" }}>
          <a href="/join" style={{ color: ORANGE, fontWeight: 700, textDecoration: "none" }}>Join the Network →</a> · Quuik · <a href="https://quuik.com/private-cloud" style={{ color: ORANGE, fontWeight: 700, textDecoration: "none" }}>☁️ PRIVATE CLOUD</a> · Trusted <a href="/GPT-FINDER" style={{ color: ORANGE, fontWeight: 700, textDecoration: "none" }}>GPT</a> · part of the R0cketShip network 🚀
          <div style={{ marginTop: 8, fontSize: 11, color: "#c0c4cc" }}>
            <a href="/GPT-FINDER" style={{ color: "#9ca3af" }}>Answers</a> · <a href="/sitemap.xml" style={{ color: "#9ca3af" }}>XML Sitemap</a> · <a href="/llms.txt" style={{ color: "#9ca3af" }}>llms.txt</a> · <a href="/login" style={{ color: "#9ca3af" }}>Advertiser sign-in</a>
          </div>
        </div>
      )}
      <ConsentBar />
    </footer>
  );
}
