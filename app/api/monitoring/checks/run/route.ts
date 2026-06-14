import { NextResponse } from "next/server";
import { runPortfolioChecks } from "@/lib/monitoring/domain-check-service";

export async function POST() {
  try {
    const result = await runPortfolioChecks();
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run domain checks." },
      { status: 500 },
    );
  }
}
