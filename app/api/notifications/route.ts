import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/notifications/notification-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const notifications = await getNotifications();

  return NextResponse.json({ notifications });
}
