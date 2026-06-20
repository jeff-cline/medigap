import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/logic";
import { notifyNewAccount } from "@/lib/email";

// Public claim-a-money-word signup: creates a partner account + a keyword bid in their area,
// and hands back a free demo lead. The growth hook from the Money Word Cloud.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase();
  const word = String(b.word || "").trim().toLowerCase();
  const scope = ["zip", "state", "national"].includes(String(b.scope)) ? String(b.scope) : "zip";
  const scopeValue = String(b.scopeValue || "").trim();
  if (!email || !word) return NextResponse.json({ error: "Email and money word are required." }, { status: 400 });
  if (scope !== "national" && !scopeValue) return NextResponse.json({ error: "Enter your ZIP or state." }, { status: 400 });

  const { minCallBidCents } = await getSettings();
  const geoVal = scope === "national" ? "" : scopeValue;

  // Claim check — one partner per word+area.
  const taken = await db.agentBid.findFirst({ where: { keyword: word, scope, scopeValue: geoVal }, include: { agent: true } });
  if (taken) return NextResponse.json({ error: `"${word}" is already claimed ${scope === "national" ? "nationwide" : `in ${scopeValue}`}. Try a different area.` }, { status: 409 });

  let user = await db.user.findUnique({ where: { email } });
  const tempPassword = "TEMP!234";
  const source = `Money Word Cloud: ${word}${geoVal ? ` (${geoVal})` : " (national)"}`;
  let isNew = false;
  if (!user) {
    isNew = true;
    user = await db.user.create({ data: { email, name: String(b.name || "").trim() || email.split("@")[0], role: "moneywords", passwordHash: await bcrypt.hash(tempPassword, 10), mustChangePassword: true, status: "active", source } });
  }
  // Their first money-word bid, pre-populated for their area.
  await db.agentBid.create({ data: { agentId: user.id, scope, scopeValue: geoVal, keyword: word, amountCents: minCallBidCents, active: false } });
  if (isNew) notifyNewAccount({ name: user.name, email: user.email, role: user.role, phone: user.phone, source, id: user.id }).catch(() => {});

  // Free demo lead: the most recent lead tied to this money word.
  const demo = await db.lead.findFirst({ where: { OR: [{ appended: { contains: word } }, { calls: { some: { moneyWord: { contains: word } } } }] }, orderBy: { createdAt: "desc" }, select: { id: true } });
  return NextResponse.json({ ok: true, tempPassword, email, demoLeadId: demo?.id || null });
}
