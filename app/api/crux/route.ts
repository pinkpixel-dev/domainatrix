import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type CruxResponse =
  | { success: false; error: string }
  | { success: true; hasData: false; message: string }
  | {
      success: true;
      hasData: true;
      domain: string;
      performance: {
        largestContentfulPaint: number | null;
        cumulativeLayoutShift: number | null;
        interactionToNextPaint: number | null;
      };
    };

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain");

  if (!domain) {
    return NextResponse.json<CruxResponse>(
      { success: false, error: "Domain is required" },
      { status: 400 },
    );
  }

  const CRUX_API_KEY = process.env.CRUX_API_KEY;

  if (!CRUX_API_KEY) {
    return NextResponse.json<CruxResponse>(
      { success: false, error: "CrUX API key not configured" },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(
      `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${CRUX_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: `https://${domain}` }),
      },
    );

    if (!res.ok) {
      // Google returns 404 when the domain doesn't have enough Chrome traffic data
      if (res.status === 404) {
        return NextResponse.json<CruxResponse>({
          success: true,
          hasData: false,
          message: "Not enough real-world Chrome data for this domain yet.",
        });
      }
      throw new Error(`CrUX API responded with ${res.status}`);
    }

    const data = await res.json();
    const metrics = data.record?.metrics ?? {};

    return NextResponse.json<CruxResponse>({
      success: true,
      hasData: true,
      domain,
      performance: {
        largestContentfulPaint: metrics.largest_contentful_paint?.percentiles?.p75 ?? null,
        cumulativeLayoutShift: metrics.cumulative_layout_shift?.percentiles?.p75 ?? null,
        interactionToNextPaint: metrics.interaction_to_next_paint?.percentiles?.p75 ?? null,
      },
    });
  } catch (error) {
    console.error("CrUX fetch error:", error);
    return NextResponse.json<CruxResponse>(
      { success: false, error: "Failed to fetch CrUX data" },
      { status: 500 },
    );
  }
}
