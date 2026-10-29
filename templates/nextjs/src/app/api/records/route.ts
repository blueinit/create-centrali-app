import { NextResponse } from "next/server";
import { createCentraliServerClient } from "@/lib/centrali";
import { describeCentraliError, statusFor } from "@/lib/errors";

/**
 * Create a record in a collection.
 *
 * Uses the same server-side service account as the rest of this template, so
 * there is one credential path to configure and reason about.
 *
 * LOCAL DEMO: this route has no application-level access check. Add your own
 * authentication before exposing it publicly.
 */
export async function POST(request: Request) {
  let body: { collectionSlug?: unknown; data?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const collectionSlug =
    typeof body.collectionSlug === "string" ? body.collectionSlug.trim() : "";

  if (!collectionSlug) {
    return NextResponse.json({ error: "collectionSlug is required" }, { status: 400 });
  }
  if (typeof body.data !== "object" || body.data === null || Array.isArray(body.data)) {
    return NextResponse.json({ error: "data must be an object" }, { status: 400 });
  }

  try {
    const centrali = createCentraliServerClient();
    const result = await centrali.createRecord(collectionSlug, body.data as Record<string, any>);
    return NextResponse.json(result.data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: describeCentraliError(err, "create a record") },
      { status: statusFor(err) },
    );
  }
}
