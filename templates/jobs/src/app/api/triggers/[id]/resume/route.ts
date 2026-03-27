import { createCentraliServerClient } from "@/lib/centrali";
import { NextResponse } from "next/server";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const client = createCentraliServerClient();
    const result = await client.triggers.resumeTrigger(id);
    return NextResponse.json({ data: result.data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to resume trigger" },
      { status: 500 },
    );
  }
}
