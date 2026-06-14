import { NextResponse } from "next/server";
import { getRegistrarSuggestions } from "@/lib/domain/domain-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const registrars = await getRegistrarSuggestions();

  return NextResponse.json({ registrars });
}
