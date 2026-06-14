import { NextResponse } from "next/server";
import { exportPortfolio } from "@/lib/domain/domain-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await exportPortfolio();
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="domainatrix-export-${date}.json"`,
    },
  });
}
