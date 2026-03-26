import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ensureWorkspace } from "@/lib/bootstrap";
import { createCentraliServerClient } from "@/lib/centrali";
import Link from "next/link";
import { CreateProjectForm } from "./CreateProjectForm";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { orgId, isNew, error } = await ensureWorkspace(userId);

  if (error || !orgId) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <p className="font-medium">Something went wrong setting up your workspace.</p>
          <p className="mt-1">
            Make sure your Centrali credentials are configured in{" "}
            <code className="rounded bg-yellow-100 px-1">.env.local</code> and
            that you&apos;ve run{" "}
            <code className="rounded bg-yellow-100 px-1">npm run setup</code>.
          </p>
          <p className="mt-2 text-xs text-yellow-600">
            Try refreshing the page. If the problem persists, check the server
            logs.
          </p>
        </div>
      </div>
    );
  }

  let org: any = null;
  let memberCount = 0;
  let projects: any[] = [];

  try {
    const client = createCentraliServerClient();

    const [orgRes, membersRes, projectsRes] = await Promise.all([
      client.queryRecords("organizations", {
        "data.ownerId": userId,
        pageSize: 1,
      }),
      client.queryRecords("members", {
        "data.orgId": orgId,
      }),
      client.queryRecords("projects", {
        "data.orgId": orgId,
        sort: "-createdAt",
      }),
    ]);

    org = orgRes?.data?.[0];
    memberCount = membersRes?.data?.length ?? 0;
    projects = projectsRes?.data ?? [];
  } catch {
    // Queries failed — render with defaults rather than crashing
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      {isNew && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Welcome! Your workspace is ready. We created a &ldquo;Getting
          Started&rdquo; project for you — feel free to rename it or create
          your own.
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">
          {org?.data?.name ?? "My Organization"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {memberCount} member{memberCount !== 1 ? "s" : ""} &middot;{" "}
          {org?.data?.plan ?? "free"} plan
        </p>
        <Link
          href="/dashboard/settings"
          className="mt-2 inline-block text-sm text-blue-600 no-underline hover:underline"
        >
          Manage team &rarr;
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
        <CreateProjectForm orgId={orgId} />
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
          <p className="text-gray-500">No projects yet — create your first one.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((project: any) => (
            <div
              key={project.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <p className="font-medium text-gray-900">{project.data.name}</p>
              {project.data.description && (
                <p className="mt-1 text-sm text-gray-500">
                  {project.data.description}
                </p>
              )}
              <span className="mt-2 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {project.data.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
