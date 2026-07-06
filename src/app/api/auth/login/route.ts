import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return NextResponse.json({ error: "Email and password required." }, { status: 400 });
  const res = await login(String(email), String(password));
  if ("error" in res) return NextResponse.json({ error: res.error }, { status: 401 });
  return NextResponse.json({ ok: true, mustChangePassword: res.mustChangePassword, role: res.role });
}
