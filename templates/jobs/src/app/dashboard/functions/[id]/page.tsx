"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatDuration, formatRelativeTime, statusColor, executionSourceLabel } from "@/lib/utils";

const RUN_STATUSES = ["", "pending", "running", "completed", "failure", "timeout"];

export default function FunctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [fn, setFn] = useState<any>(null);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadFunction() {
    try {
      const res = await fetch(`/api/functions/${id}`);
      const json = await res.json();
      setFn(json.data);
    } catch {}
  }

  async function loadTriggers() {
    try {
      const res = await fetch(`/api/triggers?functionId=${id}`);
      const json = await res.json();
      setTriggers((json.data ?? []).filter((t: any) => t.functionId === id));
    } catch {}
  }

  async function loadRuns() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/functions/${id}/runs?${params}`);
      const json = await res.json();
      setRuns(json.data ?? []);
      setMeta(json.meta ?? {});
    } catch {} finally {
      setLoading(false);
    }
  }

  async function toggleTrigger(triggerId: string, enabled: boolean) {
    const action = enabled ? "pause" : "resume";
    await fetch(`/api/triggers/${triggerId}/${action}`, { method: "PATCH" });
    loadTriggers();
  }

  useEffect(() => { loadFunction(); loadTriggers(); }, [id]);
  useEffect(() => { loadRuns(); }, [id, page, statusFilter]);

  if (!fn && loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <div className="text-sm text-gray-500">
        <Link href="/dashboard" className="text-blue-600 no-underline hover:underline">Dashboard</Link>
        {" > "}
        <span className="text-gray-900">{fn?.name ?? "Function"}</span>
      </div>

      {/* Function info */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h1 className="font-mono text-lg font-semibold text-gray-900">{fn?.name}</h1>
        <p className="mt-1 text-sm text-gray-500">{fn?.description}</p>
        <div className="mt-3 flex gap-4 text-xs text-gray-400">
          <span>Timeout: {fn?.timeoutMs ? `${fn.timeoutMs / 1000}s` : "—"}</span>
          {fn?.createdAt && <span>Created: {new Date(fn.createdAt).toLocaleDateString()}</span>}
        </div>
      </div>

      {/* Triggers */}
      {triggers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Triggers</h2>
          <div className="space-y-2">
            {triggers.map((t: any) => {
              const typeColor =
                t.executionType === "event-driven" ? "bg-blue-100 text-blue-700" :
                t.executionType === "scheduled" ? "bg-purple-100 text-purple-700" :
                "bg-gray-100 text-gray-700";
              return (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColor}`}>
                      {t.executionType}
                    </span>
                    <span className="text-sm text-gray-900">{t.name}</span>
                    {t.triggerMetadata?.cronExpression && (
                      <span className="font-mono text-xs text-gray-400">{t.triggerMetadata.cronExpression}</span>
                    )}
                    {t.triggerMetadata?.event && (
                      <span className="text-xs text-gray-400">{t.triggerMetadata.event} on {t.triggerMetadata.recordSlug}</span>
                    )}
                  </div>
                  {t.executionType !== "on-demand" && (
                    <button
                      onClick={() => toggleTrigger(t.id, t.enabled !== false)}
                      className={`rounded px-2.5 py-1 text-xs font-medium ${
                        t.enabled !== false
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {t.enabled !== false ? "Active" : "Paused"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Run history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Run History</h2>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
          >
            {RUN_STATUSES.map((s) => (
              <option key={s} value={s}>{s || "All statuses"}</option>
            ))}
          </select>
        </div>

        {runs.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-8 text-center text-sm text-gray-500">
            No runs found
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 font-medium text-gray-500">Started</th>
                  <th className="px-4 py-2 font-medium text-gray-500">Duration</th>
                  <th className="px-4 py-2 font-medium text-gray-500">Source</th>
                  <th className="px-4 py-2 font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {runs.map((run: any) => (
                  <tr key={run.id}>
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(run.status)}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500" title={run.startedAt}>
                      {formatRelativeTime(run.startedAt)}
                    </td>
                    <td className="px-4 py-2 text-gray-500">
                      {formatDuration(run.startedAt, run.endedAt)}
                    </td>
                    <td className="px-4 py-2">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                        {executionSourceLabel(run.executionSource)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Link href={`/dashboard/runs/${run.id}`} className="text-blue-600 no-underline hover:underline text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {(meta.total ?? 0) > 15 && (
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={runs.length < 15}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
