import { NextRequest, NextResponse } from "next/server";
import { verifyCoreKey } from "@/lib/corekeys";
import { upsertJvLead } from "@/lib/jv";
import { appendLeadBackground } from "@/lib/predictivedata";

export const runtime = "nodejs";

// CORE API — partners push a lead into the Core. Auth: x-core-key + x-core-secret
// (scope lead:create). The lead lands in the shared CRM, is enriched (append), and
// carries the partner's name as source + any creatorRef for attribution.
export async function POST(req: NextRequest) {
  const key = await verifyCoreKey(req, "lead:create");
  if (!key) return NextResponse.json({ ok: false, error: "Invalid CORE API credentials or missing lead:create scope." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim();
  const phone = String(b.phone || "").trim();
  if (!name && !email && !phone) return NextResponse.json({ ok: false, error: "Provide at least a name, email or phone." }, { status: 400 });

  const lead = await upsertJvLead({
    name, email, phone,
    zip: String(b.zip || "").trim(), state: String(b.state || "").trim(),
    source: `API · ${key.name || "partner"}`,
    creatorRef: String(b.creatorRef || "").trim(),
    notes: String(b.notes || "").trim(),
  });
  appendLeadBackground(lead.id);

  return NextResponse.json({ ok: true, leadId: lead.id });
}
