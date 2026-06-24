"use client";
import { useEffect, useRef, useState } from "react";
import { ECOSYSTEM, type EcoNode } from "@/lib/agetech";

const GROUP_COLOR: Record<string, string> = { core: "#38e1ff", health: "#6aa6ff", finance: "#d8b46a", living: "#3ee6a6", platform: "#b48cff" };

// Canvas universe map: Rocketship at center, satellite nodes orbiting, animated link
// pulses. Click/hover a node to reveal its revenue pathway. No Three.js — pure canvas.
export default function EcosystemMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState<EcoNode | null>(null);
  const nodesRef = useRef<{ node: EcoNode; x: number; y: number; r: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0, t = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    function layout() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cx = w / 2, cy = h / 2;
      const sats = ECOSYSTEM.filter((n) => n.id !== "rocketship");
      const R = Math.min(w, h) * 0.38;
      nodesRef.current = [{ node: ECOSYSTEM[0], x: cx, y: cy, r: 30 }];
      sats.forEach((node, i) => {
        const a = (i / sats.length) * Math.PI * 2 - Math.PI / 2;
        nodesRef.current.push({ node, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, r: 18 });
      });
    }
    layout();

    function draw() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const center = nodesRef.current[0];
      // links
      nodesRef.current.slice(1).forEach((s, i) => {
        const lit = active && (active.id === s.node.id || active.id === "rocketship");
        ctx.strokeStyle = lit ? "rgba(56,225,255,.55)" : "rgba(56,225,255,.12)";
        ctx.lineWidth = lit ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(s.x, s.y); ctx.stroke();
        // travelling pulse
        const p = ((t / 120) + i / nodesRef.current.length) % 1;
        const px = center.x + (s.x - center.x) * p, py = center.y + (s.y - center.y) * p;
        ctx.fillStyle = GROUP_COLOR[s.node.group]; ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      });
      // nodes
      nodesRef.current.forEach((nd) => {
        const isCenter = nd.node.id === "rocketship";
        const isActive = active?.id === nd.node.id;
        const col = isCenter ? "#38e1ff" : GROUP_COLOR[nd.node.group];
        const pulse = isCenter ? 4 + Math.sin(t / 22) * 3 : 0;
        ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.r + pulse + (isActive ? 6 : 0), 0, Math.PI * 2);
        ctx.fillStyle = isCenter ? "rgba(56,225,255,.16)" : "rgba(255,255,255,.04)"; ctx.fill();
        ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.r, 0, Math.PI * 2);
        ctx.fillStyle = "#0a0e18"; ctx.fill(); ctx.lineWidth = isActive ? 2.5 : 1.5; ctx.strokeStyle = col; ctx.stroke();
        ctx.fillStyle = isCenter ? "#eaf6ff" : "#aebbd6"; ctx.font = `${isCenter ? 600 : 500} ${isCenter ? 13 : 10}px ui-sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(isCenter ? "R)CKETSHIP" : nd.node.label, nd.x, nd.y + (isCenter ? 0 : 0));
      });
      t++; raf = requestAnimationFrame(draw);
    }
    draw();

    function hit(ev: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
      const found = nodesRef.current.find((nd) => Math.hypot(nd.x - mx, nd.y - my) <= nd.r + 8);
      setActive(found ? found.node : null);
      canvas.style.cursor = found ? "pointer" : "default";
    }
    canvas.addEventListener("mousemove", hit);
    const onResize = () => layout();
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); canvas.removeEventListener("mousemove", hit); window.removeEventListener("resize", onResize); };
  }, [active]);

  return (
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-center">
      <div className="ag-panel ag-grid-bg relative overflow-hidden" style={{ aspectRatio: "1.3" }}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      <div>
        <div className="ag-panel p-6 min-h-[200px]">
          {active ? (
            <>
              <div className="ag-chip mb-3" style={{ color: GROUP_COLOR[active.group], borderColor: GROUP_COLOR[active.group] + "66" }}>{active.group}</div>
              <h3 className="text-2xl font-bold">{active.label}</h3>
              <p className="mt-3 text-[var(--ag-muted)] leading-relaxed">{active.revenue}</p>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold">One relationship. <span className="ag-gradient">Many pathways.</span></h3>
              <p className="mt-3 text-[var(--ag-muted)] leading-relaxed">Hover any node to see its revenue pathway. Every connection routes back through the R)cketShip trust layer — and each new node makes every other node more valuable.</p>
            </>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(GROUP_COLOR).map(([g, c]) => (
            <span key={g} className="text-[11px] flex items-center gap-1.5 text-[var(--ag-muted)]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{g}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
