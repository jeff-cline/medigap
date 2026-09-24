"use client";
// Global live-visitor map (Leaflet + OpenStreetMap). Starts zoomed to the US; pan/scroll to roam
// the globe. Live visitors (active <5 min) = green throbbing dots; everyone else = blue dots sized
// by how many times they've visited (1 tiny → 4+ largest). Polls every 12s.
import { useEffect, useRef, useState } from "react";

type Pt = { ip: string; lat: number; lon: number; visits: number; live: boolean; label: string; place: string };
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { L?: any } }

function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => resolve(window.L);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

const radiusFor = (v: number) => (v <= 1 ? 3 : v === 2 ? 5 : v === 3 ? 7 : v === 4 ? 9 : Math.min(14, 9 + (v - 4)));

export default function LiveMap() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [live, setLive] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let stop = false, timer: ReturnType<typeof setInterval>;
    (async () => {
      const L = await loadLeaflet().catch(() => null);
      if (!L || stop || !mapEl.current || mapRef.current) return;
      const map = L.map(mapEl.current, { worldCopyJump: true, minZoom: 2 }).setView([39.5, -98.35], 4); // US
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 18 }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setTimeout(() => { try { map.invalidateSize(); } catch { /* noop */ } }, 250); // avoid half-tiled render

      const draw = async () => {
        try {
          const r = await fetch("/api/net/livemap", { cache: "no-store" });
          if (!r.ok) return;
          const d = await r.json();
          if (stop) return;
          setLive(d.live || 0); setTotal(d.total || 0);
          layerRef.current.clearLayers();
          for (const p of (d.points as Pt[])) {
            const tip = `<b>${p.label || "Visitor"}</b><br>${p.place} · ${p.visits} visit${p.visits === 1 ? "" : "s"}${p.live ? " · <span style='color:#12a150'>● live now</span>" : ""}<br><span style='color:#5b6572'>click to drill in →</span>`;
            const drill = () => { location.href = "/account/visitors?v=" + encodeURIComponent(p.ip); };
            const m = p.live
              ? L.marker([p.lat, p.lon], { icon: L.divIcon({ className: "", html: `<div class="pc-live"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] }) })
              : L.circleMarker([p.lat, p.lon], { radius: radiusFor(p.visits), color: "#1e63d0", weight: 1, fillColor: "#2f7be6", fillOpacity: 0.75 });
            m.bindTooltip(tip).on("click", drill).addTo(layerRef.current);
          }
        } catch { /* ignore */ }
      };
      await draw();
      timer = setInterval(draw, 12000);
    })();
    return () => { stop = true; clearInterval(timer!); if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 150px)", minHeight: 460, borderRadius: 14, overflow: "hidden", border: "1px solid #e4e7ec" }}>
      <style>{`
        .pc-live{width:14px;height:14px;border-radius:50%;background:#12a150;border:2px solid #fff;box-shadow:0 0 0 0 rgba(18,161,80,.6);animation:pcLive 1.6s infinite}
        @keyframes pcLive{0%{box-shadow:0 0 0 0 rgba(18,161,80,.55)}70%{box-shadow:0 0 0 14px rgba(18,161,80,0)}100%{box-shadow:0 0 0 0 rgba(18,161,80,0)}}
        .leaflet-container{background:#aad3df}
      `}</style>
      <div ref={mapEl} style={{ width: "100%", height: "100%" }} />
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 500, background: "rgba(15,27,45,.92)", color: "#fff", borderRadius: 12, padding: "10px 16px", fontFamily: "-apple-system,Segoe UI,Helvetica,Arial,sans-serif", boxShadow: "0 6px 20px rgba(0,0,0,.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#12a150", boxShadow: "0 0 0 0 rgba(18,161,80,.6)", animation: "pcLive 1.6s infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#9fe7bd" }}>Live now</span>
          <span style={{ fontSize: 24, fontWeight: 850, marginLeft: 2 }}>{live.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: 11.5, color: "#9fb3cc", marginTop: 2 }}>{total.toLocaleString()} located visitors · blue = size by visits</div>
      </div>
    </div>
  );
}
