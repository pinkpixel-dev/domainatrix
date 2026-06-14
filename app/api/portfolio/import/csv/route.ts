import { NextResponse } from "next/server";
import { importPortfolioCsv } from "@/lib/domain/domain-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const csv = await request.text();
    const result = await importPortfolioCsv(csv);

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import CSV portfolio." },
      { status: 400 },
    );
  }
}
