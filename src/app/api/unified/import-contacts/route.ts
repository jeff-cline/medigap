import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canUnified } from "@/lib/unified";
import { BULK_TAG } from "@/lib/jv-constants";

const norm = (p: string) => (p || "").replace(/\D/g, "").slice(-10);
const PHONE_TAG = "phone-sync";

// One-tap import of phone contacts into the CRM. God + assistants only.
// Each lands tagged for the dumpster (BULK_TAG + phone-sync) with the default 👤 emoji, deduped.
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !canUnified(s)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const raw: { name?: string; phone?: string; email?: string }[] = Array.isArray(b.contacts) ? b.contacts : [];
  // clean + require at least a phone or email
  const contacts = raw
    .map((c) => ({ name: String(c.name || "").trim(), phone: norm(String(c.phone || "")), email: String(c.email || "").trim().toLowerCase() }))
    .filter((c) => c.phone.length === 10 || c.email.includes("@"))
    .slice(0, 5000);
  if (contacts.length === 0) return NextResponse.json({ ok: true, imported: 0, updated: 0, message: "No usable contacts found." });

  const phones = [...new Set(contacts.map((c) => c.phone).filter(Boolean))];
  const emails = [...new Set(contacts.map((c) => c.email).filter(Boolean))];
  const existing = await db.lead.findMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: { OR: [{ phone: { in: phones } }, { email: { in: emails } }] } as any,
    select: { id: true, phone: true, email: true, name: true, tags: true, emoji: true },
  });
  const byPhone = new Map(existing.map((l) => [norm(l.phone), l]));
  const byEmail = new Map(existing.map((l) => [l.email.toLowerCase(), l]));

  let imported = 0, updated = 0;
  const seen = new Set<string>();
  for (const c of contacts) {
    const key = c.phone || c.email;
    if (seen.has(key)) continue; seen.add(key);
    const match = (c.phone && byPhone.get(c.phone)) || (c.email && byEmail.get(c.email)) || null;
    if (match) {
      let tags: string[] = []; try { tags = JSON.parse(match.tags || "[]"); } catch {}
      let changed = false;
      for (const t of [BULK_TAG, PHONE_TAG]) if (!tags.includes(t)) { tags.push(t); changed = true; }
      const data: Record<string, unknown> = {};
      if (changed) data.tags = JSON.stringify(tags);
      if (!match.emoji) data.emoji = "❓";
      if (!match.name && c.name) data.name = c.name;
      if (Object.keys(data).length) { await db.lead.update({ where: { id: match.id }, data }).catch(() => {}); updated++; }
    } else {
      await db.lead.create({ data: {
        name: c.name, phone: c.phone, email: c.email, vertical: "partner", source: "phone-sync",
        tags: JSON.stringify([BULK_TAG, PHONE_TAG]), emoji: "❓",
      } }).catch(() => {});
      imported++;
    }
  }
  return NextResponse.json({ ok: true, imported, updated });
}
