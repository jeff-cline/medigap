"use client";
import { useEffect, useRef } from "react";

// Calendly inline embed (official widget) for the founder's scheduling link.
// Prefill name/email when passed (Calendly reads ?name=&email= on the widget URL).
export default function CalendlyEmbed({ url, name, email, prefill = true }: { url: string; name?: string; email?: string; prefill?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // load the Calendly widget script once
    const id = "calendly-widget-js";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id; s.src = "https://assets.calendly.com/assets/external/widget.js"; s.async = true;
      document.body.appendChild(s);
    }
    // ensure stylesheet
    const cssId = "calendly-widget-css";
    if (!document.getElementById(cssId)) {
      const l = document.createElement("link");
      l.id = cssId; l.rel = "stylesheet"; l.href = "https://assets.calendly.com/assets/external/widget.css";
      document.head.appendChild(l);
    }
    // build the data-url with prefill
    const u = new URL(url);
    if (prefill && name) u.searchParams.set("name", name);
    if (prefill && email) u.searchParams.set("email", email);
    u.searchParams.set("hide_gdpr_banner", "1");
    if (ref.current) ref.current.setAttribute("data-url", u.toString());

    // if the widget script already initialized, (re)init this widget
    const w = window as unknown as { Calendly?: { initInlineWidget: (o: { url: string; parentElement: HTMLElement }) => void } };
    const init = () => { if (w.Calendly && ref.current) { ref.current.innerHTML = ""; w.Calendly.initInlineWidget({ url: u.toString(), parentElement: ref.current }); } };
    const t = setTimeout(init, 400);
    return () => clearTimeout(t);
  }, [url, name, email, prefill]);

  return <div ref={ref} className="calendly-inline-widget" style={{ minWidth: 320, height: 720 }} />;
}
