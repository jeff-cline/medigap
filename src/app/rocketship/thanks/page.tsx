import type { Metadata } from "next";

export const metadata: Metadata = { title: "Thank you — R0cketShip", robots: { index: false } };
const OR = "#FF7A18";

export default function RocketshipThanks() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "-apple-system,Helvetica Neue,Arial,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <div style={{ fontSize: 64 }}>🚀</div>
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-.5px", marginTop: 8 }}>R0cket<span style={{ color: OR }}>Ship</span></div>
        <h1 style={{ fontSize: 34, fontWeight: 800, margin: "22px 0 10px" }}>Thank you!</h1>
        <p style={{ fontSize: 18, color: "#c9a98c" }}>Our team will be back with you shortly.</p>
      </div>
    </div>
  );
}
