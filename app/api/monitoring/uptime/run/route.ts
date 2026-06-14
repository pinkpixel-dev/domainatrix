import { NextResponse } from "next/server";
import { runPortfolioUptimeChecks } from "@/lib/monitoring/uptime-service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await runPortfolioUptimeChecks();
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run uptime checks." },
      { status: 500 },
    );
  }
}
