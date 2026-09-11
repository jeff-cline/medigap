"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// The browser half of the Core's form defence. Pair with lib/form-guard.ts.
//
//   const captcha = useRecaptcha("leads");
//   ...
//   <RecaptchaNotice />                       // the legal line Google requires
//   const token = await captcha.getToken();
//   fetch("/api/leads", { body: JSON.stringify({ ...values, recaptchaToken: token }) })
//
// Loads nothing at all until keys are configured, so forms are unaffected
// before the keys go in.
// ---------------------------------------------------------------------------

type PublicConfig = { siteKey: string; version: "v2" | "v3"; enabled: boolean };

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
      render: (el: HTMLElement, opts: Record<string, unknown>) => number;
      reset: (id?: number) => void;
    };
  }
}

let configPromise: Promise<PublicConfig> | null = null;
function loadConfig(): Promise<PublicConfig> {
  // One fetch per page load however many forms are on it.
  configPromise ??= fetch("/api/recaptcha/config")
    .then((r) => r.json())
    .catch(() => ({ siteKey: "", version: "v3", enabled: false }) as PublicConfig);
  return configPromise;
}

const scripts = new Map<string, Promise<void>>();
function loadScript(src: string): Promise<void> {
  let p = scripts.get(src);
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.async = true;
      el.defer = true;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error("recaptcha script failed"));
      document.head.appendChild(el);
    });
    scripts.set(src, p);
  }
  return p;
}

/**
 * Returns { getToken }. `getToken()` resolves to a token, or "" when reCAPTCHA
 * is not configured or the script could not load — the server treats a missing
 * token as "not configured → allow", so a Google outage never blocks a real
 * person from submitting.
 */
export function useRecaptcha(action: string) {
  const [cfg, setCfg] = useState<PublicConfig | null>(null);
  const [ready, setReady] = useState(false);
  const v2Widget = useRef<number | null>(null);
  const v2Box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let live = true;
    loadConfig().then(async (c) => {
      if (!live) return;
      setCfg(c);
      if (!c.enabled || !c.siteKey) return;
      const src = c.version === "v3"
        ? `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(c.siteKey)}`
        : "https://www.google.com/recaptcha/api.js?render=explicit";
      try { await loadScript(src); if (live) setReady(true); } catch { /* leave disabled */ }
    });
    return () => { live = false; };
  }, []);

  // v2 needs a visible checkbox rendered into the page.
  useEffect(() => {
    if (!ready || !cfg?.enabled || cfg.version !== "v2") return;
    if (!v2Box.current || v2Widget.current !== null) return;
    window.grecaptcha?.ready(() => {
      if (!v2Box.current || v2Widget.current !== null) return;
      try {
        v2Widget.current = window.grecaptcha!.render(v2Box.current, { sitekey: cfg.siteKey });
      } catch { /* already rendered */ }
    });
  }, [ready, cfg]);

  const getToken = useCallback(async (): Promise<string> => {
    if (!cfg?.enabled || !cfg.siteKey || !ready || !window.grecaptcha) return "";
    if (cfg.version === "v2") {
      // The value the checkbox widget put in the page.
      const el = v2Box.current?.querySelector<HTMLTextAreaElement>("textarea[name='g-recaptcha-response']");
      return el?.value ?? "";
    }
    try {
      return await new Promise<string>((resolve) => {
        window.grecaptcha!.ready(() => {
          window.grecaptcha!.execute(cfg.siteKey, { action })
            .then(resolve)
            .catch(() => resolve(""));
        });
      });
    } catch { return ""; }
  }, [cfg, ready, action]);

  const reset = useCallback(() => {
    if (cfg?.version === "v2" && v2Widget.current !== null) {
      window.grecaptcha?.reset(v2Widget.current);
    }
  }, [cfg]);

  return {
    getToken,
    reset,
    enabled: Boolean(cfg?.enabled),
    version: cfg?.version ?? "v3",
    /** Render this inside the form. It is a no-op on v3. */
    Checkbox: () =>
      cfg?.enabled && cfg.version === "v2"
        ? <div ref={v2Box} className="my-3" />
        : null,
  };
}

/**
 * Google's branding requirement when the v3 badge is hidden. Put it under the
 * submit button of any form using reCAPTCHA.
 */
export function RecaptchaNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-snug text-neutral-500 ${className}`}>
      Protected by reCAPTCHA. Google&rsquo;s{" "}
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
        Privacy Policy
      </a>{" "}
      and{" "}
      <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">
        Terms of Service
      </a>{" "}
      apply.
    </p>
  );
}
