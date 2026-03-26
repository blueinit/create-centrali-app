import { auth } from "@clerk/nextjs/server";
import { createCentraliServerClient } from "@/lib/centrali";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId, userId } = await req.json();
  if (!orgId || !userId) {
    return NextResponse.json(
      { error: "orgId and userId are required" },
      { status: 400 },
    );
  }

  const client = createCentraliServerClient();

  // Verify the current user belongs to this organization
  const membership = await client.queryRecords("members", {
    "data.orgId": orgId,
    "data.userId": currentUserId,
    pageSize: 1,
  });
  if (!membership?.data?.length) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const now = new Date().toISOString();
    const result = await client.createRecord("members", {
      orgId,
      userId,
      role: "member",
      status: "invited",
      invitedAt: now,
      createdAt: now,
    });
    return NextResponse.json(result.data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to invite member" },
      { status: 500 },
    );
  }
}
