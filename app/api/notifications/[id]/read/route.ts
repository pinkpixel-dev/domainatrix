import { NextResponse } from "next/server";
import { markNotificationRead } from "@/lib/notifications/notification-service";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const marked = await markNotificationRead(id);

  if (!marked) {
    return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
