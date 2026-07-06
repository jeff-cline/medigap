import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EXIT } from "@/lib/exit";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
const GOD = "jeff.cline@me.com";

// "Advertise with us" — save the inquiry to the Core (under exitoptimization) and notify god.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const firstName = String(b.firstName || "").trim(), lastName = String(b.lastName || "").trim();
  const email = String(b.email || "").trim(), phone = String(b.phone || "").trim();
  if (!firstName || !email) return NextResponse.json({ error: "First name and email are required." }, { status: 400 });

  const site = await db.site.findUnique({ where: { hostname: EXIT.siteHost } }).catch(() => null);
  const fields = {
    city: b.city, state: b.state, business: b.businessName, yearsToExit: b.yearsUntilExit,
    exitGoal: b.exitGoal, employees: b.employees, ebitda: b.ebitda,
  };
  await db.lead.create({
    data: {
      name: `${firstName} ${lastName}`.trim(), email, phone, city: String(b.city || ""), state: String(b.state || ""),
      vertical: "exit", source: "exitoptimization", siteId: site?.id,
      tags: JSON.stringify(["exit", "advertise-with-us", ...Object.entries(fields).filter(([, v]) => v).map(([k, v]) => `${k}:${String(v).slice(0, 40)}`)]),
    },
  }).catch(() => {});

  // notify god (best-effort)
  const body = [
    `New advertise/exit inquiry from exitoptimization.com`, ``,
    `First name: ${firstName}`, `Last name: ${lastName}`, `City: ${b.city || ""}`, `State: ${b.state || ""}`,
    `Business: ${b.businessName || ""}`, `Years until exit: ${b.yearsUntilExit || ""}`, `Estimated exit goal: ${b.exitGoal || ""}`,
    `Employees: ${b.employees || ""}`, `Current EBITDA: ${b.ebitda || ""}`, `Email: ${email}`, `Phone: ${phone}`,
  ].join("\n");
  await sendEmail(GOD, "Business Exit Optimization", body.replace(/\n/g, "<br>"), "google_workspace", { text: body }).catch(() => {});
  return NextResponse.json({ ok: true });
}
