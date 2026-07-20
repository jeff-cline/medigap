import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { extractContacts } from "@/lib/fire";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Upload a Predictive-Data CSV → an EmailList + deduped EmailContacts.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  const name = String(form?.get("name") || "").trim();
  if (!file) return NextResponse.json({ ok: false, error: "No file uploaded (field 'file')." }, { status: 400 });

  const text = await file.text();
  const { total, contacts } = extractContacts(text);
  if (!total) return NextResponse.json({ ok: false, error: "No rows parsed — is this the query_run CSV format?" }, { status: 400 });

  // Dedupe by person hash, else by business/personal email.
  const seen = new Set<string>();
  const unique = contacts.filter((c) => {
    const key = (c.raw["sha256_lc_hem"] || c.business || c.personal || `${c.firstName}|${c.lastName}`).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const sendable = unique.filter((c) => c.business).length; // default field = business_email

  const list = await db.emailList.create({
    data: { name: name || (file.name || "list").replace(/\.csv$/i, ""), fileName: file.name || "", total: unique.length, sendable },
  });

  // Insert in chunks (SQLite/Postgres param limits).
  const rows = unique.map((c) => ({
    listId: list.id, email: "", business: c.business, personal: c.personal,
    firstName: c.firstName, lastName: c.lastName, company: c.company, phones: c.phones.join(","), raw: JSON.stringify(c.raw),
  }));
  for (let i = 0; i < rows.length; i += 500) {
    await db.emailContact.createMany({ data: rows.slice(i, i + 500) });
  }

  const withPersonal = unique.filter((c) => c.personal).length;
  return NextResponse.json({ ok: true, listId: list.id, total: unique.length, business: sendable, personal: withPersonal });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  const lists = await db.emailList.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ ok: true, lists });
}
