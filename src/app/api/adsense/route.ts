import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ADSENSE_DEFAULT_ON } from "@/lib/adsense";

// Toggle AdSense on/off per Core site. God/accounting only.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || (s.role !== "god" && s.role !== "accounting" && !s.impersonatorUid)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const host = String(b.host || "").replace(/^www\./, "").toLowerCase();
  if (!host) return NextResponse.json({ error: "host required" }, { status: 400 });

  const row = await db.integration.findUnique({ where: { key: "adsense" } });
  let cfg: Record<string, unknown> = {};
  try { cfg = row ? JSON.parse(row.config) : {}; } catch {}
  const cur: string[] = Array.isArray(cfg.enabledHosts) ? (cfg.enabledHosts as string[]) : ADSENSE_DEFAULT_ON;
  const set = new Set(cur.map((h) => h.replace(/^www\./, "").toLowerCase()));
  if (b.on) set.add(host); else set.delete(host);
  cfg.enabledHosts = [...set];

  await db.integration.upsert({
    where: { key: "adsense" },
    update: { config: JSON.stringify(cfg) },
    create: { key: "adsense", label: "Google AdSense", config: JSON.stringify(cfg), connected: false, status: "" },
  });
  return NextResponse.json({ ok: true, on: set.has(host), enabledHosts: [...set] });
}
