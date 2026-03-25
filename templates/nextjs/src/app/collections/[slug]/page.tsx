import { createCentraliClient } from "@/lib/centrali";
import Link from "next/link";
import { CreateRecordForm } from "./CreateRecordForm";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let collection: any = null;
  let records: any[] = [];
  let error: string | null = null;

  try {
    const centrali = createCentraliClient();
    const colRes = await centrali.collections.getBySlug(slug);
    collection = colRes.data;
    const recRes = await centrali.queryRecords(slug);
    records = recRes?.data ?? [];
  } catch (err: any) {
    error = err.message ?? "Failed to load collection";
  }

  if (error) {
    return (
      <Shell slug={slug}>
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      </Shell>
    );
  }

  const fields = (collection?.properties ?? []).filter(
    (p: any) => !["id", "createdAt", "updatedAt", "createdBy"].includes(p.name),
  );

  return (
    <Shell slug={slug}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {collection?.name ?? slug}
          </h2>
          <p className="text-sm text-gray-500">{records.length} records</p>
        </div>
      </div>

      <CreateRecordForm collectionSlug={slug} fields={fields} />

      {records.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center py-8">
          <p className="text-gray-500">No records yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Use the form above to add your first record.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record: any) => (
            <div key={record.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <pre className="flex-1 text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(record.data, null, 2)}
                </pre>
                <span className="ml-4 shrink-0 text-xs text-gray-400">
                  {new Date(record.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}

function Shell({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{"{{projectName}}"}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Powered by{" "}
              <a href="https://centrali.io" className="text-blue-600 hover:underline" target="_blank" rel="noopener">
                Centrali
              </a>
            </p>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            &larr; All collections
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
