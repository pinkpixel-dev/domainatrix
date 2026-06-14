import { NextResponse } from "next/server";
import { createDomain, getDomainSummaries } from "@/lib/domain/domain-service";
import { DomainConflictError } from "@/lib/domain/domain-repository";
import type { NotificationPreference } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const domains = await getDomainSummaries();

  return NextResponse.json({ domains });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      domainName?: string;
      registrarName?: string;
      expiryDate?: string;
      notes?: string;
      tags?: string[];
      links?: {
        name: string;
        url: string;
        description?: string;
      }[];
      notificationPreferences?: NotificationPreference[];
      costings?: {
        purchasePrice?: number;
        renewalCost?: number;
        currentValue?: number;
        autoRenew?: boolean;
      };
    };

    const domain = await createDomain({
      domainName: body.domainName || "",
      registrarName: body.registrarName,
      expiryDate: body.expiryDate,
      notes: body.notes,
      tags: body.tags,
      links: body.links,
      notificationPreferences: body.notificationPreferences,
      costings: body.costings,
    });

    return NextResponse.json({ domain }, { status: 201 });
  } catch (error) {
    if (error instanceof DomainConflictError) {
      return NextResponse.json(
        { error: error.message, existingId: error.existingId },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create domain." },
      { status: 400 },
    );
  }
}
