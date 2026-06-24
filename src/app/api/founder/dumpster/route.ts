import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { importBulk, sendBulk, bulkStats, bulkLeads } from "@/lib/dumpster";
import { engineReady } from "@/lib/founder";

const ALLOWED = ["god", "assistant"];

export async function POST(req: NextRequest) {
  const s = await getSession();
  const isGod = s?.role === "god" || !!s?.impersonatorUid;
  if (!s || (!isGod && !ALLOWED.includes(s.role))) return NextResponse.json({ error: "Founder / assistant only" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");

  if (action === "search") {
    const q = b.q ? String(b.q) : undefined;
    const [stats, leads] = await Promise.all([bulkStats(q), bulkLeads(q)]);
    return NextResponse.json({ ok: true, stats, leads });
  }

  if (action === "process") {
    const text = String(b.text || "");
    if (!text.trim()) return NextResponse.json({ error: "Paste some emails or phone numbers first." }, { status: 400 });
    const r = await importBulk(text);
    const stats = await bulkStats();
    return NextResponse.json({ ok: true, ...r, stats });
  }

  if (action === "send") {
    const channel = b.channel === "sms" ? "sms" : "email";
    if (channel === "email") {
      const engine = String(b.engine || "");
      if (!engine) return NextResponse.json({ error: "Pick an email engine." }, { status: 400 });
      if (!(await engineReady(engine))) return NextResponse.json({ ok: false, error: `The “${engine}” engine isn’t connected.` }, { status: 200 });
      if (!String(b.subject || "").trim() || !String(b.html || "").trim()) return NextResponse.json({ error: "Subject and body are required." }, { status: 400 });
    } else if (!String(b.message || "").trim()) {
      return NextResponse.json({ error: "Message text is required." }, { status: 400 });
    }
    const r = await sendBulk({
      channel, q: b.q ? String(b.q) : undefined, engine: String(b.engine || ""),
      subject: String(b.subject || ""), html: String(b.html || ""), text: String(b.text || "") || undefined,
      message: String(b.message || ""), templateId: b.templateId ? String(b.templateId) : undefined, templateName: String(b.templateName || ""),
    });
    return NextResponse.json(r);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
