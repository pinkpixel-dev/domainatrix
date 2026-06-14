import { NextResponse } from "next/server";
import { retryUnsentNotifications } from "@/lib/notifications/notification-service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await retryUnsentNotifications();
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to retry notification delivery." },
      { status: 500 },
    );
  }
}
