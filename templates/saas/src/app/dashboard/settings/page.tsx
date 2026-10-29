import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ensureWorkspace } from "@/lib/bootstrap";
import { createCentraliServerClient } from "@/lib/centrali";
import { InviteMemberForm } from "./InviteMemberForm";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // ensureWorkspace never throws; it reports failure by returning a null
  // orgId. Without this guard the page queried members with orgId === null
  // and handed null to a component typed `orgId: string`, which is why
  // `next build` failed to type check.
  const { orgId, error: bootstrapError } = await ensureWorkspace(userId);
  if (!orgId) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Could not set up your organization
          {bootstrapError ? `: ${bootstrapError}` : "."} Check that the service account
          credentials are valid and that <code>npm run setup</code> has created the
          organizations, members and projects collections, then reload.
        </div>
      </div>
    );
  }

  const client = createCentraliServerClient();

  const orgRes = await client.queryRecords("organizations", {
    "data.ownerId": userId,
    pageSize: 1,
  });
  const org = orgRes?.data?.[0];

  const membersRes = await client.queryRecords("members", {
    "data.orgId": orgId,
    sort: "-createdAt",
  });
  const members = membersRes?.data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your organization and team members.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Organization
        </h3>
        <div className="text-sm text-gray-700">
          <p>
            <span className="text-gray-500">Name:</span>{" "}
            {org?.data?.name ?? "My Organization"}
          </p>
          <p>
            <span className="text-gray-500">Plan:</span>{" "}
            {org?.data?.plan ?? "free"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Members ({members.length})
          </h3>
          <InviteMemberForm orgId={orgId} />
        </div>
        {members.length === 0 ? (
          <p className="text-sm text-gray-500">No members yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {member.data.email ?? member.data.userId}
                  </p>
                  <p className="text-xs text-gray-500">{member.data.role}</p>
                </div>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    member.data.status === "active"
                      ? "bg-green-50 text-green-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}
                >
                  {member.data.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
