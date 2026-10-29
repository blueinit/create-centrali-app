import { createCentraliServerClient, hasCentraliCredentials } from "@/lib/centrali";
import { describeCentraliError } from "@/lib/errors";
import Link from "next/link";
import { CreateCollectionForm } from "./CreateCollectionForm";

// Credentials are read from the environment at request time, not at build
// time. Without this, `next build` prerenders this route as static HTML — so a
// build that ran before the environment was configured would keep serving the
// "Get started" screen even after valid credentials were supplied.
export const dynamic = "force-dynamic";

export default async function Home() {
  if (!hasCentraliCredentials()) {
    return (
      <Shell>
        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Get started</h2>
          <ol className="mt-4 list-inside list-decimal space-y-2 text-gray-600">
            <li>
              Copy <Code>.env.example</Code> to <Code>.env.local</Code>
            </li>
            <li>
              Set <Code>CENTRALI_WORKSPACE</Code>, <Code>CENTRALI_CLIENT_ID</Code> and{" "}
              <Code>CENTRALI_CLIENT_SECRET</Code>
            </li>
            <li>
              Run <Code>npm run setup</Code> to create the demo collection
            </li>
            <li>Restart the dev server</li>
          </ol>
          <p className="mt-4 text-sm text-gray-500">
            Create a service account in the{" "}
            <a href="https://centrali.io" className="text-blue-600 hover:underline" target="_blank" rel="noopener">
              Centrali console
            </a>
            {" "}&rarr; ACCESS &rarr; Service Accounts, then add it to the{" "}
            <strong>workspace_administrators</strong> or <strong>workspace_developers</strong> group so
            it can create collections.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Prefer not to type secrets by hand? Run{" "}
            <Code>npx @centrali-io/create-centrali-app env</Code>.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Once your app needs per-user access, you can keep this server-side path and add your own
            auth provider on top, passing user tokens to the SDK. See the{" "}
            <a href="https://docs.centrali.io/authentication/external-auth/" className="text-blue-600 hover:underline" target="_blank" rel="noopener">
              external auth (BYOT) docs
            </a>
            .
          </p>
        </Card>
      </Shell>
    );
  }

  let collections: any[] = [];
  let error: string | null = null;

  try {
    const centrali = createCentraliServerClient();
    const res = await centrali.collections.list();
    collections = res.data ?? [];
  } catch (err: any) {
    // The SDK's own message is only ever "Request failed with status code
    // 401" — route credential and permission failures through the shared
    // helper so the first-run problem is actually diagnosable.
    error = describeCentraliError(err, "list collections");
  }

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Collections</h2>
      </div>

      <CreateCollectionForm />

      {error ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : collections.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">No collections yet.</p>
            <p className="mt-1 text-sm text-gray-400">
              Run <Code>npm run setup</Code>, or create one with the form above.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {collections.map((col: any) => (
            <Link
              key={col.id}
              href={`/collections/${col.recordSlug}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm"
            >
              <div>
                <p className="font-medium text-gray-900">{col.name}</p>
                <p className="text-sm text-gray-500">{col.recordSlug}</p>
              </div>
              <div className="text-sm text-gray-400">
                {col.properties?.length ?? 0} fields &rarr;
              </div>
            </Link>
          ))}
        </div>
      )}

      <LocalDemoNotice />
    </Shell>
  );
}

function LocalDemoNotice() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-medium">Local demo boundary</p>
      <p className="mt-1">
        The routes in this template hold service account credentials and have no application-level
        access rules — anyone who can reach them can read and write your workspace. That is fine for
        local development. Before deploying this publicly, add your own authentication and
        authorization to <Code>/api/collections</Code> and <Code>/api/records</Code>, and use
        separate development and production credentials. See <Code>DEPLOY.md</Code>.
      </p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{"{{projectName}}"}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Powered by{" "}
            <a href="https://centrali.io" className="text-blue-600 hover:underline" target="_blank" rel="noopener">
              Centrali
            </a>
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-gray-200 bg-white p-5">{children}</div>;
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">{children}</code>;
}
