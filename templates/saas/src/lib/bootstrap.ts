import { createCentraliServerClient } from "./centrali";

interface WorkspaceResult {
  orgId: string | null;
  isNew: boolean;
  error: string | null;
}

/**
 * Ensures the signed-in user has an organization, membership, and sample project.
 * Called from the dashboard server component on every load — returns immediately
 * if the user already has a membership, or creates the full workspace on first visit.
 *
 * Failure-tolerant: never throws. If something goes wrong, returns an error
 * message so the dashboard can show a friendly state instead of crashing.
 *
 * Self-healing: if a prior attempt partially failed (e.g., org created but
 * membership creation failed), subsequent calls will complete the setup.
 */
export async function ensureWorkspace(
  userId: string,
): Promise<WorkspaceResult> {
  try {
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

    // Project seed is non-critical — don't fail the whole bootstrap if it errors
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
  } catch (err: any) {
    console.error("[ensureWorkspace] Bootstrap failed:", err.message ?? err);
    return { orgId: null, isNew: false, error: err.message ?? "Bootstrap failed" };
  }
}
