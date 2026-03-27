import { createCentraliServerClient } from "@/lib/centrali";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let payload: Record<string, any> | undefined;
  try {
    const body = await req.json();
    if (body.payload && Object.keys(body.payload).length > 0) {
      payload = body.payload;
    }
  } catch {
    // No body or invalid JSON — invoke without payload
  }

  try {
    const client = createCentraliServerClient();
    const result = await client.triggers.invoke(id, payload ? { payload } : undefined);
    return NextResponse.json({ data: { jobId: result.data } });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to invoke trigger" },
      { status: 500 },
    );
  }
}
