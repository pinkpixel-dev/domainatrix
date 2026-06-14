import { NextResponse } from "next/server";
import { enrichDomain } from "@/lib/domain/domain-service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    const { domain, errors } = await enrichDomain(id);

    return NextResponse.json(
      { domain, errors: errors.length > 0 ? errors : undefined },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Enrichment failed.";

    if (message === "Domain not found.") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
