import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Social share image for 1800medigap.biz — "1-800-MEDIGAP Disruption Ahead!"
export async function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", background: "linear-gradient(135deg,#0a0e1a 0%,#111a2e 60%,#1a1206 100%)", color: "#eef2f9", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#e3b23c", textTransform: "uppercase" }}>Investor · JV · Sponsor · Advertiser</div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 900, marginTop: 24 }}>
          1-800-<span style={{ color: "#e3b23c" }}>MEDIGAP</span>
        </div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 900, color: "#ff6a2a", marginTop: 6 }}>Disruption Ahead!</div>
        <div style={{ display: "flex", fontSize: 30, color: "#98a4bb", marginTop: 34, maxWidth: 900 }}>
          The priceless Medicare vanity brand + lead engine + predictive acquisition + AI autonomous workforce.
        </div>
        <div style={{ display: "flex", marginTop: 40, height: 10, width: 260, background: "linear-gradient(90deg,#ffb020,#ff5a1f)", borderRadius: 6 }} />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
