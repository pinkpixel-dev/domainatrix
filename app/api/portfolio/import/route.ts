import { NextResponse } from "next/server";
import { importPortfolio } from "@/lib/domain/domain-service";
import type { PortfolioExport } from "@/lib/domain/domain-repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as PortfolioExport;
    const result = await importPortfolio(payload);

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import portfolio." },
      { status: 400 },
    );
  }
}
