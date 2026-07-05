// exitoptimization.com — rebuilt on the Core. Dark slate + orange accent (matched to the
// existing site). A lead-gen engine that funnels to the Core CRM.
export const EXIT = {
  brand: "Exit Optimization",
  domain: "exitoptimization.com",
  siteHost: "exitoptimization.com",
  calendly: "https://calendly.com/jdcline",
  tagline: "Double — even triple — your exit valuation.",
  promise: "We help owners multiply their exit multiple and walk away with more.",
  colors: {
    bg: "#020617", panel: "#0b1220", panel2: "#111c34", border: "#1e293b",
    orange: "#f97316", orange2: "#fb923c", orange3: "#fdba74",
    white: "#ffffff", ink: "#e2e8f0", muted: "#94a3b8",
  },
} as const;

// The three ways to engage — surfaced site-wide.
export const EXIT_WAYS = [
  { n: "01", title: "Pay to Play", desc: "A straightforward monthly engagement — the fastest way to put the full team to work on your value." },
  { n: "02", title: "We Work for Equity", desc: "We take a stake and build alongside you — fully aligned owners, not vendors." },
  { n: "03", title: "We Work for Backend Success", desc: "We get paid on the value we create at your exit — a success fee on the upside over your baseline." },
] as const;

export const exitVars = {
  "--bg": EXIT.colors.bg, "--panel": EXIT.colors.panel, "--panel2": EXIT.colors.panel2, "--border": EXIT.colors.border,
  "--orange": EXIT.colors.orange, "--orange2": EXIT.colors.orange2, "--orange3": EXIT.colors.orange3,
  "--ink": EXIT.colors.ink, "--muted": EXIT.colors.muted,
} as React.CSSProperties;
