import { NextRequest, NextResponse } from "next/server";
import { getSession, isGod } from "@/lib/auth";
import { listNodes, createNode, updateNode, deleteNode, moveNode } from "@/lib/static/store";

async function guard() {
  const s = await getSession();
  return isGod(s) ? null : NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export async function GET() {
  const bad = await guard(); if (bad) return bad;
  return NextResponse.json({ nodes: await listNodes() });
}

export async function POST(req: NextRequest) {
  const bad = await guard(); if (bad) return bad;
  const body = await req.json().catch(() => ({} as any));
  switch (body.action) {
    case "create": return NextResponse.json(await createNode({ word: String(body.word ?? "New Money Word"), parentId: body.parentId ?? null }));
    case "update": return NextResponse.json(await updateNode(String(body.id), body.patch ?? {}));
    case "move":   await moveNode(String(body.id), body.dir === "down" ? "down" : "up"); return NextResponse.json({ ok: true });
    case "delete": await deleteNode(String(body.id)); return NextResponse.json({ ok: true });
    default:       return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
