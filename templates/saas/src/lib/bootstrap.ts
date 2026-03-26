import { createCentraliServerClient } from "./centrali";

interface WorkspaceResult {
  orgId: string | null;
  isNew: boolean;
  error: string | null;
}

/**
 * Core bootstrap logic. Creates org + membership + sample project if the user
 * doesn't already have one. Self-healing for partial prior failures.
 */
async function tryBootstrap(userId: string): Promise<WorkspaceResult> {
  const client = createCentraliServerClient();

  // Fast path: user already has a membership
  const membersRes = await client.queryRecords("members", {
    "data.userId": userId,
    pageSize: 1,
  });

  const members = membersRes?.data ?? [];
  if (members.length > 0) {
    return { orgId: members[0].data.orgId, isNew: false, error: null };
  }

  const now = new Date().toISOString();

  // Check if an org already exists for this user (partial prior run)
  const existingOrgRes = await client.queryRecords("organizations", {
    "data.ownerId": userId,
    pageSize: 1,
  });
  const existingOrg = existingOrgRes?.data?.[0];

  let orgId: string;
  if (existingOrg) {
    orgId = existingOrg.id;
  } else {
    const orgRes = await client.createRecord("organizations", {
      name: "My Organization",
      plan: "free",
      ownerId: userId,
      createdAt: now,
    });
    orgId = orgRes.data.id;
  }

  // Re-check: another request may have created a membership in parallel
  const recheck = await client.queryRecords("members", {
    "data.userId": userId,
    pageSize: 1,
  });
  if (recheck?.data?.length) {
    return { orgId: recheck.data[0].data.orgId, isNew: false, error: null };
  }

  await client.createRecord("members", {
    orgId,
    userId,
    role: "owner",
    status: "active",
    createdAt: now,
  });

  // Project seed is non-critical
  try {
    await client.createRecord("projects", {
      orgId,
      name: "Getting Started",
      status: "active",
      description: "A sample project to get you started.",
      createdAt: now,
    });
  } catch {
    // Swallow — user can create projects manually
  }

  return { orgId, isNew: true, error: null };
}

/**
 * Ensures the signed-in user has an organization, membership, and sample project.
 * Retries once on failure before giving up. Never throws.
 */
export async function ensureWorkspace(
  userId: string,
): Promise<WorkspaceResult> {
  try {
    return await tryBootstrap(userId);
  } catch (err: any) {
    console.error("[ensureWorkspace] First attempt failed, retrying:", err.message ?? err);
  }

  // One retry — handles transient network/validation errors
  try {
    return await tryBootstrap(userId);
  } catch (err: any) {
    console.error("[ensureWorkspace] Retry failed:", err.message ?? err);
    return { orgId: null, isNew: false, error: err.message ?? "Bootstrap failed" };
  }
}
