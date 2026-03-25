import { NextResponse } from "next/server";
import { centrali } from "@/lib/centrali";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { collectionSlug, data } = body;
    const result = await centrali.createRecord(collectionSlug, data);
    return NextResponse.json(result.data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to create record" },
      { status: 400 },
    );
  }
}
