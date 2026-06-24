import { ImageResponse } from "next/og";

// Social share card for the one-sheet: black, R0cketShip wordmark + AGETECH GROWTH FUND.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "R0cketShip AgeTech Growth Fund — Investment One-Sheet";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#05070d", color: "#e9eefb", fontFamily: "sans-serif", position: "relative" }}>
        {/* grid backdrop */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(56,225,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(56,225,255,.06) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        {/* glow */}
        <div style={{ position: "absolute", top: -160, left: 420, width: 520, height: 520, borderRadius: 520, background: "radial-gradient(circle, rgba(56,225,255,.22), transparent 65%)", display: "flex" }} />

        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 92, fontWeight: 800, letterSpacing: -2 }}>
          <span style={{ fontSize: 80 }}>🚀</span>
          <span style={{ display: "flex" }}>
            R<span style={{ color: "#ff7a18" }}>0</span>cketShip
          </span>
        </div>

        <div style={{ display: "flex", marginTop: 14, fontSize: 30, letterSpacing: 12, color: "#d8b46a", fontWeight: 700 }}>AGETECH GROWTH FUND</div>

        <div style={{ display: "flex", marginTop: 30, fontSize: 30, color: "#8595b4" }}>$100M → $9M EBITDA, compounding to $12M+</div>

        <div style={{ display: "flex", position: "absolute", bottom: 46, fontSize: 24, color: "#8595b4" }}>
          Jeff Cline · Founder &amp; CEO · R0cketShip.com
        </div>
      </div>
    ),
    { ...size },
  );
}
