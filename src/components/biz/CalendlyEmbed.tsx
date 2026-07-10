"use client";
import { useEffect } from "react";

export default function CalendlyEmbed({ url }: { url: string }) {
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    document.body.appendChild(s);
    return () => { try { document.body.removeChild(s); } catch {} };
  }, []);
  return <div className="calendly-inline-widget" data-url={`${url}?hide_gdpr_banner=1&background_color=0e1526&text_color=eef2f9&primary_color=e3b23c`} style={{ minWidth: 320, height: 720, borderRadius: 16, overflow: "hidden" }} />;
}
