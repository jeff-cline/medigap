// XM — experientialmarketing.ai brand system (black · red · white, bold + somatic).
export const XM = {
  brand: "XM",
  full: "Experiential Marketing",
  domain: "experientialmarketing.ai",
  siteHost: "experientialmarketing.ai",
  tagline: "Experiential marketing for the world's biggest brands.",
  cpmDollars: 33, // $33 per 1,000 eyeballs
  colors: { ink: "#0b0b0d", red: "#e11d2a", white: "#ffffff", soft: "#f4f4f6", border: "#e6e6ea", muted: "#6b6b76", panel: "#111114" },
} as const;

export const xmVars = {
  "--ink": XM.colors.ink, "--red": XM.colors.red, "--white": XM.colors.white,
  "--soft": XM.colors.soft, "--border": XM.colors.border, "--muted": XM.colors.muted, "--panel": XM.colors.panel,
} as React.CSSProperties;

// $33 / 1,000 eyeballs
export const eyeballsCost = (eyeballs: number) => Math.round((eyeballs / 1000) * XM.cpmDollars);
export const reachForBudget = (budgetDollars: number) => Math.round((budgetDollars / XM.cpmDollars) * 1000);
