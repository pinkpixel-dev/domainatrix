import { NextResponse } from "next/server";
import { createTestNotification } from "@/lib/notifications/notification-service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const notification = await createTestNotification();

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create test notification." },
      { status: 400 },
    );
  }
}
