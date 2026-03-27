import { createCentraliServerClient } from "@/lib/centrali";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const functionId = req.nextUrl.searchParams.get("functionId") || undefined;

  try {
    const client = createCentraliServerClient();
    const options: Record<string, any> = { includeHealth: true };
    if (functionId) options.functionId = functionId;

    const result = await client.triggers.listAll(options);
    return NextResponse.json({ data: result.data ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch triggers" },
      { status: 500 },
    );
  }
}
