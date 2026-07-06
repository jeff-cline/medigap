import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { EXIT_EMAILS } from "@/lib/exit-emails";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
const BASE = "https://exitoptimization.com";

// Ensure the 10 drip templates exist (seeded from the lib; god can edit them after).
async function ensureEmails() {
  const n = await db.calcEmail.count();
  if (n >= EXIT_EMAILS.length) return;
  for (let i = 0; i < EXIT_EMAILS.length; i++) {
    await db.calcEmail.upsert({ where: { weekIndex: i }, update: {}, create: { weekIndex: i, subject: EXIT_EMAILS[i].subject, storyHeader: EXIT_EMAILS[i].story } });
  }
}

function adBlocks(ads: { id: string; title: string; description: string; imageUrl: string; ctaLabel: string }[]): string {
  if (!ads.length) return "";
  const cards = ads.map((a) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0;border:1px solid #1e293b;border-radius:10px;overflow:hidden;background:#0b1220">
      <tr>${a.imageUrl ? `<td width="90" style="padding:0"><img src="${a.imageUrl}" width="90" height="90" style="display:block;object-fit:cover"></td>` : ""}
        <td style="padding:12px 14px">
          <div style="font-weight:700;color:#e2e8f0">${a.title}</div>
          <div style="font-size:13px;color:#94a3b8;margin:2px 0 6px">${a.description}</div>
          <a href="${BASE}/api/calc/click?ad=${a.id}" style="background:#f97316;color:#020617;font-weight:700;text-decoration:none;padding:6px 12px;border-radius:6px;font-size:13px">${a.ctaLabel || "Learn more"} →</a>
        </td></tr></table>`).join("");
  return `<div style="margin-top:22px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#fdba74;font-weight:700;margin-bottom:6px">Partners who can help</div>${cards}</div>`;
}

async function runDrip(): Promise<{ sent: number; week: number; subject: string }> {
  await ensureEmails();
  const week = Math.floor(Date.now() / (7 * 86400000)) % EXIT_EMAILS.length;
  const tmpl = (await db.calcEmail.findUnique({ where: { weekIndex: week } })) || { subject: EXIT_EMAILS[week].subject, storyHeader: EXIT_EMAILS[week].story, active: true };
  if (tmpl.active === false) return { sent: 0, week, subject: "(skipped — inactive)" };

  // rotate advertisers: offset the active-ad list by the week so different partners show each send
  const all = await db.calcAd.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  const start = all.length ? (week * 3) % all.length : 0;
  const rotated = [...all.slice(start), ...all.slice(0, start)].slice(0, 4);
  const ads = rotated.map((a) => ({ id: a.id, title: a.title, description: a.description, imageUrl: a.imageUrl, ctaLabel: a.ctaLabel }));

  const html = `<div style="background:#020617;padding:22px;font-family:Arial,sans-serif;color:#e2e8f0;max-width:600px;margin:0 auto">
    <div style="font-size:22px;font-weight:800">Exit<span style="color:#f97316">Optimization</span></div>
    <div style="font-size:15px;line-height:1.6;margin-top:14px">${tmpl.storyHeader}</div>
    <div style="margin:18px 0"><a href="${BASE}/business-valuation-calculators" style="background:#f97316;color:#020617;font-weight:700;text-decoration:none;padding:10px 18px;border-radius:8px">Open your calculators →</a></div>
    ${adBlocks(ads)}
    <div style="margin-top:22px;font-size:12px;color:#64748b;border-top:1px solid #1e293b;padding-top:12px">Exit Optimization · Double — even triple — your exit valuation · <a href="${BASE}/book" style="color:#94a3b8">Book a free consultation</a></div>
  </div>`;

  const customers = await db.user.findMany({ where: { role: "owner", source: { contains: "exitoptimization" } }, select: { email: true } });
  let sent = 0;
  for (const c of customers) { if (!c.email) continue; const ok = await sendEmail(c.email, tmpl.subject, html, "zapmail").then((x) => x.ok).catch(() => false); if (ok) sent++; }
  return { sent, week, subject: tmpl.subject };
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || "";
  if (!process.env.AUTH_SECRET || key !== process.env.AUTH_SECRET) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const r = await runDrip();
  return NextResponse.json({ ok: true, ...r, at: new Date().toISOString() });
}
