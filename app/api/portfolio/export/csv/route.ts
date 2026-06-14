import { NextResponse } from "next/server";
import { exportPortfolioCsv } from "@/lib/domain/domain-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const csv = await exportPortfolioCsv();
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="domainatrix-export-${date}.csv"`,
    },
  });
}
