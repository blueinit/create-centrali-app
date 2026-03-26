import { auth } from "@clerk/nextjs/server";
import { createCentraliServerClient } from "@/lib/centrali";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId, name } = await req.json();
  if (!orgId || !name) {
    return NextResponse.json(
      { error: "orgId and name are required" },
      { status: 400 },
    );
  }

  const client = createCentraliServerClient();

  // Verify the user belongs to this organization
  const membership = await client.queryRecords("members", {
    "data.orgId": orgId,
    "data.userId": userId,
    pageSize: 1,
  });
  if (!membership?.data?.length) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await client.createRecord("projects", {
      orgId,
      name,
      status: "active",
      description: "",
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json(result.data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to create project" },
      { status: 500 },
    );
  }
}
