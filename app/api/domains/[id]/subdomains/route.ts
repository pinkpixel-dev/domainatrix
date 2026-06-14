import { NextResponse } from "next/server";
import { discoverSubdomains, getSubdomains } from "@/lib/domain/domain-service";

export const dynamic = "force-dynamic";

// Discovery can take several seconds (crt.sh + DNS resolution)
export const maxDuration = 30;

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/domains/[id]/subdomains — list saved subdomains */
export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const subdomains = await getSubdomains(id);
  return NextResponse.json({ subdomains });
}

/** POST /api/domains/[id]/subdomains — run discovery and save results */
export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    const result = await discoverSubdomains(id);

    return NextResponse.json(
      {
        subdomains: result.subdomains,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discovery failed.";

    if (message === "Domain not found.") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
