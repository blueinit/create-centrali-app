import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ensureWorkspace } from "@/lib/bootstrap";
import { createCentraliServerClient } from "@/lib/centrali";
import Link from "next/link";
import { CreateProjectForm } from "./CreateProjectForm";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { orgId, isNew } = await ensureWorkspace(userId);
  const client = createCentraliServerClient();

  const orgRes = await client.queryRecords("organizations", {
    "data.ownerId": userId,
    pageSize: 1,
  });
  const org = orgRes?.data?.[0];

  const membersRes = await client.queryRecords("members", {
    "data.orgId": orgId,
  });
  const memberCount = membersRes?.data?.length ?? 0;

  const projectsRes = await client.queryRecords("projects", {
    "data.orgId": orgId,
    sort: "-createdAt",
  });
  const projects = projectsRes?.data ?? [];

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
