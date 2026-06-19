import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Local asset store (single-server). Swap for S3/R2 in prod by changing this handler only.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const label = String(form.get("label") || "");
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const safe = (file.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
  const fname = `${session.uid.slice(0, 6)}-${safe}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fname), bytes);
  const url = `/uploads/${fname}`;
  const kind = file.type.startsWith("video") ? "video" : "image";
  const asset = await db.asset.create({ data: { kind, url, label, ownerId: session.uid } });
  return NextResponse.json({ ok: true, url, id: asset.id });
}
