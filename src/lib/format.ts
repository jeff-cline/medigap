export const usd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const usd2 = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
export const num = (n: number) => n.toLocaleString("en-US");
export const pct = (n: number) => `${n.toFixed(1)}%`;
export const TOLLFREE = "1-800-MEDIGAP";
export const TOLLFREE_TEL = "18006334427";

// Human-friendly lead reference: 444 + 10-digit zero-padded sequence (e.g. 444-0000000001).
export const leadRef = (n?: number | null) => (n == null ? "—" : `444-${String(n).padStart(10, "0")}`);

// All displayed times are Central (America/Chicago) per ops requirement.
export const cst = (d: Date | string) =>
  new Date(d).toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) + " CT";
export const cstFull = (d: Date | string) =>
  new Date(d).toLocaleString("en-US", { timeZone: "America/Chicago", year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }) + " CT";
export const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
export const fmtPhone = (p: string) => {
  const d = (p || "").replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p || "—";
};
