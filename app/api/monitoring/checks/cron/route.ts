import { NextResponse } from "next/server";
import { getCronAuthStatus } from "@/lib/monitoring/cron-auth";
import { runPortfolioChecks } from "@/lib/monitoring/domain-check-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runScheduledChecks(request);
}

export async function POST(request: Request) {
  return runScheduledChecks(request);
}

async function runScheduledChecks(request: Request) {
  const auth = getCronAuthStatus(request.headers, process.env.CRON_SECRET);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const result = await runPortfolioChecks();
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run scheduled checks." },
      { status: 500 },
    );
  }
}
