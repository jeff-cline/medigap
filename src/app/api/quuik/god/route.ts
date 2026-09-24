import { NextRequest, NextResponse } from "next/server";
import { getSession, isGod } from "@/lib/auth";
import { getAllProfiles, patchProfile } from "@/lib/advertiser";
import { setLink } from "@/lib/shortlinks";
import { setMeta } from "@/lib/moneycloud";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const parseList = (s: unknown) => String(s ?? "").split(/[\n,]+/).map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 30);

export async function POST(req: NextRequest) {
  if (!isGod(await getSession())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const op = String(b.op || "");

  if (op === "approve" || op === "pause") {
    const uid = String(b.uid || ""); const p = (await getAllProfiles())[uid];
    if (!p) return NextResponse.json({ error: "No profile" }, { status: 404 });
    const word = String(p.moneyWord || "").toLowerCase();
    if (op === "approve") {
      const url = p.website && /^https?:\/\//i.test(p.website) ? p.website : (p.website ? `https://${p.website}` : `https://quuik.com/${word}`);
      if (word) { await setLink(word, url).catch(() => {}); await setMeta(word, { title: p.business || word, desc: p.business ? `${p.business} — trusted network partner` : "Trusted network partner", trigger: [word], adjacent: p.adjacent || [], supporting: p.supporting || [] }).catch(() => {}); }
      await patchProfile(uid, { status: "active" });
      await db.user.update({ where: { id: uid }, data: { status: "active" } }).catch(() => {});
      await db.agentBid.updateMany({ where: { agentId: uid, keyword: word }, data: { active: true } }).catch(() => {});
    } else {
      await patchProfile(uid, { status: "paused" });
      await db.user.update({ where: { id: uid }, data: { status: "paused" } }).catch(() => {});
      await db.agentBid.updateMany({ where: { agentId: uid }, data: { active: false } }).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  }

  if (op === "add-keyword") {
    const keyword = String(b.keyword || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
    const url = String(b.url || "").trim();
    if (!keyword || !url) return NextResponse.json({ error: "Keyword and destination URL are required." }, { status: 400 });
    const dest = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    await setLink(keyword, dest).catch(() => {});
    await setMeta(keyword, { title: String(b.title || "") || keyword, desc: String(b.desc || ""), trigger: [keyword], adjacent: parseList(b.adjacent), supporting: parseList(b.supporting) }).catch(() => {});
    return NextResponse.json({ ok: true, keyword });
  }
  return NextResponse.json({ error: "Unknown op" }, { status: 400 });
}
