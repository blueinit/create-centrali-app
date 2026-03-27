"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatDuration, statusColor, executionSourceLabel } from "@/lib/utils";

export default function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/runs/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setRun(json.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm text-gray-500">Loading run...</p>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error ?? "Run not found"}
        </div>
      </div>
    );
  }

  const hasFailed = run.status === "failure" || run.status === "timeout";

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <div className="text-sm text-gray-500">
        <Link href="/dashboard" className="text-blue-600 no-underline hover:underline">Dashboard</Link>
        {" > "}
        <span className="text-gray-900">Run {run.id.slice(0, 8)}...</span>
      </div>

      {/* Status header */}
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColor(run.status)}`}>
          {run.status}
        </span>
        <span className="font-mono text-sm text-gray-500">{run.id}</span>
      </div>

      {/* Timing */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Timing</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Started</p>
            <p className="text-gray-900">{run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Ended</p>
            <p className="text-gray-900">{run.endedAt ? new Date(run.endedAt).toLocaleString() : "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Duration</p>
            <p className="text-gray-900">{formatDuration(run.startedAt, run.endedAt)}</p>
          </div>
          <div>
            <p className="text-gray-500">Source</p>
            <p className="text-gray-900">{executionSourceLabel(run.executionSource)}</p>
          </div>
        </div>
      </div>

      {/* Resource usage */}
      {(run.memoryUsageBytes || run.cpuUsageSeconds) && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Resource Usage</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {run.memoryUsageBytes && (
              <div>
                <p className="text-gray-500">Memory</p>
                <p className="text-gray-900">
                  {run.memoryUsageBytes > 1048576
                    ? `${(run.memoryUsageBytes / 1048576).toFixed(1)} MB`
                    : `${(run.memoryUsageBytes / 1024).toFixed(0)} KB`}
                </p>
              </div>
            )}
            {run.cpuUsageSeconds && (
              <div>
                <p className="text-gray-500">CPU Time</p>
                <p className="text-gray-900">{run.cpuUsageSeconds.toFixed(2)}s</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {hasFailed && (run.errorMessage || run.errorCode) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="text-sm font-semibold text-red-900 mb-2">Error</h2>
          {run.errorCode && (
            <p className="text-xs text-red-500 mb-1">Code: {run.errorCode}</p>
          )}
          <p className="text-sm text-red-700">{run.errorMessage}</p>
        </div>
      )}

      {/* Run data */}
      {run.runData != null && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Output</h2>
          <pre className="max-h-96 overflow-auto rounded-lg border border-gray-200 bg-gray-900 p-4 text-sm text-green-400">
            {JSON.stringify(run.runData, null, 2)}
          </pre>
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Metadata</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Job ID</p>
            <p className="font-mono text-xs text-gray-700">{run.jobId ?? "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Trigger Type</p>
            <p className="text-gray-700">{run.triggerType ?? "—"}</p>
          </div>
          {run.rerunCount > 0 && (
            <>
              <div>
                <p className="text-gray-500">Rerun Count</p>
                <p className="text-gray-700">{run.rerunCount}</p>
              </div>
              <div>
                <p className="text-gray-500">Rerun Reason</p>
                <p className="text-gray-700">{run.rerunReason ?? "—"}</p>
              </div>
            </>
          )}
          {run.functionVersion && (
            <div>
              <p className="text-gray-500">Function Version</p>
              <p className="font-mono text-xs text-gray-700">{run.functionVersion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
