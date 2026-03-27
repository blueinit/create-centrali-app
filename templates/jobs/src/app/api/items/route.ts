import { createCentraliServerClient } from "@/lib/centrali";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.title?.trim()) {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 },
    );
  }

  const client = createCentraliServerClient();

  const data: Record<string, any> = {
    title: body.title.trim(),
    type: body.type ?? "order",
    status: "pending",
    priority: body.priority ?? "normal",
    createdAt: new Date().toISOString(),
  };

  if (body.payload) data.payload = body.payload;

  try {
    const result = await client.createRecord("processed-items", data);
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to create item" },
      { status: 500 },
    );
  }
}
