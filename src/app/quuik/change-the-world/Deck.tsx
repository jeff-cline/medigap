"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Entry = { title: string; keyword: string; url: string; favicon: string };
type Net = { businesses: number; networkSites: number; signals: number; clicks: number; events: number; questions: number; entries: Entry[] };
const O = "#F5821F", INK = "#e7ecf3", MUT = "#8b97a8", BG = "#080b12", PANEL = "#0f1522";

const SIDE_SIGNALS = ["Facebook", "Google", "MSN", "Answer Engines", "ChatGPT", "Claude"];

const SLIDES: { eyebrow?: string; title: string; body: string; cta?: { label: string; href: string } }[] = [
  { eyebrow: "#ARTLAB", title: "A rising tide lifts all boats.",
    body: "Put a room full of smart people, focused in the same direction, all committed to changing the world — and you get a proprietary network of businesses working in alignment to make a positive impact on their businesses, their employees, their customers, and their communities. Equipping industries for drastic disruption, with the intention of positive change for good. Quuik.com is just one of dozens of businesses that power the core of what is to be the future of the global economy." },
  { eyebrow: "How it works", title: "One hub. Every business stronger.",
    body: "R0cketShip is the glue that holds it all together — everything revolves around it. Quuik and siimpler sit at the top of the funnel, pulling new people in. predictivedata.org is the data layer. medigap.ai is the GPT engine. Every time a business joins, the network gets stronger and the data gets more unique." },
  { eyebrow: "The moat", title: "A strategic advantage competitors can't cross.",
    body: "This power creates a real edge in cost-sharing, risk mitigation, and operational-strain reduction. If a business isn't part of a long-term strategy like this, they'll likely be acquired by one of our partner companies. It's going to be hard to compete — and be as profitable — as our partners, joint ventures, portfolio companies, and house companies." },
  { eyebrow: "R0cketShip Holdings", title: "High-intent traffic, engineered.",
    body: "R0cketShip Holdings delivers high-intent, targeted traffic to members, JVs, operating companies, and portfolio companies — leveraging a private proprietary network with billions of data points. Multiple entry points like Quuik and siimpler sit at the top of the funnel; through the side door we pull paid triggers and signals from the top tech stacks — Facebook, Google, MSN, answer engines, ChatGPT and Claude — to triangulate predictive models that maximize network profit: lower cost of acquisition, less operational strain, lower technology fees, and no time wasted on leads that won't buy." },
  { eyebrow: "Signals no one else has", title: "Software + hardware + unique data.",
    body: "We leverage outside hardware to add unique signals — a level of accuracy unique to our proprietary network. Example: tracking beacons at cruise ports that tag high-net-worth, disposable-income travelers with passports, then follow them across our network. Free tools that surface signals no one else has, letting us go deeper and richer and make better choices. That's the new meaning of #ARTLAB." },
  { eyebrow: "Join the movement", title: "Every business joins, the network gets stronger.",
    body: "A rising tide lifts all boats. Join dozens of businesses building the future of the global economy — and grow stronger together.", cta: { label: "Join the Network →", href: "/join" } },
];

function useCountUp(target: number) {
  const [n, setN] = useState(target);
  const raf = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const start = performance.now(), from = n, diff = target - from;
    if (diff === 0) return;
    const tick = (t: number) => { const p = Math.min(1, (t - start) / 700); setN(Math.round(from + diff * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf.current = requestAnimationFrame(tick); };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]); // eslint-disable-line
  return n;
}

const NODES = [
  { key: "quuik", img: "/quuik-assets/favicon.png", label: "Quuik", sub: "Top of funnel", href: "https://quuik.com", pos: { left: "26%", top: "10%" }, line: [26, 10] },
  { key: "siimpler", img: "https://www.google.com/s2/favicons?domain=siimpler.com&sz=64", label: "siimpler", sub: "Top of funnel", href: "https://siimpler.com", pos: { left: "74%", top: "10%" }, line: [74, 10] },
  { key: "predictivedata", img: "https://www.google.com/s2/favicons?domain=predictivedata.org&sz=64", label: "predictivedata", sub: "Data layer", href: "https://predictivedata.org", pos: { left: "13%", top: "86%" }, line: [13, 86] },
  { key: "medigap", ai: true, label: "medigap.ai", sub: "GPT engine", href: "https://medigap.ai", pos: { left: "87%", top: "86%" }, line: [87, 86] },
] as const;

