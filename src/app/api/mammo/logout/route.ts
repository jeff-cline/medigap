import { NextResponse } from "next/server";
import { destroyMammoSession } from "@/lib/mammo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await destroyMammoSession();
  return NextResponse.redirect(new URL("/", "https://mammo.express"), 303);
}
