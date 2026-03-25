import { useEffect, useState } from "react";
import { centrali } from "./centrali";

interface Record {
  id: string;
  data: { [key: string]: unknown };
  createdAt: string;
}

export default function App() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isConfigured =
    import.meta.env.VITE_CENTRALI_WORKSPACE &&
    import.meta.env.VITE_CENTRALI_API_KEY;

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Replace "your-collection" with your collection's recordSlug
    centrali.records
      .list("your-collection")
      .then((res) => {
        setRecords(res.data?.data ?? []);
      })
      .catch((err) => {
        setError(err.message ?? "Failed to fetch records");
      })
      .finally(() => setLoading(false));
  }, [isConfigured]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900">
          {{projectName}}
        </h1>
        <p className="mt-2 text-gray-500">
          Powered by{" "}
          <a
            href="https://centrali.io"
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener"
          >
            Centrali
          </a>
        </p>

        <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
          {!isConfigured ? (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Get started
              </h2>
              <ol className="mt-4 list-inside list-decimal space-y-2 text-gray-600">
                <li>
                  Copy <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">.env.example</code> to{" "}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">.env</code>
                </li>
                <li>Add your workspace slug and API key</li>
                <li>
                  Update <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">App.tsx</code> with
                  your collection's recordSlug
                </li>
                <li>Restart the dev server</li>
              </ol>
            </div>
          ) : loading ? (
            <p className="text-gray-500">Loading records...</p>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : records.length === 0 ? (
            <p className="text-gray-500">
              No records found. Create some in the Centrali console.
            </p>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Records ({records.length})
              </h2>
              <div className="mt-4 space-y-3">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                  >
                    <pre className="text-sm text-gray-700 overflow-x-auto">
                      {JSON.stringify(record.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
