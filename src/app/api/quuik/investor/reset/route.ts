import { NextRequest, NextResponse } from "next/server";
import { isSpamSubmission } from "@/lib/spam-guard";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Self-service password reset — issues a fresh temporary password to the account email.
// Always returns ok (never reveals whether an email is registered).
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (isSpamSubmission(req, { honeypot: b._hp || b.website2, texts: [b.name, b.firstName, b.lastName, b.business, b.company, b.moneyWord, b.word, b.subject, b.message], email: b.email, phone: b.phone }).blocked) return NextResponse.json({ ok: true });
  const email = String(b.email || "").trim().toLowerCase().slice(0, 160);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ ok: true });

  const user = await db.user.findUnique({ where: { email } }).catch(() => null);
  if (user) {
    const temp = "RS-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(temp, 10), mustChangePassword: true } }).catch(() => {});
    sendEmail(email, "Your R0cketShip Holdings password reset",
      `<div style="font-family:Georgia,serif;font-size:15px;color:#111">
        <p>A password reset was requested for your R0cketShip Holdings investor account.</p>
        <table style="border-collapse:collapse;font-family:Arial,sans-serif">
          <tr><td style="padding:4px 14px 4px 0;color:#555">Log in</td><td style="font-weight:700">https://quuik.com/investor</td></tr>
          <tr><td style="padding:4px 14px 4px 0;color:#555">Temporary password</td><td style="font-weight:700">${temp}</td></tr>
        </table>
        <p style="color:#555;font-size:13px">You'll set a new password on login. If you didn't request this, you can ignore this email.</p>
      </div>`, "zapmail").catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