function Hub({ net, big, onPick }: { net: Net; big?: boolean; onPick: (n: string) => void }) {
  const favs = net.entries.slice(0, 22);
  const extra = net.entries.length - favs.length;
  const R = 40;
  const favPos = (i: number) => { const a = (i / Math.max(1, favs.length)) * 2 * Math.PI - Math.PI / 2; return { x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a) }; };
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: big ? 760 : 560, aspectRatio: "1 / 1", margin: "0 auto" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes spinr{from{transform:rotate(0)}to{transform:rotate(-360deg)}}
        @keyframes hpulse{0%,100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 0 0 0 rgba(245,130,31,.5)}50%{transform:translate(-50%,-50%) scale(1.06);box-shadow:0 0 48px 12px rgba(245,130,31,.35)}}
        @keyframes flow{to{stroke-dashoffset:-16}}
        @keyframes flowr{to{stroke-dashoffset:16}}
      `}</style>

      {/* dot flows: counter-rotating orbits + hub<->business spokes + node connectors (symmetric) */}
      <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}>
        <g>
          <circle cx="50" cy="50" r={R} fill="none" stroke={O} strokeWidth="0.5" strokeDasharray="0.8 4" opacity="0.8" />
          <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="26s" repeatCount="indefinite" />
        </g>
        <g>
          <circle cx="50" cy="50" r={R + 4} fill="none" stroke="#ffcda3" strokeWidth="0.4" strokeDasharray="0.7 6" opacity="0.5" />
          <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="36s" repeatCount="indefinite" />
        </g>
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="90s" repeatCount="indefinite" />
          {favs.map((_, i) => { const p = favPos(i); return <line key={i} x1="50" y1="50" x2={p.x} y2={p.y} stroke={O} strokeWidth="0.35" strokeDasharray="0.7 2.4" opacity="0.32" style={{ animation: `${i % 2 ? "flow" : "flowr"} 2s linear infinite` }} />; })}
        </g>
        {NODES.map((n, i) => <line key={n.key} x1="50" y1="50" x2={n.line[0]} y2={n.line[1]} stroke={O} strokeWidth="0.6" strokeDasharray="1.6 2.2" opacity="0.65" style={{ animation: `${i % 2 ? "flow" : "flowr"} 1.3s linear infinite` }} />)}
      </svg>

      {/* rotating business favicons */}
      <div style={{ position: "absolute", inset: 0, animation: "spin 90s linear infinite" }}>
        {favs.map((e, i) => { const p = favPos(i); return (
          <a key={e.keyword} href={e.url} target="_blank" rel="noopener" title={e.title}
             style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-50%)", width: 38, height: 38, borderRadius: 10, background: "#fff", border: "1px solid #2a3446", display: "grid", placeItems: "center", overflow: "hidden", animation: "spinr 90s linear infinite" }}>
            <img src={e.favicon} alt="" width={24} height={24} style={{ display: "block" }} />
          </a>
        ); })}
      </div>

      {/* center = R0cketShip */}
      <button onClick={() => onPick("rocketship")} title="R0cketShip.com" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: big ? 122 : 100, height: big ? 122 : 100, borderRadius: "50%", border: "none", cursor: "pointer", background: "radial-gradient(circle at 50% 35%, #ff9a4d, #F5821F 55%, #c9600f)", color: "#fff", fontSize: big ? 54 : 46, display: "grid", placeItems: "center", animation: "hpulse 3.4s ease-in-out infinite", zIndex: 4 }}>🚀</button>

      {/* clickable network-layer nodes (orange outline, favicon/AI logo, link out) */}
      {NODES.map((n) => (
        <a key={n.key} href={n.href} target="_blank" rel="noopener" title={n.label}
           style={{ position: "absolute", ...n.pos, transform: "translate(-50%,-50%)", display: "flex", alignItems: "center", gap: 9, background: "#0d1424", border: "2px solid #F5821F", color: INK, borderRadius: 14, padding: "10px 15px", textDecoration: "none", zIndex: 5, boxShadow: "0 0 22px rgba(245,130,31,.28)", whiteSpace: "nowrap" }}>
          {"ai" in n && n.ai
            ? <span style={{ flex: "0 0 auto", width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#8b5cf6,#3b82f6 55%,#06b6d4)", display: "grid", placeItems: "center", fontSize: 17, boxShadow: "0 0 12px rgba(124,58,237,.6)" }}>🧠</span>
            : <img src={(n as { img: string }).img} alt="" width={30} height={30} style={{ flex: "0 0 auto", borderRadius: 7, background: "#fff", padding: 2, boxSizing: "border-box" }} />}
          <span style={{ lineHeight: 1.15 }}>
            <span style={{ display: "block", fontSize: 14.5, fontWeight: 800 }}>{n.label}</span>
            <span style={{ display: "block", fontSize: 10.5, color: O, textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700 }}>{n.sub}</span>
          </span>
        </a>
      ))}

      {extra > 0 && <div style={{ position: "absolute", left: "50%", bottom: -8, transform: "translateX(-50%)", fontSize: 12, color: MUT }}>+{extra} more in the network</div>}
    </div>
  );
}

const NODE_INFO: Record<string, { t: string; d: string }> = {
  rocketship: { t: "🚀 R0cketShip.com — the glue", d: "The holding layer everything revolves around. It routes high-intent traffic to members, JVs, operating and portfolio companies, and ties every business into one compounding network." },
  quuik: { t: "Quuik.com & siimpler.com — top of funnel", d: "Consumer entry points that bring new people in every day, then hand warm, intent-rich audiences to the network." },
  predictivedata: { t: "predictivedata.org — the data layer", d: "Billions of data points and unique signals — triangulated into predictive models that lower acquisition cost and cut waste." },
  medigap: { t: "medigap.ai — the GPT engine", d: "The answer/AI engine that turns questions into conversions and enriches the network's proprietary data with every interaction." },
};

export default function Deck({ initial }: { initial: Net }) {
  const [net, setNet] = useState<Net>(initial);
  const [mode, setMode] = useState<"deck" | "summary" | "onesheet" | "infographic">("deck");
  const [i, setI] = useState(0);
  const [node, setNode] = useState<string | null>(null);
  const biz = useCountUp(net.businesses);
  const sig = useCountUp(net.signals);

  useEffect(() => {
    const load = () => fetch("/api/quuik/network", { cache: "no-store" }).then((r) => r.json()).then(setNet).catch(() => {});
    const id = setInterval(load, 15000); return () => clearInterval(id);
  }, []);
  const go = useCallback((d: number) => setI((p) => Math.max(0, Math.min(SLIDES.length - 1, p + d))), []);
  useEffect(() => {
    if (mode !== "deck") return;
    const k = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [mode, go]);

  const Stat = ({ n, l }: { n: number; l: string }) => (
    <div style={{ textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{n.toLocaleString()}</div><div style={{ fontSize: 10.5, color: MUT, textTransform: "uppercase", letterSpacing: ".06em" }}>{l}</div></div>
  );
  const modeBtn = (m: typeof mode, label: string) => (
    <button onClick={() => setMode(m)} style={{ background: mode === m ? O : "transparent", color: mode === m ? "#fff" : MUT, border: `1px solid ${mode === m ? O : "#26324a"}`, borderRadius: 100, padding: "6px 13px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>{label}</button>
  );

  return (
    <div style={{ height: "100dvh", minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: `radial-gradient(1200px 600px at 50% -10%, #14203a, ${BG})`, color: INK, fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif" }}>
      {/* header */}
      <header style={{ flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 14px", borderBottom: "1px solid #1a2436" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: INK, flex: "0 0 auto" }}><img src="/quuik-assets/logo.png" alt="Quuik" style={{ height: 26 }} /><b className="ctw-h-title" style={{ fontSize: 14 }}>Change the World</b></a>
        <div className="ctw-toggle" style={{ display: "flex", gap: 6, overflowX: "auto", flex: "1 1 auto", justifyContent: "center" }}>{modeBtn("deck", "Deck")}{modeBtn("summary", "Summary")}{modeBtn("onesheet", "One-sheet")}{modeBtn("infographic", "Info")}</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flex: "0 0 auto" }}><Stat n={biz} l="Biz" /><Stat n={sig} l="Signals" /></div>
      </header>

      {/* stage — scrolls only if a slide is taller than the screen; header + controls stay fixed */}
      <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
        {mode === "infographic" && (
          <div style={{ padding: "18px 16px 40px", textAlign: "center" }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>The R0cketShip Network</h1>
            <p style={{ color: MUT, maxWidth: 520, margin: "0 auto 16px", fontSize: 14 }}>Live. Tap any favicon — the hub grows as businesses join.</p>
            <Hub net={net} big onPick={setNode} />
          </div>
        )}

        {mode === "deck" && (
          <div className="ctw-deck" style={{ maxWidth: 1120, margin: "0 auto", minHeight: "100%", padding: "16px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="ctw-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 24, alignItems: "center" }}>
              <div className="ctw-copy" style={{ minWidth: 0 }}>
                {SLIDES[i].eyebrow && <div style={{ color: O, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", fontSize: 11.5 }}>{SLIDES[i].eyebrow}</div>}
                <h1 style={{ fontSize: "clamp(21px,5vw,42px)", fontWeight: 900, margin: "8px 0 0", lineHeight: 1.08, textWrap: "balance" }}>{SLIDES[i].title}</h1>
                <p style={{ color: "#c3ccd9", fontSize: "clamp(13.5px,1.6vw,17px)", lineHeight: 1.55, marginTop: 11 }}>{SLIDES[i].body}</p>
                {i === 3 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 11 }}>{SIDE_SIGNALS.map((s) => <span key={s} style={{ background: "#131c2c", border: "1px solid #26324a", borderRadius: 100, padding: "4px 10px", fontSize: 11.5, color: MUT }}>{s}</span>)}</div>}
                {SLIDES[i].cta && <a href={SLIDES[i].cta!.href} style={{ display: "inline-block", marginTop: 15, background: O, color: "#fff", fontWeight: 800, textDecoration: "none", borderRadius: 100, padding: "11px 22px" }}>{SLIDES[i].cta!.label}</a>}
              </div>
              <div className="ctw-hubwrap"><Hub net={net} onPick={setNode} /></div>
            </div>
          </div>
        )}

        {(mode === "summary" || mode === "onesheet") && (
          <div style={{ maxWidth: mode === "onesheet" ? 820 : 760, margin: "0 auto", padding: "22px 18px 50px" }}>
            <h1 style={{ fontSize: 27, fontWeight: 900 }}>The R0cketShip Network — {mode === "onesheet" ? "One-Sheet" : "Executive Summary"}</h1>
            <p style={{ color: O, fontWeight: 700 }}>#ARTLAB · A rising tide lifts all boats.</p>
            <div style={{ margin: "16px 0" }}><Hub net={net} onPick={setNode} /></div>
            {SLIDES.map((s, k) => (
              <div key={k} style={{ borderTop: "1px solid #1a2436", padding: mode === "onesheet" ? "12px 0" : "16px 0" }}>
                <h2 style={{ fontSize: mode === "onesheet" ? 17 : 20, fontWeight: 800, margin: 0 }}>{s.title}</h2>
                <p style={{ color: "#c3ccd9", fontSize: mode === "onesheet" ? 14 : 15.5, lineHeight: 1.6, marginTop: 6 }}>{s.body}</p>
              </div>
            ))}
            <a href="/join" style={{ display: "inline-block", marginTop: 18, background: O, color: "#fff", fontWeight: 800, textDecoration: "none", borderRadius: 100, padding: "12px 24px" }}>Join the Network →</a>
          </div>
        )}
      </div>

      {/* fixed bottom controls — always reachable, no scrolling to navigate */}
      {mode === "deck" && (
        <div style={{ position: "relative", flex: "0 0 auto", borderTop: "1px solid #1a2436", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 14, background: "rgba(8,11,18,.6)" }}>
          <button onClick={() => go(-1)} disabled={i === 0} style={{ background: "#131c2c", border: "1px solid #26324a", color: i === 0 ? "#3a475e" : INK, borderRadius: 100, width: 44, height: 44, fontSize: 20, cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.5 : 1 }}>‹</button>
          <div style={{ display: "flex", gap: 7 }}>{SLIDES.map((_, k) => <button key={k} onClick={() => setI(k)} aria-label={`slide ${k + 1}`} style={{ width: k === i ? 24 : 9, height: 9, borderRadius: 100, border: "none", background: k === i ? O : "#33415a", cursor: "pointer", transition: "width .2s", padding: 0 }} />)}</div>
          <button onClick={() => go(1)} disabled={i === SLIDES.length - 1} style={{ background: "#131c2c", border: "1px solid #26324a", color: INK, borderRadius: 100, width: 44, height: 44, fontSize: 20, cursor: i === SLIDES.length - 1 ? "default" : "pointer", opacity: i === SLIDES.length - 1 ? 0.5 : 1 }}>›</button>
          <span className="ctw-count" style={{ position: "absolute", right: 16, fontSize: 11.5, color: MUT }}>{i + 1} / {SLIDES.length}</span>
        </div>
      )}

      {node && NODE_INFO[node] && (
        <div onClick={() => setNode(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: PANEL, border: "1px solid #26324a", borderRadius: 16, padding: 24, maxWidth: 440 }}>
            <div style={{ fontSize: 19, fontWeight: 800 }}>{NODE_INFO[node].t}</div>
            <p style={{ color: "#c3ccd9", lineHeight: 1.6, marginTop: 8 }}>{NODE_INFO[node].d}</p>
            <button onClick={() => setNode(null)} style={{ marginTop: 8, background: O, color: "#fff", border: "none", borderRadius: 100, padding: "10px 22px", fontWeight: 800, cursor: "pointer" }}>Got it</button>
          </div>
        </div>
      )}

      <style>{`
        .ctw-toggle::-webkit-scrollbar{display:none}
        .ctw-toggle{scrollbar-width:none}
        @media (max-width:860px){
          .ctw-deck{justify-content:flex-start !important}
          .ctw-grid{grid-template-columns:1fr !important; gap:12px !important}
          .ctw-hubwrap{order:-1}
          .ctw-hubwrap > div{max-width:min(58vw,240px) !important}
          .ctw-h-title{display:none}
          .ctw-count{display:none}
        }
      `}</style>
    </div>
  );
}
