"use client";
// 30px light-orange notice bar shown on every Quuik / Private Cloud page (rendered by SiteFooter).
// Use of the site is consent; the visitor can read the network terms (NTOS), change their email
// preference, or close it. Every interaction is beaconed to /api/net/track — timestamped with the
// visitor's first-party id + IP by the server — so it lands in the network visitor data.
import { useEffect, useState } from "react";
import { pcBeacon as beacon } from "@/components/pcbeacon";

const ORANGE = "#F5821F";
const BG = "#fdefe0";        // light orange, matches the CSS theme
const LINE = "#f4cfa6";
const INK = "#4a3a2c";
const COOKIE = "pc_consent";
const hasCookie = () => typeof document !== "undefined" && document.cookie.split("; ").some((c) => c.startsWith(COOKIE + "="));
const setCookie = () => { try { document.cookie = `${COOKIE}=1; path=/; max-age=${180 * 864e2}; samesite=lax`; } catch {} };

export default function ConsentBar() {
  const [show, setShow] = useState(false);
  const [panel, setPanel] = useState(false);
  const [email, setEmail] = useState(true);

  useEffect(() => {
    beacon("pageview");          // log every visit (site + path + first-party id) so God can see traffic
    if (hasCookie()) return;
    setShow(true);
    beacon("pcbar_view");
  }, []);

  if (!show) return null;

  const ack = (kind: string) => { beacon(kind); setCookie(); setShow(false); };
  const save = () => { beacon(email ? "pcbar_email_on" : "pcbar_email_off"); setCookie(); setShow(false); };

  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 2147483000, fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif" }}>
      {panel && (
        <div style={{ background: "#fff", borderTop: `1px solid ${LINE}`, padding: "12px 16px", fontSize: 13, color: INK, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, boxShadow: "0 -8px 24px rgba(0,0,0,.08)" }}>
          <b style={{ fontSize: 13 }}>Your preferences</b>
          <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
            <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />
            Receive consolidated email through <b>siimpler.com</b>
          </label>
          <span style={{ color: "#8a7a6a", fontSize: 12 }}>Use of this site is acknowledgment. You can change these settings any time.</span>
          <button onClick={save} style={{ marginLeft: "auto", background: ORANGE, color: "#fff", border: 0, borderRadius: 100, padding: "7px 16px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>Save &amp; close</button>
        </div>
      )}
      <div style={{ minHeight: 30, background: BG, borderTop: `1px solid ${LINE}`, display: "flex", alignItems: "center", gap: 10, padding: "4px 12px", fontSize: 11.5, color: INK, lineHeight: 1.3 }}>
        <img src="/quuik-assets/favicon.png" alt="" width={16} height={16} style={{ borderRadius: 4, flex: "0 0 auto" }} />
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          Powered by <b>Quuik Private Cloud</b> — we collect basic site activity to create savings &amp; efficiencies across our network of businesses, and you may receive consolidated email through siimpler.com. Continuing to use this site is your consent.
        </span>
        <a href="/private-cloud/terms" target="_blank" rel="noopener" onClick={() => beacon("pcbar_ntos")} title="Network Terms of Service" style={{ flex: "0 0 auto", color: ORANGE, fontWeight: 800, textDecoration: "none", letterSpacing: ".04em" }}>NTOS</a>
        <button onClick={() => { setPanel((p) => !p); beacon("pcbar_settings"); }} style={{ flex: "0 0 auto", background: "#fff", color: INK, border: `1px solid ${LINE}`, borderRadius: 100, padding: "4px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Change settings</button>
        <button onClick={() => ack("pcbar_ack")} aria-label="Close" title="Acknowledge &amp; close" style={{ flex: "0 0 auto", background: "transparent", color: "#b3261e", border: 0, fontSize: 16, fontWeight: 800, lineHeight: 1, cursor: "pointer", padding: "0 4px" }}>✕</button>
      </div>
    </div>
  );
}
