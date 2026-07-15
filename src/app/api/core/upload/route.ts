import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";
import { db } from "@/lib/db";
import { verifyCoreKey } from "@/lib/corekeys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://medigap.plus";

// CORE API — upload a file via the Core (stored under public/uploads, served by nginx and kept
// across deploys). Auth: x-core-key + x-core-secret, scope upload:write.
// Send multipart/form-data with field `file` (+ optional `label`). Returns { ok, url, id }.
export async function POST(req: NextRequest) {
  const key = await verifyCoreKey(req, "upload:write");
  if (!key) return NextResponse.json({ ok: false, error: "Invalid CORE API credentials or missing upload:write scope." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  const label = String(form?.get("label") || "");
  if (!file) return NextResponse.json({ ok: false, error: "No file — send multipart/form-data with a 'file' field." }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const safe = (file.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
  const fname = `${key.id.slice(0, 6)}-${randomBytes(4).toString("hex")}-${safe}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fname), bytes);

  const url = `/uploads/${fname}`;
  const type = file.type || "";
  const kind = type.startsWith("video") ? "video" : type.startsWith("image") ? "image" : "file";
  const asset = await db.asset.create({ data: { kind, url, label, ownerId: key.ownerId || "" } }).catch(() => null);
  return NextResponse.json({ ok: true, url: `${BASE}${url}`, id: asset?.id || null });
}
