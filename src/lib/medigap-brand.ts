// Locked brand spec for the 1-800-MEDIGAP flagship SEO site. Used by every silo/child page.
export const MEDIGAP = {
  brand: "1-800-MEDIGAP",           // the brand — MEDIGAP is ALWAYS capitalized
  site: "1-800-medigap.com",
  url: "https://1-800-medigap.com",
  tagline: "America's Trusted Toll-Free Number",
  tel: "18006334427",                // 1-800-633-4427
  telDisplay: "1-800-633-4427",
  cta: "Call 1-800-MEDIGAP",
  // Premium "billion-dollar brand", LIGHT palette.
  colors: {
    bg: "#ffffff",
    ink: "#0b2348",        // deep navy text
    brand: "#1457e6",      // trustworthy blue
    brand2: "#0b8a6a",     // calm green accent
    gold: "#c69a3e",       // premium gold
    soft: "#f4f7fc",       // light panel
    border: "#e4e9f2",
    muted: "#5b6b86",
  },
} as const;
