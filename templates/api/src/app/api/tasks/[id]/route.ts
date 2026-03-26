import { createCentraliServerClient } from "@/lib/centrali";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/tasks";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = createCentraliServerClient();

  try {
    const result = await client.getRecord("tasks", id);
    if (!result?.data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ data: result.data });
  } catch (err: any) {
    if (err.status === 404 || err.message?.includes("not found")) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch task" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  if (body.status && !TASK_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${TASK_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  if (body.priority && !TASK_PRIORITIES.includes(body.priority)) {
    return NextResponse.json(
      { error: `priority must be one of: ${TASK_PRIORITIES.join(", ")}` },
      { status: 400 },
    );
  }

  const client = createCentraliServerClient();
  const data: Record<string, any> = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.status !== undefined) data.status = body.status;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.assignee !== undefined) data.assignee = body.assignee;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate;
  if (body.tags !== undefined) data.tags = body.tags;

  // Auto-manage completedAt
  if (body.status === "done" && !body.completedAt) {
    data.completedAt = new Date().toISOString();
  } else if (body.status && body.status !== "done") {
    data.completedAt = null;
  }

  try {
    const result = await client.updateRecord("tasks", id, data);
    return NextResponse.json({ data: result.data });
  } catch (err: any) {
    if (err.status === 404 || err.message?.includes("not found")) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: err.message ?? "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = createCentraliServerClient();

  try {
    const result = await client.updateRecord("tasks", id, {
      status: "cancelled",
    });
    return NextResponse.json({ data: result.data });
  } catch (err: any) {
    if (err.status === 404 || err.message?.includes("not found")) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: err.message ?? "Failed to archive task" },
      { status: 500 },
    );
  }
}
