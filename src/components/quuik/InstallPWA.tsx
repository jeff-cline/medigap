"use client";
import { useEffect, useState } from "react";

// One-tap "Add to Home Screen" / "Add to Desktop". Uses the native install prompt where the browser
// supports it (Android/Chrome/Edge/desktop), and falls back to clear per-platform instructions on
// iOS Safari and anywhere the prompt isn't offered. Registers the service worker so quuik installs.
type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const ORANGE = "#F5821F";

export default function InstallPWA({ variant = "chip" }: { variant?: "chip" | "button" }) {
  const [deferred, setDeferred] = useState<BIP | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone) { setInstalled(true); return; }
    const ua = navigator.userAgent || "";
    if (/iphone|ipad|ipod/i.test(ua)) setPlatform("ios");
    else if (/android/i.test(ua)) setPlatform("android");
    else setPlatform("desktop");
    const onBIP = (e: Event) => { e.preventDefault(); setDeferred(e as BIP); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onBIP); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (installed) return null;

  const mobile = platform === "ios" || platform === "android";
  const label = mobile ? "Add to Home Screen" : "Add to Desktop";

  async function click() {
    if (deferred) { await deferred.prompt(); try { await deferred.userChoice; } catch {} setDeferred(null); return; }
    setSheet(true); // no native prompt available → show instructions
  }

  const steps =
    platform === "ios"
      ? ["Tap the Share button ⬆️ at the bottom of Safari.", "Scroll down and tap “Add to Home Screen”.", "Tap “Add” — Quuik lands on your home screen."]
      : platform === "android"
      ? ["Tap the ⋮ menu in Chrome (top-right).", "Tap “Add to Home screen” / “Install app”.", "Confirm — Quuik installs like an app."]
      : ["Click the install icon ⊕ in your browser’s address bar.", "Or open the ⋮ menu → “Install Quuik…”.", "Confirm — Quuik opens in its own window."];

  const chip: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", border: `1.5px solid ${ORANGE}`,
    background: variant === "button" ? ORANGE : "#fff", color: variant === "button" ? "#fff" : ORANGE,
    borderRadius: 100, padding: variant === "button" ? "11px 20px" : "7px 14px",
    fontSize: variant === "button" ? 15.5 : 13, fontWeight: 800, textDecoration: "none",
  };

  return (
    <>
      <button onClick={click} style={chip} aria-label={label}>
        <span aria-hidden>{mobile ? "📲" : "🖥️"}</span>{label}
      </button>

      {sheet && (
        <div onClick={() => setSheet(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: 460, borderRadius: "20px 20px 0 0", padding: "22px 22px 30px", boxShadow: "0 -20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ width: 40, height: 4, background: "#ddd", borderRadius: 4, margin: "0 auto 16px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <img src="/quuik-assets/icon-192.png" alt="Quuik" style={{ width: 46, height: 46, borderRadius: 11 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#000" }}>Add Quuik to your {mobile ? "home screen" : "desktop"}</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>One tap to your Trusted GPT, anytime.</div>
              </div>
            </div>
            <ol style={{ margin: 0, paddingLeft: 20, color: "#1c2128", fontSize: 15, lineHeight: 1.7 }}>
              {steps.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}
            </ol>
            <button onClick={() => setSheet(false)} style={{ marginTop: 18, width: "100%", background: ORANGE, color: "#fff", border: 0, borderRadius: 100, padding: "13px 0", fontSize: 15.5, fontWeight: 800, cursor: "pointer" }}>Got it</button>
          </div>
        </div>
      )}
    </>
  );
}
