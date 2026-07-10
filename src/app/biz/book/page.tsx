import type { Metadata } from "next";
import { BIZ } from "@/lib/biz";
import BizShell from "@/components/biz/BizShell";
import CalendlyEmbed from "@/components/biz/CalendlyEmbed";

export const dynamic = "force-dynamic";
const C = BIZ.colors;
const serif = "Georgia,'Times New Roman',serif";

export const metadata: Metadata = {
  title: "Book a Confidential Conversation | 1-800-MEDIGAP",
  description: "Thank you — your inquiry is in. Book a private, confidential conversation with the 1-800-MEDIGAP founder.",
  robots: { index: false },
  alternates: { canonical: `https://${BIZ.domain}/book` },
};

export default function BookPage() {
  return (
    <BizShell>
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(1000px 400px at 50% -10%, rgba(227,178,60,.16), transparent)` }} />
        <div style={{ position: "relative", maxWidth: 820, margin: "0 auto", padding: "56px 22px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 12.5, letterSpacing: ".16em", textTransform: "uppercase", color: C.gold }}>✓ Received — next step</div>
          <h1 style={{ fontFamily: serif, fontSize: "clamp(30px,5vw,48px)", lineHeight: 1.08, margin: "12px 0 0", fontWeight: 700 }}>
            Let's talk about the <span style={{ color: C.gold }}>disruption</span>.
          </h1>
          <p style={{ maxWidth: 620, margin: "16px auto 0", fontSize: 17, color: "#c7d0e0", lineHeight: 1.55 }}>
            Your inquiry routed directly to the founder. Pick a time below for a private, confidential conversation about how these assets fit your thesis.
          </p>
        </div>
      </section>
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "10px 22px 60px" }}>
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 18, padding: 12 }}>
          <CalendlyEmbed url={BIZ.calendly} />
        </div>
        <p style={{ textAlign: "center", marginTop: 16, color: C.muted, fontSize: 14 }}>
          Prefer to talk now? Call <a href={`tel:${BIZ.tel}`} style={{ color: C.goldSoft }}>1-800-MEDIGAP</a>.
        </p>
      </section>
    </BizShell>
  );
}
