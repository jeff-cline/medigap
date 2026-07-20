import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enrollRecipients } from "@/lib/fire-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stepSchema = z.object({
  dayOffset: z.number().int().min(0),
  mode: z.enum(["text", "html"]).default("text"),
  subject: z.string().default(""),
  body: z.string().default(""),
  html: z.string().default(""),
});
const schema = z.object({
  name: z.string().min(1),
  listId: z.string().min(1),
  emailField: z.enum(["business", "personal", "personal_business"]).default("business"),
  perHour: z.number().int().min(1).max(5000).default(20),
  tracking: z.boolean().default(false),
  sendStart: z.string().default("09:00"),
  sendEnd: z.string().default("17:00"),
  sendDays: z.string().default("mon,tue,wed,thu,fri"),
  steps: z.array(stepSchema).min(1),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid input." }, { status: 400 });
  const d = parsed.data;

  const list = await db.emailList.findUnique({ where: { id: d.listId } });
  if (!list) return NextResponse.json({ ok: false, error: "List not found." }, { status: 404 });

  const camp = await db.emailCampaign.create({
    data: {
      name: d.name, listId: d.listId, emailField: d.emailField, perHour: d.perHour, tracking: d.tracking,
      sendStart: d.sendStart, sendEnd: d.sendEnd, sendDays: d.sendDays, status: "draft",
      steps: { create: d.steps.map((s, i) => ({ order: i, dayOffset: s.dayOffset, mode: s.mode, subject: s.subject, body: s.body, html: s.html })) },
    },
  });
  const enrolled = await enrollRecipients(camp.id);
  return NextResponse.json({ ok: true, campaignId: camp.id, enrolled });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  const campaigns = await db.emailCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ ok: true, campaigns });
}
