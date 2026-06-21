import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notifyNewAccount } from "@/lib/email";

const TEMP_PASSWORD = "TEMP!234";

// God adds an assistant who runs the JV CRM as the founder's persona. They can manage
// deals, take notes (attributed to them), and text — texts still send from 1-800-MEDIGAP.
export async function POST(req: NextRequest) {
  const s = await getSession();
  const isGod = s?.role === "god" || !!s?.impersonatorUid;
  if (!s || !isGod) return NextResponse.json({ error: "God only" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase();
  const name = String(b.name || "").trim();
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  try {
    const user = await db.user.create({
      data: {
        email, name, role: "assistant", phone: String(b.phone || "").trim(),
        passwordHash: await bcrypt.hash(TEMP_PASSWORD, 10), mustChangePassword: true,
        status: "active", source: "JV assistant (founder persona)",
      },
    });
    notifyNewAccount({ name: user.name, email: user.email, role: user.role, phone: user.phone, source: user.source, id: user.id }).catch(() => {});
    return NextResponse.json({ ok: true, id: user.id, tempPassword: TEMP_PASSWORD });
  } catch {
    return NextResponse.json({ error: `A user with ${email} already exists.` }, { status: 409 });
  }
}
