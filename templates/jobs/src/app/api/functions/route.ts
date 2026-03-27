import { createCentraliServerClient } from "@/lib/centrali";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = createCentraliServerClient();
    const result = await client.functions.list();
    return NextResponse.json({ data: result.data ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch functions" },
      { status: 500 },
    );
  }
}
