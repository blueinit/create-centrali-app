import { NextResponse } from "next/server";
import { createCentraliServerClient } from "@/lib/centrali";
import { describeCentraliError, statusFor } from "@/lib/errors";

/**
 * Create a collection.
 *
 * Uses the server-side service account. A publishable key cannot do this —
 * the platform rejects every non-GET /collections request made with one, and
 * `collections:create` is not an expressible publishable-key scope. Do not
 * swap this for the browser client to "make it work"; broaden nothing.
 *
 * LOCAL DEMO: this route has no application-level access check. Add your own
 * authentication before exposing it publicly.
 */
export async function POST(request: Request) {
  let body: { name?: unknown; recordSlug?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const recordSlug = typeof body.recordSlug === "string" ? body.recordSlug.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(recordSlug)) {
    return NextResponse.json(
      {
        error:
          "recordSlug is required and must start with a letter or digit and contain only " +
          "lowercase letters, digits, hyphens or underscores",
      },
      { status: 400 },
    );
  }

  try {
    const centrali = createCentraliServerClient();
    const result = await centrali.collections.create({
      name,
      recordSlug,
      properties: [
        { name: "name", type: "string", required: true },
        { name: "description", type: "string" },
      ],
      schemaDiscoveryMode: "strict",
    });
    return NextResponse.json(result.data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: describeCentraliError(err, "create a collection") },
      { status: statusFor(err) },
    );
  }
}
