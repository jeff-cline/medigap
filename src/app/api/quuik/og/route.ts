import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";

export const dynamic = "force-dynamic";
const LOGO = path.join(process.cwd(), "public/quuik-assets/logo.png");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function wrap(t: string, max: number): string[] {
  const words = String(t).split(/\s+/).filter(Boolean); const lines: string[] = []; let cur = "";
  for (const w of words) { if ((cur + " " + w).trim().length > max) { if (cur) lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
  if (cur) lines.push(cur);
  if (lines.length > 3) { lines.length = 3; lines[2] = lines[2].replace(/[.\s]+$/, "") + "…"; }
  return lines;
}
// Per-page social card: logo on top, the page title wrapped below, "quuik answers" brand + accent bar.
export async function GET(req: NextRequest) {
  const t = (req.nextUrl.searchParams.get("t") || "").slice(0, 140).trim();
  try {
    const logo = await sharp(LOGO).resize(150, 150, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } }).toBuffer();
    const lines = t ? wrap(t, 26) : ["quuik answers"];
    const startY = 340 - (lines.length - 1) * 34;
    const tspans = lines.map((ln, i) => `<tspan x="600" y="${startY + i * 66}">${esc(ln)}</tspan>`).join("");
    const svg = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><text font-family="Helvetica, Arial, sans-serif" font-size="52" font-weight="bold" fill="#1c2128" text-anchor="middle">${tspans}</text><text x="600" y="565" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="bold" text-anchor="middle"><tspan fill="#F5821F">quuik</tspan><tspan fill="#1c2128"> answers</tspan></text><rect x="0" y="618" width="1200" height="12" fill="#F5821F"/></svg>`);
    const png = await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
      .composite([{ input: logo, top: 66, left: 525 }, { input: svg, top: 0, left: 0 }]).png().toBuffer();
    return new NextResponse(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400, s-maxage=86400" } });
  } catch { return NextResponse.redirect("https://quuik.com/quuik-assets/og.png"); }
}
