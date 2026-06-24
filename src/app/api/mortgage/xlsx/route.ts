import { NextResponse } from "next/server";
import { buildAddWorkbook } from "@/lib/addmortgage-xlsx";

export const runtime = "nodejs";

// Public download of the AD&D Mortgage insurance proforma workbook (.xlsx) —
// monthly (120 mo) + annual pivot (10 yr) + chart data + assumptions.
export async function GET() {
  const buf = await buildAddWorkbook();
  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="MortgagePlus-ADD-Proforma.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
