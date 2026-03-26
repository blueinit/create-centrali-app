import { createCentraliServerClient } from "@/lib/centrali";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/tasks";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const client = createCentraliServerClient();

  const params: Record<string, any> = {};

  // Filters
  const status = sp.get("status");
  if (status) {
    if (status.includes(",")) {
      params["data.status[in]"] = status;
    } else {
      params["data.status"] = status;
    }
  } else {
    // Exclude cancelled by default
    params["data.status[nin]"] = "cancelled";
  }

  const priority = sp.get("priority");
  if (priority) {
    if (priority.includes(",")) {
      params["data.priority[in]"] = priority;
    } else {
      params["data.priority"] = priority;
    }
  }

  const assignee = sp.get("assignee");
  if (assignee) params["data.assignee"] = assignee;

  const dueBefore = sp.get("dueBefore");
  if (dueBefore) params["data.dueDate[lte]"] = dueBefore;

  const dueAfter = sp.get("dueAfter");
  if (dueAfter) params["data.dueDate[gte]"] = dueAfter;

  // Search
  const search = sp.get("search");
  if (search) params.search = search;

  const searchField = sp.get("searchField");
  if (searchField) {
    params.searchField = searchField.split(",").map((f) => `data.${f}`).join(",");
  }

  // Pagination
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "20", 10) || 20));
  params.page = page;
  params.pageSize = pageSize;

  // Sort
  params.sort = sp.get("sort") ?? "-createdAt";

  // Total count
  if (sp.get("includeTotal") === "true") {
    params.includeTotal = true;
  }

  try {
    const result = await client.queryRecords("tasks", params);
    return NextResponse.json({
      data: result.data ?? [],
      page,
      pageSize,
      ...(result.meta?.total != null ? { total: result.meta.total } : {}),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.title?.trim()) {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 },
    );
  }

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
  const now = new Date().toISOString();

  const data: Record<string, any> = {
    title: body.title.trim(),
    status: body.status ?? "todo",
    priority: body.priority ?? "medium",
    createdAt: now,
  };

  if (body.description) data.description = body.description;
  if (body.assignee) data.assignee = body.assignee;
  if (body.dueDate) data.dueDate = body.dueDate;
  if (body.tags) data.tags = body.tags;

  if (data.status === "done") {
    data.completedAt = now;
  }

  try {
    const result = await client.createRecord("tasks", data);
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to create task" },
      { status: 500 },
    );
  }
}
