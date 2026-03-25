import { NextResponse } from "next/server";
import { createCentraliClient } from "@/lib/centrali";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const centrali = createCentraliClient();
    const result = await centrali.collections.create({
      name: body.name,
      recordSlug: body.recordSlug,
      properties: [
        { name: "name", type: "string" },
        { name: "description", type: "string" },
      ],
    } as any);
    return NextResponse.json(result.data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to create collection" },
      { status: 400 },
    );
  }
}
