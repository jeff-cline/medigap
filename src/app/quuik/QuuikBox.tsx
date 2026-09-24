"use client";
import { useEffect, useState } from "react";
import InstallPWA from "@/components/quuik/InstallPWA";
import AnswerBody from "@/components/quuik/AnswerBody";

const ORANGE = "#F5821F", INK = "#1c2128", MUT = "#6b7280";
type Ad = { keyword: string; title: string; desc: string; image: string | null; url: string };
type Cite = { keyword: string; title: string; url: string; favicon: string };
type Res = { answer?: string; error?: string; ad?: Ad | null; citations?: Cite[] };

export default function QuuikBox() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Res | null>(null);

  // Attach the network visitor ID beacon on load (first-party tracking for quuik.com).
  useEffect(() => {
    try {
      const body = JSON.stringify({ site: "quuik.com", path: location.pathname, kind: "pageview" });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/net/track", new Blob([body], { type: "application/json" }));
      else fetch("/api/net/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    } catch {}
  }, []);

  // Share-target / deep link: quuik.com/?q=... auto-runs the search (used by the installed app).
  useEffect(() => {
    const qp = new URLSearchParams(window.location.search).get("q");
    if (!qp || !qp.trim()) return;
    setQ(qp);
    (async () => {
      setLoading(true); setRes(null);
      try { const r = await fetch("/api/quuik/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: qp.trim() }) }); setRes(await r.json()); }
      catch { setRes({ error: "Network error — try again." }); }
      setLoading(false);
    })();
  }, []);

  async function ask(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const query = q.trim();
    if (!query || loading) return;
    setLoading(true); setRes(null);
    try {
      const r = await fetch("/api/quuik/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: query }) });
      setRes(await r.json());
    } catch { setRes({ error: "Network error — try again." }); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", color: INK, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px" }}>
        <div style={{ width: "100%", maxWidth: 680, display: "flex", justifyContent: "flex-end", paddingTop: 14 }}><InstallPWA /></div>
      <div style={{ width: "100%", maxWidth: 680, marginTop: res || loading ? 36 : "16vh", transition: "margin-top .3s" }}>
        <div style={{ textAlign: "center" }}>
          <img src="/quuik-assets/logo.png" alt="Quuik — Trusted GPT" style={{ height: res || loading ? 88 : 150, width: "auto", margin: "0 auto", transition: "height .3s" }} />
        </div>
        <form onSubmit={ask} style={{ marginTop: 22, display: "flex", gap: 8, alignItems: "center", background: "#fff", border: `2px solid ${ORANGE}`, borderRadius: 100, padding: "5px 5px 5px 22px", boxShadow: "0 12px 34px -14px rgba(245,130,31,.45)" }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask Quuik anything…" autoFocus style={{ flex: 1, border: 0, outline: "none", fontSize: 18, background: "transparent", color: INK }} />
          <button type="submit" aria-label="Go" disabled={loading} style={{ border: 0, background: "transparent", cursor: loading ? "default" : "pointer", padding: 0, display: "grid", placeItems: "center", lineHeight: 0 }}>
            <img src="/quuik-assets/favicon.png" alt="Go" style={{ height: 54, width: 54, opacity: loading ? 0.5 : 1, transition: ".15s" }} />
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 10, color: MUT, fontSize: 12.5, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 700 }}>Trusted GPT</div>
        {!res && !loading && (
          <div style={{ textAlign: "center", marginTop: 18, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
            <h1 style={{ fontSize: 15, fontWeight: 800, color: INK, margin: 0 }}>Validated &amp; Trusted GPT Answer Engine</h1>
            <p style={{ fontSize: 13.5, color: MUT, lineHeight: 1.55, marginTop: 6 }}>Quuik Answers is a trusted, validated answer engine that saves time and money — sitting on top of a proprietary network of businesses working together to leverage technology for good. AI that saves time &amp; money across the ecosystem while safeguarding our families and businesses.</p>
          </div>
        )}

        {loading && <div style={{ textAlign: "center", marginTop: 44, color: ORANGE, fontWeight: 600 }}>Thinking…</div>}

        {res && (
          <div style={{ marginTop: 28 }}>
            {res.error && <div style={{ background: "#fdecea", color: "#b3261e", padding: "14px 16px", borderRadius: 12 }}>{res.error}</div>}
            {res.answer && <AnswerBody answer={res.answer} citations={res.citations || []} />}
            {res.ad && (
              <a href={res.ad.url} target="_blank" rel="noopener sponsored" style={{ display: "block", textDecoration: "none", color: INK, marginTop: 16, border: `1px solid ${ORANGE}44`, borderRadius: 16, overflow: "hidden", background: "#fff" }}>
                <div style={{ background: `${ORANGE}14`, padding: "6px 16px", fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: ORANGE }}>Have you met?</div>
                <div style={{ display: "flex", gap: 14, padding: 16, alignItems: "center" }}>
                  {res.ad.image ? <img src={res.ad.image} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", flex: "0 0 64px" }} /> : null}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{res.ad.title}</div>
                    <div style={{ color: MUT, fontSize: 14, marginTop: 2 }}>{res.ad.desc}</div>
                  </div>
                  <span style={{ background: ORANGE, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 100, whiteSpace: "nowrap" }}>Visit →</span>
                </div>
              </a>
            )}
          </div>
        )}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: "24px 0", fontSize: 12, color: "#9ca3af", textAlign: "center" }}><a href="/join" style={{ color: "#F5821F", fontWeight: 700, textDecoration: "none" }}>Join the Network →</a><span style={{ margin: "0 8px" }}>·</span>Quuik · Trusted <a href="/GPT-FINDER" style={{ color: "#F5821F", fontWeight: 700, textDecoration: "none" }}>GPT</a> · part of the R0cketShip network 🚀<div style={{ marginTop: 8, fontSize: 11, color: "#c0c4cc" }}><a href="/GPT-FINDER" style={{ color: "#9ca3af" }}>Answers</a> · <a href="/sitemap.xml" style={{ color: "#9ca3af" }}>XML Sitemap</a> · <a href="/llms.txt" style={{ color: "#9ca3af" }}>llms.txt</a> · <a href="/login" style={{ color: "#9ca3af" }}>Advertiser sign-in</a></div></div>
    </div>
  );
}
