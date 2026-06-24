import { NextResponse } from "next/server";
import { buildProformaWorkbook } from "@/lib/mortgage-xlsx";

export const runtime = "nodejs";

// Public download of the formatted Mortgage Plus proforma workbook (.xlsx).
export async function GET() {
  const buf = await buildProformaWorkbook();
  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="MortgagePlus-Proforma.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
