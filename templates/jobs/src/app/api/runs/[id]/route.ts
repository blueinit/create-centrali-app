import { createCentraliServerClient } from "@/lib/centrali";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const client = createCentraliServerClient();
    const result = await client.runs.get(id);
    return NextResponse.json({ data: result.data });
  } catch (err: any) {
    if (err.status === 404 || err.message?.includes("not found")) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch run" },
      { status: 500 },
    );
  }
}
