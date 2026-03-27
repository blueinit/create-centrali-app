import { createCentraliServerClient } from "@/lib/centrali";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sp = req.nextUrl.searchParams;

  const page = parseInt(sp.get("page") ?? "1", 10) || 1;
  const limit = Math.min(100, parseInt(sp.get("limit") ?? "20", 10) || 20);
  const status = sp.get("status") || undefined;

  try {
    const client = createCentraliServerClient();
    const result = await client.runs.listByFunction(id, { page, limit, status: status as any });
    return NextResponse.json(result.data ?? { data: [], meta: { page, pageSize: limit, total: 0 } });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch runs" },
      { status: 500 },
    );
  }
}
