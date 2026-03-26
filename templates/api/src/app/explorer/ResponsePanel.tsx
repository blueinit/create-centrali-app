"use client";

interface ResponsePanelProps {
  loading: boolean;
  data: any;
  error: string | null;
  status?: number | null;
}

export function ResponsePanel({ loading, data, error, status }: ResponsePanelProps) {
  if (loading) {
    return (
      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-700">Error</p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (data === null) return null;

  return (
    <div className="mt-3">
      {status && (
        <p className="mb-1 text-xs text-gray-500">
          Status: <span className="font-mono">{status}</span>
        </p>
      )}
      <pre className="max-h-96 overflow-auto rounded-lg border border-gray-200 bg-gray-900 p-4 text-sm text-green-400">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
