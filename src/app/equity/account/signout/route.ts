import { NextResponse } from "next/server";
import { destroyAccountSession } from "@/lib/equity/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Relative Location: building it from req.url behind nginx sends the browser to
// the internal socket address rather than the public host.
const seeOther = (path: string) =>
  new NextResponse(null, { status: 303, headers: { location: path } });

export async function GET() {
  await destroyAccountSession().catch(() => {});
  return seeOther("/");
}
export async function POST() {
  await destroyAccountSession().catch(() => {});
  return seeOther("/");
}
