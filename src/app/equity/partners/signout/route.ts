import { NextResponse } from "next/server";
import { destroyPartnerSession } from "@/lib/equity/partner-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Relative Location on purpose. Building it from req.url behind nginx sends the
// browser to the internal socket address instead of the public host.
const seeOther = (path: string) =>
  new NextResponse(null, { status: 303, headers: { location: path } });

export async function GET() {
  await destroyPartnerSession().catch(() => {});
  return seeOther("/partners");
}

export async function POST() {
  await destroyPartnerSession().catch(() => {});
  return seeOther("/partners");
}
