import { NextResponse } from "next/server";
import { getDomainById, updateDomain, deleteDomain } from "@/lib/domain/domain-service";
import type { NotificationPreference } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const domain = await getDomainById(id);

  if (!domain) {
    return NextResponse.json({ error: "Domain not found." }, { status: 404 });
  }

  return NextResponse.json({ domain });
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
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

    const domain = await updateDomain(id, {
      registrarName: body.registrarName,
      expiryDate: body.expiryDate,
      notes: body.notes,
      tags: body.tags,
      links: body.links,
      notificationPreferences: body.notificationPreferences,
      costings: body.costings,
    });

    return NextResponse.json({ domain });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update domain." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const deleted = await deleteDomain(id);

  if (!deleted) {
    return NextResponse.json({ error: "Domain not found." }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
