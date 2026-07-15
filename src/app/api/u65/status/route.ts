import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isBillable, BILLABLE_CENTS } from "@/lib/u65";

const emptyTwiml = () =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
    headers: { "Content-Type": "text/xml" },
  });

// Twilio POSTs here when the U65 <Dial> completes. DialCallDuration = the transfer
// leg only (buyer answer -> hangup), which is exactly the billable clock.
export async function POST(req: NextRequest) {
  const u65Id = new URL(req.url).searchParams.get("u65") || "";
  const form = await req.formData().catch(() => null);
  const dialSec = parseInt(String(form?.get("DialCallDuration") || form?.get("CallDuration") || "0"), 10);
  if (u65Id) {
    const billable = isBillable(dialSec);
    await db.u65Call
      .update({
        where: { id: u65Id },
        data: { transferSec: dialSec, billable, billableCents: billable ? BILLABLE_CENTS : 0 },
      })
      .catch(() => {});
  }
  return emptyTwiml();
}
