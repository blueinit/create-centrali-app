import { centrali } from "@/lib/centrali";
import Link from "next/link";
import { CreateCollectionForm } from "./CreateCollectionForm";

export default async function Home() {
  const isConfigured =
    process.env.CENTRALI_WORKSPACE && process.env.CENTRALI_API_KEY;

  if (!isConfigured) {
    return (
      <Shell>
        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Get started</h2>
          <ol className="mt-4 list-inside list-decimal space-y-2 text-gray-600">
            <li>
              Copy <Code>.env.example</Code> to <Code>.env</Code>
            </li>
            <li>Add your Centrali workspace slug and API key</li>
            <li>Restart the dev server</li>
          </ol>
          <p className="mt-4 text-sm text-gray-500">
            Get your API key from the{" "}
            <a href="https://centrali.io" className="text-blue-600 hover:underline" target="_blank" rel="noopener">
              Centrali console
            </a>
            {" "}&rarr; Settings &rarr; API Keys.
          </p>
        </Card>
      </Shell>
    );
  }

  let collections: any[] = [];
  let error: string | null = null;

  try {
    const res = await centrali.collections.list();
    collections = res.data ?? [];
  } catch (err: any) {
    error = err.message ?? "Failed to fetch collections";
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
              Create your first collection to start building.
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
    </Shell>
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
