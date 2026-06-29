import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { randomCode } from "@/lib/qr";

function gate(s: Awaited<ReturnType<typeof getSession>>) {
  return !!s && (s.role === "god" || s.role === "marketing" || !!s.impersonatorUid);
}

// Create / update / approve / feature / delete a TV commercial. God/marketing only.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!gate(s)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");

  try {
    if (action === "create") {
      const sp = await db.tvSpot.create({
        data: {
          title: String(b.title || "Untitled spot").slice(0, 160),
          subtitle: String(b.subtitle || "").slice(0, 240),
          script: String(b.script || ""),
          seconds: Math.max(5, Math.min(120, Number(b.seconds) || 30)),
          videoUrl: String(b.videoUrl || ""),
          posterUrl: String(b.posterUrl || ""),
          voiceUrl: String(b.voiceUrl || ""),
          qrCode: "tv-" + randomCode(),
          status: "draft",
        },
      });
      return NextResponse.json({ ok: true, id: sp.id });
    }

    if (action === "update") {
      const data: Record<string, unknown> = {};
      for (const k of ["title", "subtitle", "script", "videoUrl", "posterUrl", "voiceUrl", "sourceUrl", "lookPrompt", "baseUrl", "screen1", "screen2", "screen3", "screen4"] as const)
        if (b[k] !== undefined) data[k] = String(b[k]);
      if (b.seconds !== undefined) data.seconds = Math.max(5, Math.min(120, Number(b.seconds) || 30));
      if (b.sortOrder !== undefined) data.sortOrder = Number(b.sortOrder) || 0;
      if (b.clipStart !== undefined) data.clipStart = Math.max(0, Number(b.clipStart) || 0);
      if (b.clipDuration !== undefined) data.clipDuration = Math.max(0, Number(b.clipDuration) || 0);
      if (b.cropEnabled !== undefined) data.cropEnabled = !!b.cropEnabled;
      for (const k of ["cropX", "cropY", "cropW", "cropH"] as const)
        if (b[k] !== undefined) data[k] = Math.max(0, Math.min(100, Number(b[k]) || 0));
      await db.tvSpot.update({ where: { id: String(b.id) }, data });
      return NextResponse.json({ ok: true });
    }

    if (action === "approve") {
      const approved = !!b.approved;
      await db.tvSpot.update({ where: { id: String(b.id) }, data: { status: approved ? "approved" : "draft", approvedAt: approved ? new Date() : null } });
      return NextResponse.json({ ok: true });
    }

    if (action === "feature") {
      await db.tvSpot.update({ where: { id: String(b.id) }, data: { featured: !!b.featured } });
      return NextResponse.json({ ok: true });
    }

    if (action === "duplicate") {
      const src = await db.tvSpot.findUnique({ where: { id: String(b.id) } });
      if (!src) return NextResponse.json({ error: "Spot not found" }, { status: 404 });
      const copy = await db.tvSpot.create({
        data: {
          title: src.title.replace(/ \(copy( \d+)?\)$/, "") + " (copy)",
          subtitle: src.subtitle,
          script: src.script,
          seconds: src.seconds,
          sourceUrl: src.sourceUrl, // reuse the same source footage
          lookPrompt: src.lookPrompt,
          clipStart: src.clipStart, clipDuration: src.clipDuration,
          cropEnabled: src.cropEnabled, cropX: src.cropX, cropY: src.cropY, cropW: src.cropW, cropH: src.cropH,
          posterUrl: src.posterUrl,
          baseUrl: src.baseUrl, // reuse the same lip-synced spokesperson base
          screen1: src.screen1, screen2: src.screen2, screen3: src.screen3, screen4: src.screen4,
          qrCode: "tv-" + randomCode(),
          status: "draft", // a fresh copy starts as a draft, un-rendered
        },
      });
      return NextResponse.json({ ok: true, id: copy.id });
    }

    if (action === "delete") {
      await db.tvSpot.delete({ where: { id: String(b.id) } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e).slice(0, 300) }, { status: 200 });
  }
}
