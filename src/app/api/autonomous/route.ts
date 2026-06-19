import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { pnl } from "@/lib/logic";
import { usd } from "@/lib/format";

// Operator actions on the AI decision log.
//
//   approve / decline → resolve a pinned decision: unpin it and append the
//                       resolution + timestamp to the rationale so the AI has
//                       a record to learn from.
//   challenge         → store the operator's "why" question on the log.
//   generate          → analyze live P&L, find the worst- and best-ROI
//                       channels, and write a fresh AutonomousLog proposing a
//                       concrete budget shift with real numbers.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");

  if (action === "approve" || action === "decline") {
    const id = String(b.id || "");
    if (!id) return NextResponse.json({ error: "Missing decision id." }, { status: 400 });
    const log = await db.autonomousLog.findUnique({ where: { id } });
    if (!log) return NextResponse.json({ error: "Decision not found." }, { status: 404 });
    const verb = action === "approve" ? "APPROVED" : "DECLINED";
    await db.autonomousLog.update({
      where: { id },
      data: {
        pinned: false,
        rationale: `${log.rationale}\n[${stamp}] ${verb} by ${session.email}.`.trim(),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "challenge") {
    const id = String(b.id || "");
    const question = String(b.question || "").trim();
    if (!id) return NextResponse.json({ error: "Missing decision id." }, { status: 400 });
    if (!question) return NextResponse.json({ error: "Enter a question." }, { status: 400 });
    const log = await db.autonomousLog.findUnique({ where: { id } });
    if (!log) return NextResponse.json({ error: "Decision not found." }, { status: 404 });
    await db.autonomousLog.update({
      where: { id },
      data: {
        rationale: `${log.rationale}\n[${stamp}] Operator asked: "${question}"`.trim(),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "generate") {
    const p = await pnl();
    const channels = Object.entries(p.byChannel)
      .map(([channel, v]) => ({
        channel,
        rev: v.rev,
        spend: v.spend,
        roi: v.spend > 0 ? v.rev / v.spend : v.rev > 0 ? Infinity : 0,
      }))
      .filter((c) => c.spend > 0);

    if (channels.length < 2) {
      await db.autonomousLog.create({
        data: {
          decision: "Hold current allocation",
          rationale:
            "Not enough channels with spend to recommend a reallocation. Continuing to monitor live P&L.",
          data: JSON.stringify({
            revenue: usd(p.revenue),
            spend: usd(p.spend),
            roi: `${p.roi.toFixed(2)}x`,
          }),
          pinned: false,
        },
      });
      return NextResponse.json({ ok: true });
    }

    const sorted = [...channels].sort((a, b2) => a.roi - b2.roi);
    const worst = sorted[0];
    const best = sorted[sorted.length - 1];
    // Propose shifting 20% of the worst channel's spend to the best.
    const shiftCents = Math.round(worst.spend * 0.2);
    const roiLabel = (n: number) => (n === Infinity ? "∞" : `${n.toFixed(2)}x`);

    await db.autonomousLog.create({
      data: {
        decision: `Shift ${usd(shiftCents)} from ${worst.channel} → ${best.channel}`,
        rationale:
          `${worst.channel} is returning ${roiLabel(worst.roi)} on ${usd(worst.spend)} of spend, the weakest in the network, ` +
          `while ${best.channel} is returning ${roiLabel(best.roi)}. Reallocating 20% of ${worst.channel}'s budget ` +
          `(${usd(shiftCents)}) to ${best.channel} is projected to lift blended ROI above the current ${p.roi.toFixed(2)}x.`,
        data: JSON.stringify({
          from: worst.channel,
          to: best.channel,
          shift: usd(shiftCents),
          fromROI: roiLabel(worst.roi),
          toROI: roiLabel(best.roi),
          blendedROI: `${p.roi.toFixed(2)}x`,
        }),
        question: `Approve shifting ${usd(shiftCents)} of media budget from ${worst.channel} to ${best.channel}?`,
        pinned: true,
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
