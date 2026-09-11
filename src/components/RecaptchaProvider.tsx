"use client";

import { useEffect } from "react";
import { isPublicFormEndpoint, actionFor } from "@/lib/public-forms";

// ---------------------------------------------------------------------------
// Mounted once in the root layout. It attaches a reCAPTCHA v3 token to every
// submission to a public form endpoint, so a form does not have to do anything
// to be protected — including forms we write later.
//
// Scope is deliberately narrow: only same-origin POSTs to the endpoints listed
// in lib/public-forms.ts. Dashboard and API traffic is untouched.
//
// v2 (checkbox) cannot work this way — it needs a visible widget — so a v2 form
// must use the useRecaptcha() hook and render <Checkbox />. The integrations
// card says so, and monitor mode exists so that mistake shows up in the log
// instead of in lost leads.
// ---------------------------------------------------------------------------

type PublicConfig = { siteKey: string; version: "v2" | "v3"; enabled: boolean };

declare global {
  interface Window {
    __coreRecaptchaPatched?: boolean;
  }
}

export default function RecaptchaProvider() {
  useEffect(() => {
    if (window.__coreRecaptchaPatched) return;

    let cfg: PublicConfig | null = null;
    let scriptReady = false;

    const setup = async () => {
      try {
        const res = await fetch("/api/recaptcha/config");
        cfg = (await res.json()) as PublicConfig;
      } catch { return; }
      if (!cfg?.enabled || !cfg.siteKey || cfg.version !== "v3") return;

      await new Promise<void>((resolve) => {
        const el = document.createElement("script");
        el.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(cfg!.siteKey)}`;
        el.async = true;
        el.defer = true;
        el.onload = () => { scriptReady = true; resolve(); };
        el.onerror = () => resolve();   // leave unpatched; server treats a
        document.head.appendChild(el);  // missing token per its failure policy
      });
    };

    const token = async (action: string): Promise<string> => {
      if (!scriptReady || !cfg?.siteKey || !window.grecaptcha) return "";
      try {
        return await new Promise<string>((resolve) => {
          window.grecaptcha!.ready(() => {
            window.grecaptcha!.execute(cfg!.siteKey, { action })
              .then(resolve)
              .catch(() => resolve(""));
          });
        });
      } catch { return ""; }
    };

    const nativeFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url = typeof input === "string" ? input
          : input instanceof URL ? input.href
          : input.url;
        const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
        if (method !== "POST" || !url) return nativeFetch(input, init);

        const u = new URL(url, window.location.origin);
        if (u.origin !== window.location.origin || !isPublicFormEndpoint(u.pathname)) {
          return nativeFetch(input, init);
        }

        // Only JSON string bodies are rewritten. FormData/Blob bodies are left
        // alone — those routes read formData and handle their own token.
        const body = init?.body;
        if (typeof body !== "string") return nativeFetch(input, init);

        let parsed: unknown;
        try { parsed = JSON.parse(body); } catch { return nativeFetch(input, init); }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return nativeFetch(input, init);
        }

        const t = await token(actionFor(u.pathname));
        if (!t) return nativeFetch(input, init);

        return nativeFetch(input, {
          ...init,
          body: JSON.stringify({ ...(parsed as Record<string, unknown>), recaptchaToken: t }),
        });
      } catch {
        // Never let this wrapper be the reason a request fails.
        return nativeFetch(input, init);
      }
    };

    window.__coreRecaptchaPatched = true;
    void setup();
  }, []);

  return null;
}
