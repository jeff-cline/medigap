import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hashFor } from "@/lib/mammo-auth";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://mammo.express";

// God-only. Two ways to onboard a manager:
//   create  — set their password yourself and hand it over
//   invite  — email a one-time link so they set their own
// The invite route is preferable: a password you typed is a password that has
// been in a chat window, an email and a clipboard.
export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "god") return NextResponse.json({ error: "God only" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const action = String(b.action ?? "");
  const email = String(b.email ?? "").trim().toLowerCase();
  const name = String(b.name ?? "").trim().slice(0, 120);

  if (action === "create") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const password = String(b.password ?? "");
    if (password.length < 9) {
      return NextResponse.json({ error: "Password must be at least 9 characters." }, { status: 400 });
    }
    const existing = await db.mammoManager.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "A manager with that email already exists." }, { status: 409 });

    await db.mammoManager.create({ data: { email, name, passwordHash: await hashFor(password) } });
    return NextResponse.json({ ok: true });
  }

  if (action === "invite") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const token = randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + 7 * 864e5);
    await db.mammoInvite.create({ data: { token, email, name, expiresAt } });

    const url = `${SITE}/invite/${token}`;
    sendEmail(
      email,
      "Your Mammo Express manager account",
      [
        name ? `Hi ${name},` : "Hello,",
        "You have been given access to review Mammo Express leads.",
        `<a href="${url}">Set your password and sign in</a>`,
        "This link works once and expires in 7 days.",
      ].join("<br><br>"),
    ).catch(() => {});

    // Returned so the owner can hand the link over directly if mail is slow.
    return NextResponse.json({ ok: true, url });
  }

  if (action === "deactivate") {
    await db.mammoManager.update({ where: { id: String(b.id) }, data: { active: false } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  if (action === "reactivate") {
    await db.mammoManager.update({ where: { id: String(b.id) }, data: { active: true } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  if (action === "delete") {
    await db.mammoManager.delete({ where: { id: String(b.id) } }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
